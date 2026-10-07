import type { Article, NewsCategory, NewsResult } from "../types/news";
import { getNews, readCachedNews } from "../services/newsService";
import { CATEGORY_LABEL, renderNewsCard } from "./newsCard";
import { debounce, escapeHtml, formatRelativeDate } from "../utils/format";

const PAGE_SIZE = 6;
const ALL_CATEGORIES: Array<"all" | NewsCategory> = [
  "all",
  "pilah-sampah",
  "dampak-sampah",
  "go-green",
  "jaga-lingkungan",
  "jerhemy-owen",
];

interface BeritaState {
  result: NewsResult | null;
  query: string;
  category: "all" | NewsCategory;
  visible: number;
  error: boolean;
  lastTrigger: HTMLElement | null;
}

const state: BeritaState = {
  result: null,
  query: "",
  category: "all",
  visible: PAGE_SIZE,
  error: false,
  lastTrigger: null,
};

function statusLabel(result: NewsResult): string {
  const rel = formatRelativeDate(result.updatedAt);
  if (result.status === "live") {
    return rel === "Baru saja" ? "Diperbarui baru saja" : `Diperbarui ${rel}`;
  }
  if (result.status === "cached") {
    return `Mode arsip — cache ${rel}`;
  }
  return "Mode offline — menampilkan arsip redaksi";
}

function filteredArticles(): Article[] {
  const articles = state.result?.articles ?? [];
  const q = state.query.trim().toLowerCase();
  return articles.filter((article) => {
    if (article.curated) return false;
    if (state.category !== "all" && article.category !== state.category) {
      return false;
    }
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q)
    );
  });
}

function curatedArticles(): Article[] {
  const articles = state.result?.articles.filter((item) => item.curated) ?? [];
  const q = state.query.trim().toLowerCase();
  return articles.filter((article) => {
    if (state.category !== "all" && article.category !== state.category) {
      return false;
    }
    if (!q) return true;
    return (
      article.title.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q)
    );
  });
}

function renderSkeleton(): string {
  return Array.from({ length: 6 }, () => `<div class="news-skeleton" aria-hidden="true"></div>`).join(
    "",
  );
}

function renderList(): void {
  const list = document.getElementById("news-list");
  const featuredWrap = document.getElementById("news-featured");
  const curatedWrap = document.getElementById("news-curated");
  const loadMore = document.getElementById("news-load-more");
  const empty = document.getElementById("news-empty");
  const liveRegion = document.getElementById("news-live");
  const errorBox = document.getElementById("news-error");
  if (!list || !featuredWrap || !curatedWrap || !loadMore || !empty || !liveRegion || !errorBox) {
    return;
  }

  if (state.error && !state.result) {
    errorBox.hidden = false;
    list.innerHTML = "";
    featuredWrap.innerHTML = "";
    curatedWrap.hidden = true;
    loadMore.hidden = true;
    empty.hidden = true;
    liveRegion.textContent = "Gagal memuat berita.";
    return;
  }

  errorBox.hidden = true;
  const curated = curatedArticles();
  const items = filteredArticles();
  const featured = items[0];
  const rest = featured ? items.slice(1) : items;
  const page = rest.slice(0, state.visible);

  curatedWrap.hidden = curated.length === 0;
  curatedWrap.querySelector(".news-curated__grid")?.replaceChildren();
  const curatedGrid = curatedWrap.querySelector(".news-curated__grid");
  if (curatedGrid) {
    curatedGrid.innerHTML = curated.map((article) => renderNewsCard(article)).join("");
  }

  featuredWrap.innerHTML = featured ? renderNewsCard(featured, true) : "";
  list.innerHTML = page.map((article) => renderNewsCard(article)).join("");

  const totalShown = (featured ? 1 : 0) + page.length + curated.length;
  empty.hidden = totalShown > 0;
  loadMore.hidden = rest.length <= state.visible;

  liveRegion.textContent = `${totalShown} berita ditampilkan`;
}

const NEWS_EVENT = "ecokampus:news";
let pollTimer = 0;
let pollCount = 0;

function publish(result: NewsResult): void {
  document.dispatchEvent(new CustomEvent<NewsResult>(NEWS_EVENT, { detail: result }));
}

