import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { XMLParser } from "fast-xml-parser";
import type { Article, NewsCategory, NewsPayload } from "../src/types/news.ts";
import { CURATED_NEWS } from "../src/data/curatedNews.js";
import { fetchDirectFeeds } from "./directFeeds.js";

interface SearchQuery {
  category: NewsCategory;
  q: string;
  /** Kueri sederhana untuk Bing (operator OR sering menghasilkan feed kosong) */
  bingQ: string;
  /** Bila diisi: artikel harus memuat pola ini, dan filter topik lingkungan dilewati. */
  mustMatch?: RegExp;
  /** Batas usia berita untuk Google News (operator "when:"), mis. "30d". */
  when: string;
}

interface RssSource {
  "#text"?: string;
}

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  source?: string | RssSource;
  "News:Source"?: string;
  "News:Image"?: string;
}

type Provider = "google" | "bing";

interface RssFeed {
  rss?: {
    channel?: {
      item?: RssItem | RssItem[];
    };
  };
}

const SEARCHES: SearchQuery[] = [
  { category: "pilah-sampah", q: "pilah sampah OR pemilahan sampah", bingQ: "pilah sampah", when: "30d" },
  { category: "dampak-sampah", q: "dampak sampah OR pencemaran sampah", bingQ: "dampak sampah", when: "30d" },
  { category: "go-green", q: "go green OR ramah lingkungan Indonesia", bingQ: "go green", when: "30d" },
  { category: "jaga-lingkungan", q: "jaga lingkungan OR kelestarian lingkungan", bingQ: "jaga lingkungan", when: "30d" },
  {
    category: "jerhemy-owen",
    q: '"Jerhemy Owen"',
    bingQ: "Jerhemy Owen",
    mustMatch: /jerhemy\s+owen/i,
    when: "365d",
  },
];

const REQUEST_TIMEOUT_MS = 8_000;
const PAGE_TIMEOUT_MS = 3_500;
const MAX_ARTICLES = 36;
const MAX_ENRICH = 36;
const CACHE_TTL_MS = 5 * 60 * 1000;
const AUTO_REFRESH_MS = 5 * 60 * 1000;
const FIRST_WAIT_MS = 2_500;
const ENRICH_CONCURRENCY = 8;
/** Google membatasi permintaan (HTTP 429): beri jeda antar-permintaan dan berhenti sementara bila diblokir. */
const GOOGLE_GAP_MS = 700;
const GOOGLE_COOLDOWN_MS = 15 * 60 * 1000;
const MAX_GOOGLE_PER_CYCLE = 14;
const LINKS_FILE = join(tmpdir(), "ecokampus-news-links.json");
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const IRRELEVANT =
  /sampah masyarakat|sampah sosial|judi|slot gacor|togel|pemilu|pilkada|\bpartai\b|politik praktis/i;

const RELEVANT =
  /sampah|lingkungan|hijau|plastik|daur ulang|go green|organik|anorganik|tpa|limbah|kompos|tumbler|hutan|sungai|polusi|iklim|bumi/i;

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
});

