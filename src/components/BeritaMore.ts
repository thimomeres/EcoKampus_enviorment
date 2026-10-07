// Tombol "Lihat lebih sedikit" untuk daftar berita (berdampingan dengan "Lihat lebih banyak").
const PAGE_SIZE = 6;

export function initBeritaMore(): void {
  const list = document.getElementById("news-list");
  const more = document.getElementById("news-load-more");
  const wrap = more?.parentElement;
  if (!list || !more || !wrap) return;

  more.textContent = "Lihat lebih banyak";

  const less = document.createElement("button");
  less.type = "button";
  less.className = "btn-outline btn-outline--dark";
  less.id = "news-show-less";
  less.textContent = "Lihat lebih sedikit";
  less.hidden = true;
  wrap.style.gap = "12px";
  wrap.style.flexWrap = "wrap";
  wrap.appendChild(less);

  const sync = (): void => {
    less.hidden = list.children.length <= PAGE_SIZE;
  };
  new MutationObserver(sync).observe(list, { childList: true });
  sync();

  less.addEventListener("click", () => {
    // Mengklik ulang kategori aktif mengembalikan daftar ke ukuran awal.
    document.querySelector<HTMLButtonElement>("#berita .filter-chip.is-active")?.click();
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