/** Server melengkapi gambar di latar belakang; ambil ulang beberapa kali sampai gambar terisi. */
function scheduleImagePoll(): void {
  const live = state.result?.articles.filter((a) => !a.curated) ?? [];
  const missing = live.filter((a) => !a.imageUrl).length;
  if (state.result?.status !== "live" || missing < 3 || pollCount >= 8) return;
  window.clearTimeout(pollTimer);
  pollTimer = window.setTimeout(() => {
    pollCount += 1;
    void getNews().then((result) => {
      state.result = result;
      const badge = document.getElementById("news-status");
      if (badge) badge.textContent = statusLabel(result);
      renderList();
      publish(result);
      scheduleImagePoll();
    });
  }, 6000);
}

async function loadNews(): Promise<void> {
  const list = document.getElementById("news-list");
  const badge = document.getElementById("news-status");
  state.error = false;
  pollCount = 0;

  // Tampilkan cache seketika (jika ada), lalu perbarui dari server.
  const cached = readCachedNews();
  if (cached) {
    state.result = cached;
    if (badge) badge.textContent = "Memperbarui berita…";
    renderList();
    publish(cached);
  } else if (list) {
    list.innerHTML = renderSkeleton();
  }

  try {
    const result = await getNews();
    state.result = result;
    if (badge) badge.textContent = statusLabel(result);
    if (!cached) state.visible = PAGE_SIZE;
    renderList();
    publish(result);
    scheduleImagePoll();
  } catch {
    if (!cached) {
      state.error = true;
      state.result = null;
    }
    renderList();
  }
}

function openModal(article: Article, trigger: HTMLElement): void {
  const modal = document.getElementById("news-modal");
  const title = document.getElementById("news-modal-title");
  const body = document.getElementById("news-modal-body");
  const meta = document.getElementById("news-modal-meta");
  if (!modal || !title || !body || !meta) return;
  state.lastTrigger = trigger;
  title.textContent = article.title;
  meta.textContent = `${article.source} · ${formatRelativeDate(article.publishedAt)}`;
  body.innerHTML = (article.body ?? [article.summary])
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");
  modal.hidden = false;
  document.body.classList.add("modal-open");
  const closeBtn = modal.querySelector<HTMLButtonElement>("[data-close-modal]");
  closeBtn?.focus();
}