function hashId(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

function asItems(item: RssItem | RssItem[] | undefined): RssItem[] {
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(raw: string): { title: string; sourceHint: string } {
  const trimmed = stripHtml(raw);
  const idx = trimmed.lastIndexOf(" - ");
  if (idx > 12) {
    let title = trimmed.slice(0, idx).trim();
    const sourceHint = trimmed.slice(idx + 3).trim();
    // Kadang ada dua akhiran: "Judul - situs.co.id - Nama Media"
    const again = /\s-\s[\w.-]+\.[a-z]{2,}$/i.exec(title);
    if (again && again.index > 12) title = title.slice(0, again.index).trim();
    return { title, sourceHint };
  }
  return { title: trimmed, sourceHint: "" };
}

function sourceName(item: RssItem, hint: string): string {
  if (typeof item.source === "string" && item.source.trim()) return item.source.trim();
  if (item.source && typeof item.source === "object" && item.source["#text"]) {
    return item.source["#text"].trim();
  }
  return hint || "Media daring";
}

function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function toIso(pubDate: string | undefined): string {
  if (!pubDate) return new Date().toISOString();
  const parsed = new Date(pubDate);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function truncate(text: string, max = 200): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function safeImage(raw: unknown, base?: string): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  try {
    const url = new URL(raw.trim().replace(/&amp;/g, "&"), base);
    if (url.protocol === "http:") url.protocol = "https:";
    if (url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

/** Google News mengulang judul + nama media di deskripsi; buang agar tidak dobel. */
function cleanSummary(raw: string, title: string, source: string): string {
  let text = stripHtml(raw);
  const nt = normalizeTitle(title);
  if (normalizeTitle(text).startsWith(nt)) {
    text = text.slice(Math.min(text.length, title.length)).trim();
  }
  if (source && text.toLowerCase().endsWith(source.toLowerCase())) {
    text = text.slice(0, text.length - source.length).trim();
  }
  text = text.replace(/^[-–—:·\s]+/, "").trim();
  return text.length >= 30 ? truncate(text) : "";
}

/** Bing membungkus tautan asli di parameter ?url= pada apiclick.aspx. */
function unwrapBingLink(link: string): string {
  try {
    const u = new URL(link);
    const real = u.searchParams.get("url");
    if (real && isHttpUrl(real)) return real;
  } catch {
    /* pakai link apa adanya */
  }
  return link;
}

async function fetchRss(provider: Provider, query: SearchQuery): Promise<Article[]> {
  const q = encodeURIComponent(provider === "bing" ? query.bingQ : `${query.q} when:${query.when}`);
  const url =
    provider === "bing"
      ? `https://www.bing.com/news/search?q=${q}&format=rss&setmkt=id-ID&setlang=id`
      : `https://news.google.com/rss/search?q=${q}&hl=id&gl=ID&ceid=ID:id`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { "User-Agent": BROWSER_UA, Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!response.ok) {
    throw new Error(`RSS ${provider}/${query.category} gagal (${response.status})`);
  }
  const xml = await response.text();
  const feed = parser.parse(xml) as RssFeed;
  const items = asItems(feed.rss?.channel?.item);

  const articles: Article[] = [];
  for (const item of items) {
    const rawLink = item.link?.trim() ?? "";
    const link = provider === "bing" ? unwrapBingLink(rawLink) : rawLink;
    if (!isHttpUrl(link)) continue;
    const { title, sourceHint } = cleanTitle(item.title ?? "");
    if (!title) continue;
    const source =
      provider === "bing" && typeof item["News:Source"] === "string"
        ? item["News:Source"].trim()
        : sourceName(item, sourceHint);
    const summary = cleanSummary(item.description ?? "", title, source);
    const haystack = `${title} ${summary}`;
    if (query.mustMatch) {
      if (!query.mustMatch.test(haystack)) continue;
    } else if (IRRELEVANT.test(haystack) || !RELEVANT.test(haystack)) {
      continue;
    }

    articles.push({
      id: hashId(link),
      title,
      summary,
      url: link,
      source: source || "Media daring",
      publishedAt: toIso(item.pubDate),
      category: query.category,
      imageUrl: provider === "bing" ? safeImage(item["News:Image"]) : undefined,
    });
  }
  return articles;
}

function metaContent(html: string, key: string): string | undefined {
  const a = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`,
    "i",
  ).exec(html);
  if (a) return a[1];
  const b = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  ).exec(html);
  return b?.[1];
}

function loadLinks(): Map<string, string | null> {
  try {
    const data = JSON.parse(readFileSync(LINKS_FILE, "utf8")) as Record<string, string>;
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}
/** Tautan yang sudah berhasil diurai disimpan di disk agar restart server tidak mengulang ke Google. */
const resolvedLinks = loadLinks();
function saveLinks(): void {
  try {
    const data: Record<string, string> = {};
    for (const [key, value] of resolvedLinks) if (value) data[key] = value;
    writeFileSync(LINKS_FILE, JSON.stringify(data));
  } catch {
    /* folder tidak bisa ditulis: abaikan */
  }
}
let googleBlockedUntil = 0;
let googleNextSlot = 0;
async function googleSlot(): Promise<void> {
  const now = Date.now();
  const at = Math.max(now, googleNextSlot);
  googleNextSlot = at + GOOGLE_GAP_MS;
  if (at > now) await new Promise<void>((resolve) => setTimeout(resolve, at - now));
}
/** Diagnosa sementara pengurai tautan Google (ikut dikirim di /api/news sebagai "diag"). */
const diag: { ok: number; fail: Record<string, number> } = { ok: 0, fail: {} };
function noteFail(reason: string): void {
  const key = reason.slice(0, 80);
  diag.fail[key] = (diag.fail[key] ?? 0) + 1;
}

function isGoogleNewsLink(url: string): boolean {
  try {
    return new URL(url).hostname === "news.google.com";
  } catch {
    return false;
  }
}

/** Decode tautan Google News (…/articles/<id>) menjadi alamat artikel asli. */
async function decodeGoogleArticle(id: string): Promise<string | null> {
  const bytes = Buffer.from(id, "base64url");
  let start = 0;
  if (bytes[0] === 0x08 && bytes[1] === 0x13 && bytes[2] === 0x22) start = 3;
  let end = bytes.length;
  if (bytes[end - 3] === 0xd2 && bytes[end - 2] === 0x01 && bytes[end - 1] === 0x00) end -= 3;
  const body = bytes.subarray(start, end);
  let offset = 1;
  let length = body[0] ?? 0;
  if (length >= 0x80) {
    length = (body[0] & 0x7f) | ((body[1] ?? 0) << 7);
    offset = 2;
  }
  const text = body.subarray(offset, offset + length).toString("utf8");
  if (!text.startsWith("AU_yqL")) return isHttpUrl(text) ? text : null;

  // Format baru: perlu tanda tangan dari halaman artikel, lalu batchexecute.
  const page = await fetch(`https://news.google.com/articles/${id}`, {
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    headers: { "User-Agent": BROWSER_UA },
  });
  if (page.status === 429) googleBlockedUntil = Date.now() + GOOGLE_COOLDOWN_MS;
  if (!page.ok) throw new Error(`halaman artikel HTTP ${page.status}`);
  const html = await page.text();
  const sg = /data-n-a-sg="([^"]+)"/.exec(html)?.[1];
  const ts = /data-n-a-ts="([^"]+)"/.exec(html)?.[1];
  if (!sg || !ts) throw new Error(`tanpa tanda tangan (len=${html.length}, consent=${/consent/i.test(html)})`);

  const inner = JSON.stringify([
    "garturlreq",
    [
      ["X", "X", ["X", "X"], null, null, 1, 1, "US:en", null, 1, null, null, null, null, null, 0, 1],
      "X",
      "X",
      1,
      [1, 1, 1],
      1,
      1,
      null,
      0,
      0,
      null,
      0,
    ],
    id,
    Number(ts),
    sg,
  ]);
  const reqBody = `f.req=${encodeURIComponent(JSON.stringify([[["Fbv4je", inner, null, "generic"]]]))}`;
  const response = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
    method: "POST",
    signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": BROWSER_UA,
    },
    body: reqBody,
  });
  if (response.status === 429) googleBlockedUntil = Date.now() + GOOGLE_COOLDOWN_MS;
  if (!response.ok) throw new Error(`batchexecute HTTP ${response.status}`);
  const raw = (await response.text()).split("\n\n")[1];
  if (!raw) throw new Error("batchexecute kosong");
  const outer = JSON.parse(raw) as unknown[][];
  const innerStr = outer[0]?.[2];
  if (typeof innerStr !== "string") return null;
  const arr = JSON.parse(innerStr) as unknown[];
  const url = arr[1];
  return typeof url === "string" && isHttpUrl(url) ? url : null;
}

