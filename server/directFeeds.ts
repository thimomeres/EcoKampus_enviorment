import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import type { Article, NewsCategory } from "../src/types/news.ts";

/**
 * Feed RSS langsung dari media (tanpa Google): tautannya sudah alamat asli dan
 * gambarnya ada di dalam feed, jadi cepat dan tidak kena pembatasan Google (HTTP 429).
 */
interface DirectFeed {
  url: string;
  source: string;
  /** Kategori bawaan bila isi artikel tidak cocok dengan kata kunci mana pun. */
  fallback?: NewsCategory;
}

const MONGABAY = "https://www.mongabay.co.id";

const DIRECT_FEEDS: DirectFeed[] = [
  { url: `${MONGABAY}/?s=sampah&feed=rss2`, source: "Mongabay Indonesia", fallback: "dampak-sampah" },
  { url: `${MONGABAY}/?s=daur+ulang&feed=rss2`, source: "Mongabay Indonesia", fallback: "pilah-sampah" },
  { url: `${MONGABAY}/?s=ramah+lingkungan&feed=rss2`, source: "Mongabay Indonesia", fallback: "go-green" },
  { url: `${MONGABAY}/feed/`, source: "Mongabay Indonesia", fallback: "jaga-lingkungan" },
  { url: "https://www.antaranews.com/rss/terkini.xml", source: "ANTARA" },
  { url: "https://www.republika.co.id/rss/", source: "Republika" },
];

const TIMEOUT_MS = 8_000;
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const IRRELEVANT =
  /sampah masyarakat|sampah sosial|judi|slot gacor|togel|pemilu|pilkada|\bpartai\b|politik praktis/i;

const parser = new XMLParser({ ignoreAttributes: false, trimValues: true });

const MONTHS: Record<string, string> = {
  jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", mei: "May", jun: "Jun",
  jul: "Jul", agu: "Aug", agt: "Aug", sep: "Sep", okt: "Oct", nov: "Nov", des: "Dec",
};

function parseDate(raw: unknown): string {
  if (typeof raw !== "string") return new Date().toISOString();
  const fixed = raw.replace(/\b([A-Za-z]{3})[a-z]*\b/g, (word, short: string) => MONTHS[short.toLowerCase()] ?? word);
  const date = new Date(fixed);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function classify(text: string): NewsCategory | null {
  if (/pilah|pemilahan|daur ulang|bank sampah|kompos|sampah organik|anorganik/i.test(text)) return "pilah-sampah";
  if (/sampah|limbah|pencemaran|polusi|\btpa\b|mikroplastik|plastik/i.test(text)) return "dampak-sampah";
  if (/go green|ramah lingkungan|energi terbarukan|penghijauan|tanam pohon|emisi|iklim|hijau/i.test(text)) return "go-green";
  if (/lingkungan|konservasi|hutan|sungai|\blaut\b|mangrove|ekosistem|satwa|\bbumi\b/i.test(text)) return "jaga-lingkungan";
  return null;
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "#text" in value) {
    const inner = (value as { "#text"?: unknown })["#text"];
    return typeof inner === "string" ? inner : "";
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&hellip;/gi, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function summarize(raw: unknown): string {
  const plain = stripHtml(text(raw)).replace(/\s*(The post|Artikel)\b.*$/i, "").trim();
  if (plain.length < 30) return "";
  return plain.length <= 200 ? plain : `${plain.slice(0, 199).trimEnd()}…`;
}

function urlOf(node: unknown): string | undefined {
  const first = Array.isArray(node) ? node[0] : node;
  if (first && typeof first === "object" && "@_url" in first) {
    const url = (first as { "@_url"?: unknown })["@_url"];
    return typeof url === "string" ? url : undefined;
  }
  return undefined;
}

function imageOf(item: Record<string, unknown>): string | undefined {
  const raw = urlOf(item["enclosure"]) ?? urlOf(item["media:content"]) ?? urlOf(item["media:thumbnail"]);
  if (!raw) return undefined;
  try {
    const url = new URL(raw.replace(/&amp;/g, "&"));
    if (url.protocol === "http:") url.protocol = "https:";
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function fetchOne(feed: DirectFeed): Promise<Article[]> {
  const response = await fetch(feed.url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml" },
  });
  if (!response.ok) throw new Error(`feed ${feed.url} HTTP ${response.status}`);
  const parsed = parser.parse(await response.text()) as {
    rss?: { channel?: { item?: Record<string, unknown> | Record<string, unknown>[] } };
  };
  const rawItems = parsed.rss?.channel?.item;
  const items = !rawItems ? [] : Array.isArray(rawItems) ? rawItems : [rawItems];

  const out: Article[] = [];
  for (const item of items) {
    const link = text(item["link"]).trim();
    const title = stripHtml(text(item["title"]));
    if (!link.startsWith("http") || !title) continue;
    const summary = summarize(item["description"]);
    const haystack = `${title} ${summary}`;
    if (IRRELEVANT.test(haystack)) continue;
    const category = classify(haystack) ?? feed.fallback;
    if (!category) continue;
    const publishedAt = parseDate(item["pubDate"]);
    if (Date.now() - new Date(publishedAt).getTime() > MAX_AGE_MS) continue;
    out.push({
      id: createHash("sha256").update(link).digest("hex").slice(0, 16),
      title,
      summary,
      url: link,
      source: feed.source,
      publishedAt,
      category,
      imageUrl: imageOf(item),
    });
  }
  return out;
}

export async function fetchDirectFeeds(): Promise<Article[]> {
  const settled = await Promise.allSettled(DIRECT_FEEDS.map(fetchOne));
  return settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