function closeModal(): void {
  const modal = document.getElementById("news-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  state.lastTrigger?.focus();
  state.lastTrigger = null;
}

function trapFocus(event: KeyboardEvent): void {
  const modal = document.getElementById("news-modal");
  if (!modal || modal.hidden || event.key !== "Tab") return;
  const focusable = modal.querySelectorAll<HTMLElement>(
    'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function renderBerita(): string {
  const chips = ALL_CATEGORIES.map((id) => {
    const label = id === "all" ? "Semua" : CATEGORY_LABEL[id];
    const pressed = id === "all" ? "true" : "false";
    return `<button type="button" class="filter-chip${id === "all" ? " is-active" : ""}" data-category="${id}" aria-pressed="${pressed}">${label}</button>`;
  }).join("");

  return `
    <section id="berita" class="section-content berita-section">
      <header class="berita-header" data-aos="fade-up">
        <div>
          <h2>Berita Lingkungan</h2>
          <p>Kumpulan kabar pemilahan sampah, dampak lingkungan, dan gaya hidup ramah bumi — plus tulisan redaksi EcoKampus.</p>
        </div>
        <span id="news-status" class="news-status">Memuat berita…</span>
      </header>

      <div class="berita-toolbar" data-aos="fade-up">
        <label class="news-search">
          <span class="visually-hidden">Cari berita</span>
          <input id="news-search" type="search" placeholder="Cari judul atau ringkasan…" autocomplete="off" />
        </label>
        <div class="filter-chips" role="group" aria-label="Filter kategori">${chips}</div>
      </div>

      <p id="news-live" class="visually-hidden" aria-live="polite"></p>

      <div id="news-error" class="news-state" hidden>
        <p>Berita tidak dapat dimuat saat ini.</p>
        <button type="button" class="btn-primary" id="news-retry">Coba lagi</button>
      </div>

      <div id="news-curated" class="news-curated" hidden>
        <h3>Dari Redaksi EcoKampus</h3>
        <div class="news-curated__grid"></div>
      </div>

      <div id="news-featured" class="news-featured"></div>
      <div id="news-list" class="news-grid">${renderSkeleton()}</div>

      <div id="news-empty" class="news-state" hidden>
        <p>Tidak ada berita untuk kata kunci ini.</p>
        <button type="button" class="btn-primary" id="news-reset">Reset filter</button>
      </div>

      <div class="news-more-wrap">
        <button type="button" class="btn-outline btn-outline--dark" id="news-load-more" hidden>Muat lebih banyak</button>
      </div>

      <div id="news-modal" class="news-modal" hidden role="dialog" aria-modal="true" aria-labelledby="news-modal-title">
        <div class="news-modal__backdrop" data-close-modal></div>
        <div class="news-modal__panel">
          <button type="button" class="news-modal__close" data-close-modal aria-label="Tutup">×</button>
          <p id="news-modal-meta" class="news-modal__meta"></p>
          <h3 id="news-modal-title"></h3>
          <div id="news-modal-body" class="news-modal__body"></div>
        </div>
      </div>
    </section>
  `;
}

export function initBerita(onReady?: () => void): void {
  // Jika foto berita gagal dimuat, hapus <img> agar placeholder di bawahnya terlihat.
  document.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.classList.contains("news-card__img")) {
        target.remove();
      }
    },
    true,
  );

  const search = document.getElementById("news-search") as HTMLInputElement | null;
  const chips = document.querySelectorAll<HTMLButtonElement>(".filter-chip");
  const root = document.getElementById("berita");

  search?.addEventListener(
    "input",
    debounce(() => {
      state.query = search.value;
      state.visible = PAGE_SIZE;
      renderList();
    }, 250),
  );

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      state.category = chip.dataset.category as "all" | NewsCategory;
      state.visible = PAGE_SIZE;
      chips.forEach((c) => {
        const active = c === chip;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-pressed", active ? "true" : "false");
      });
      renderList();
    });
  });

  document.getElementById("news-load-more")?.addEventListener("click", () => {
    state.visible += PAGE_SIZE;
    renderList();
  });

  document.getElementById("news-reset")?.addEventListener("click", () => {
    state.query = "";
    state.category = "all";
    if (search) search.value = "";
    chips.forEach((c) => {
      const active = c.dataset.category === "all";
      c.classList.toggle("is-active", active);
      c.setAttribute("aria-pressed", active ? "true" : "false");
    });
    renderList();
  });

  document.getElementById("news-retry")?.addEventListener("click", () => {
    void loadNews().then(() => onReady?.());
  });

  root?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const openBtn = target.closest<HTMLElement>("[data-open-article]");
    if (openBtn) {
      const id = openBtn.getAttribute("data-open-article");
      const article = state.result?.articles.find((item) => item.id === id);
      if (article) openModal(article, openBtn);
    }
    if (target.closest("[data-close-modal]")) closeModal();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
    trapFocus(event);
  });

  void loadNews().then(() => onReady?.());

  // Perbarui otomatis tiap 5 menit, dan saat tab dibuka kembali setelah lama ditinggal.
  let lastFetch = Date.now();
  const silentRefresh = (): void => {
    lastFetch = Date.now();
    void getNews().then((result) => {
      if (result.status !== "live") return;
      state.result = result;
      const badge = document.getElementById("news-status");
      if (badge) badge.textContent = statusLabel(result);
      renderList();
      publish(result);
      pollCount = 0;
      scheduleImagePoll();
    });
  };
  window.setInterval(() => {
    if (!document.hidden) silentRefresh();
  }, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && Date.now() - lastFetch > 2 * 60 * 1000) silentRefresh();
  });
}

function renderHomeNews(mount: HTMLElement, result: NewsResult): void {
  const latest = [...result.articles]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);
  mount.innerHTML = latest.map((article) => renderNewsCard(article)).join("");
  mount.querySelectorAll<HTMLElement>("[data-open-article]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("berita")?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

export function initHomeNews(): void {
  const mount = document.getElementById("home-news-grid");
  if (!mount) return;
  // Beranda ikut menampilkan data yang dimuat oleh bagian Berita (satu sumber, tanpa permintaan ganda).
  document.addEventListener(NEWS_EVENT, (event) => {
    renderHomeNews(mount, (event as CustomEvent<NewsResult>).detail);
  });
  const cached = readCachedNews();
  if (cached) renderHomeNews(mount, cached);
}