async function resolveGoogleLink(link: string): Promise<string | null> {
  if (resolvedLinks.has(link)) return resolvedLinks.get(link) ?? null;
  const id = /\/articles\/([^?/]+)/.exec(link)?.[1];
  let result: string | null = null;
  if (id) {
    if (Date.now() < googleBlockedUntil) return null; // sedang dibatasi Google: coba lagi nanti
    await googleSlot();
    if (Date.now() < googleBlockedUntil) return null;
    try {
      result = await decodeGoogleArticle(id);
      if (!result) noteFail("hasil tanpa url");
    } catch (error) {
      noteFail(error instanceof Error ? error.message : "error");
      result = null;
    }
  }
  if (result) {
    diag.ok += 1;
    resolvedLinks.set(link, result);
  }
  return result;
}

async function runPool<T>(items: T[], size: number, worker: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next];
      next += 1;
      await worker(item);
    }
  });
  await Promise.allSettled(lanes);
}

/** Ambil og:image / og:description dari halaman berita asli. */
async function enrich(article: Article): Promise<void> {
  try {
    if (isGoogleNewsLink(article.url)) {
      const real = await resolveGoogleLink(article.url);
      if (!real) return;
      article.url = real; // kartu langsung menuju situs media asli
    }
    const host = new URL(article.url).hostname;
    if (/(^|\.)(news\.google\.com|bing\.com)$/i.test(host)) return;
    const response = await fetch(article.url, {
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      headers: { "User-Agent": BROWSER_UA, Accept: "text/html" },
      redirect: "follow",
    });
    if (!response.ok) return;
    const html = (await response.text()).slice(0, 250_000);
    if (!article.imageUrl) {
      article.imageUrl = safeImage(
        metaContent(html, "og:image") ?? metaContent(html, "twitter:image"),
        response.url,
      );
    }
    if (!article.summary) {
      const desc = metaContent(html, "og:description") ?? metaContent(html, "description");
      if (desc) article.summary = cleanSummary(desc, article.title, article.source);
    }
  } catch {
    /* gagal diam-diam: kartu tetap tampil dengan placeholder */
  }
}

