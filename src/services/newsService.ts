import type { NewsPayload, NewsResult } from "../types/news";
import { CURATED_NEWS } from "../data/curatedNews";

const CACHE_KEY = "ecokampus-news-v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SHOW_STALE_MAX_MS = 30 * 60 * 1000;

interface CacheEnvelope {
  savedAt: number;
  payload: NewsPayload;
}

function readCache(): CacheEnvelope | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (!parsed?.payload?.articles || typeof parsed.savedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload: NewsPayload): void {
  try {
    const envelope: CacheEnvelope = { savedAt: Date.now(), payload };
    localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    /* kuota penuh atau mode privat */
  }
}

function offlineResult(cached: CacheEnvelope | null): NewsResult {
  if (cached) {
    return {
      articles: cached.payload.articles,
      status: "cached",
      updatedAt: cached.payload.updatedAt,
    };
  }
  return {
    articles: CURATED_NEWS,
    status: "offline",
    updatedAt: new Date().toISOString(),
  };
}

function isFresh(cached: CacheEnvelope): boolean {
  return Date.now() - cached.savedAt < CACHE_TTL_MS;
}

/** Baca cache apa adanya (sinkron) agar berita tampil seketika sambil menunggu data terbaru. */
export function readCachedNews(): NewsResult | null {
  const cached = readCache();
  // Cache lebih tua dari 30 menit tidak ditampilkan lebih dulu agar tidak terkesan berita lama.
  if (!cached || Date.now() - cached.savedAt > SHOW_STALE_MAX_MS) return null;
  return {
    articles: cached.payload.articles,
    status: "cached",
    updatedAt: cached.payload.updatedAt,
  };
}

let inflight: Promise<NewsResult> | null = null;

/** Satu permintaan berjalan dipakai bersama (Beranda & Berita) agar /api/news tidak dipanggil dua kali. */
export function getNews(): Promise<NewsResult> {
  if (!inflight) {
    inflight = fetchNews().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function fetchNews(): Promise<NewsResult> {
  const cached = readCache();

  try {
    const response = await fetch("/api/news", { cache: "no-store", headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("bad status");
    const payload = (await response.json()) as NewsPayload;
    if (!Array.isArray(payload.articles)) throw new Error("bad payload");
    writeCache(payload);
    return {
      articles: payload.articles,
      status: "live",
      updatedAt: payload.updatedAt,
    };
  } catch {
    if (cached && isFresh(cached)) {
      return {
        articles: cached.payload.articles,
        status: "cached",
        updatedAt: cached.payload.updatedAt,
      };
    }
    return offlineResult(cached);
  }
}