let cache: { at: number; payload: NewsPayload } | null = null;
let refreshing: Promise<NewsPayload> | null = null;
let enriching: Promise<void> | null = null;

/** Hasil pengayaan (tautan asli, gambar, ringkasan) per artikel, dipakai ulang saat cache diperbarui. */
const enrichedById = new Map<string, { url: string; imageUrl?: string; summary: string }>();

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Tahap cepat: hanya RSS (±1–2 detik). Gambar dan ringkasan menyusul di latar belakang. */
async function buildBase(): Promise<NewsPayload> {
  const [settled, direct] = await Promise.all([
    Promise.allSettled(SEARCHES.map((query) => fetchRss("google", query))),
    fetchDirectFeeds().catch(() => [] as Article[]),
  ]);
  const byTitle = new Map<string, Article>();
  const seenUrl = new Set<string>();

  for (const curated of CURATED_NEWS) {
    byTitle.set(normalizeTitle(curated.title), curated);
    seenUrl.add(curated.url);
  }

  // Feed langsung dulu: tautan aslinya sudah ada dan gambarnya lengkap, jadi menang atas duplikat Google.
  const groups: Article[][] = [
    direct,
    ...settled.flatMap((result) => (result.status === "fulfilled" ? [result.value] : [])),
  ];
  for (const group of groups) {
    for (const article of group) {
      const key = normalizeTitle(article.title);
      if (byTitle.has(key) || seenUrl.has(article.url)) continue;
      seenUrl.add(article.url);
      byTitle.set(key, article);
    }
  }

  const all = [...byTitle.values()];
  const curated = all.filter((item) => item.curated);
  const byDate = (a: Article, b: Article) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  const liveAll = all.filter((item) => !item.curated).sort(byDate);
  // Berita Jerhemy Owen dijatah sendiri agar tidak tergeser berita lingkungan yang lebih baru.
  const person = liveAll.filter((item) => item.category === "jerhemy-owen").slice(0, 8);
  const others = liveAll.filter((item) => item.category !== "jerhemy-owen").slice(0, MAX_ARTICLES);
  const live = [...others, ...person].sort(byDate);

  for (const article of live) {
    const known = enrichedById.get(article.id);
    if (known) {
      article.url = known.url;
      article.imageUrl = known.imageUrl;
      if (known.summary) article.summary = known.summary;
    }
  }

  return { articles: [...curated, ...live], updatedAt: new Date().toISOString() };
}

/** Lengkapi gambar/ringkasan di latar belakang; objek artikel diperbarui di tempat (ikut ter-cache). */
function startEnrich(payload: NewsPayload): Promise<void> {
  let googleBudget = MAX_GOOGLE_PER_CYCLE;
  const needs = payload.articles
    .filter((a) => !a.curated && (!a.imageUrl || !a.summary || isGoogleNewsLink(a.url)))
    .filter((a) => {
      if (!isGoogleNewsLink(a.url) || resolvedLinks.get(a.url)) return true;
      googleBudget -= 1; // batasi jumlah tautan Google baru per putaran
      return googleBudget >= 0;
    })
    .slice(0, MAX_ENRICH);
  return runPool(needs, ENRICH_CONCURRENCY, async (article) => {
    await enrich(article);
    enrichedById.set(article.id, {
      url: article.url,
      imageUrl: article.imageUrl,
      summary: article.summary,
    });
  }).then(saveLinks);
}

async function refresh(): Promise<NewsPayload> {
  const payload = await buildBase();
  // Jangan simpan hasil yang hanya berisi berita redaksi (sumber online gagal)
  if (payload.articles.some((a) => !a.curated)) cache = { at: Date.now(), payload };
  enriching = startEnrich(payload).finally(() => {
    enriching = null;
  });
  return payload;
}

/** Panaskan cache saat server menyala, lalu perbarui berkala agar pengunjung selalu dapat data baru. */
export function startBackgroundRefresh(): void {
  const run = (): void => {
    if (refreshing) return;
    refreshing = refresh().finally(() => {
      refreshing = null;
    });
    refreshing.catch(() => undefined);
  };
  run();
  const timer = setInterval(run, AUTO_REFRESH_MS);
  timer.unref?.();
}
/**
 * Strategi cepat:
 *  - cache ada  → langsung dikembalikan (jika kedaluwarsa, diperbarui diam-diam di latar belakang)
 *  - cache kosong → ambil RSS saja (cepat), tunggu pengayaan maksimal FIRST_WAIT_MS, sisanya menyusul
 */
export async function fetchNewsFeed(): Promise<NewsPayload> {
  if (cache) {
    if (Date.now() - cache.at >= CACHE_TTL_MS && !refreshing) {
      refreshing = refresh().finally(() => {
        refreshing = null;
      });
      refreshing.catch(() => undefined);
    }
    return Object.assign({}, cache.payload, { diag });
  }
  if (!refreshing) {
    refreshing = refresh().finally(() => {
      refreshing = null;
    });
  }
  const payload = await refreshing;
  if (enriching) await Promise.race([enriching, sleep(FIRST_WAIT_MS)]);
  return payload;
}

/** Diagnosa sumber berita (dipakai lewat /api/news?debug=1 saat dev). */
export async function debugProviders(): Promise<unknown[]> {
  const query = SEARCHES[0];
  const q = encodeURIComponent(query.q);
  const targets: Array<{ name: string; url: string }> = [
    { name: "bing", url: `https://www.bing.com/news/search?q=${q}&format=rss&setmkt=id-ID&setlang=id` },
    { name: "google", url: `https://news.google.com/rss/search?q=${q}&hl=id&gl=ID&ceid=ID:id` },
  ];
  return Promise.all(
    targets.map(async (t) => {
      try {
        const response = await fetch(t.url, {
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          headers: { "User-Agent": BROWSER_UA, Accept: "application/rss+xml, application/xml, text/xml" },
        });
        const text = await response.text();
        const feed = parser.parse(text) as RssFeed;
        const items = asItems(feed.rss?.channel?.item);
        let resolveTest: unknown = null;
        if (t.name === "google" && items[0]?.link) {
          const real = await resolveGoogleLink(items[0].link);
          resolveTest = { resolvedUrl: real };
          if (real) {
            const probe: Article = {
              id: "probe", title: "probe", summary: "", url: real, source: "", publishedAt: "", category: "go-green",
            };
            await enrich(probe);
            resolveTest = { resolvedUrl: real, imageUrl: probe.imageUrl ?? null, summary: probe.summary };
          }
        }
        return {
          resolveTest,
          provider: t.name,
          status: response.status,
          contentType: response.headers.get("content-type"),
          length: text.length,
          items: items.length,
          firstItemKeys: items[0] ? Object.keys(items[0]) : [],
          firstItem: items[0] ?? null,
          head: text.slice(0, 300),
        };
      } catch (error) {
        return { provider: t.name, error: String(error) };
      }
    }),
  );
}
