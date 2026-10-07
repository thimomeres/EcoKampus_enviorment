import { KOORDINATOR, UNITS, memberCount, photoFor, type Member } from "../data/struktur";
import { escapeHtml } from "../utils/format";

export const STRUKTUR_HASH = "#/struktur";
const PAGE_TITLE = "Struktur Divisi Lingkungan Hidup - EcoKampus";

function avatar(member: Member, size: "lg" | "md"): string {
  const photo = photoFor(member.id);
  const name = escapeHtml(member.name);
  if (photo) {
    return `<img class="org-avatar org-avatar--${size}" src="${escapeHtml(photo)}" alt="Foto ${name}" loading="lazy" />`;
  }
  return `<span class="org-avatar org-avatar--${size} org-avatar--dummy" role="img" aria-label="Foto ${name} (foto sementara)"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="23" r="12" fill="currentColor"/><path d="M8 62c0-14 10-24 24-24s24 10 24 24z" fill="currentColor"/></svg></span>`;
}

function person(member: Member, size: "lg" | "md"): string {
  return `
    <article class="org-person org-person--${size}">
      ${avatar(member, size)}
      <h4>${escapeHtml(member.name)}</h4>
      <p>${escapeHtml(member.role)}</p>
    </article>`;
}

/** Kartu di bagian Kontak (di bawah kartu kontak, di samping formulir). */
export function renderStrukturCard(): string {
  return `
    <div class="kontak-card kontak-struktur" data-aos="fade-up">
      <h3>Struktur Divisi</h3>
      <p>Kenali koordinator dan tim Divisi Lingkungan Hidup BEM UNKLAB di balik EcoKampus.</p>
      <button type="button" class="btn-primary" data-open-struktur>Lihat Divisi Lingkungan Hidup</button>
    </div>`;
}

/** Halaman terpisah (rute #/struktur) berisi bagan hierarki. */
export function renderStrukturPage(): string {
  const units = UNITS.map(
    (unit) => `
      <section class="org__branch" aria-labelledby="unit-${escapeHtml(unit.id)}">
        <div class="org__unit">
          <h3 class="org__unit-title" id="unit-${escapeHtml(unit.id)}">${escapeHtml(unit.title)}</h3>
          <div class="org__members">${unit.members.map((m) => person(m, "md")).join("")}</div>
        </div>
      </section>`,
  ).join("");

  return `
    <section class="section-content struktur-page" aria-labelledby="struktur-title">
      <a class="struktur-back" href="#kontak">← Kembali ke Kontak</a>
      <header class="section-heading">
        <h2 id="struktur-title">Struktur Divisi Lingkungan Hidup</h2>
        <p>Bagan hierarki Divisi Lingkungan Hidup BEM Universitas Klabat.</p>
      </header>
      <div class="org">
        <div class="org__root">${person(KOORDINATOR, "lg")}</div>
        <div class="org__stem" aria-hidden="true"></div>
        <div class="org__branches">${units}</div>
      </div>
      <p class="struktur-note">Foto sementara. Ganti dengan foto asli di <code>src/assets/Image/struktur/</code>.</p>
    </section>`;
}

function popupHtml(): string {
  const items = UNITS.map(
    (unit) => `<li><span>${escapeHtml(unit.title)}</span><strong>${unit.members.length} orang</strong></li>`,
  ).join("");
  return `
    <div id="struktur-popup" class="struktur-popup" hidden role="dialog" aria-modal="true" aria-labelledby="struktur-popup-title">
      <div class="struktur-popup__backdrop" data-close-struktur></div>
      <div class="struktur-popup__panel">
        <button type="button" class="struktur-popup__close" data-close-struktur aria-label="Tutup">×</button>
        ${avatar(KOORDINATOR, "md")}
        <h3 id="struktur-popup-title">Divisi Lingkungan Hidup</h3>
        <p>Koordinator: <strong>${escapeHtml(KOORDINATOR.name)}</strong> · ${memberCount()} anggota</p>
        <ul class="struktur-popup__list">${items}</ul>
        <a class="btn-primary" href="${STRUKTUR_HASH}" data-go-struktur>Buka halaman struktur</a>
      </div>
    </div>`;
}

export function initStruktur(): void {
  const home = document.getElementById("home-page");
  const page = document.getElementById("struktur-page");
  if (!home || !page) return;
  const originalTitle = document.title;

  document.body.insertAdjacentHTML("beforeend", popupHtml());
  const popup = document.getElementById("struktur-popup");
  if (!popup) return;

  let opener: HTMLElement | null = null;

  const closePopup = (): void => {
    if (popup.hidden) return;
    popup.hidden = true;
    document.body.classList.remove("modal-open");
    opener?.focus();
  };
  const openPopup = (from: HTMLElement): void => {
    opener = from;
    popup.hidden = false;
    document.body.classList.add("modal-open");
    popup.querySelector<HTMLElement>("[data-go-struktur]")?.focus();
  };

  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const open = target.closest<HTMLElement>("[data-open-struktur]");
    if (open) openPopup(open);
    if (target.closest("[data-close-struktur]")) closePopup();
    if (target.closest("[data-go-struktur]")) closePopup();
  });

  document.addEventListener("keydown", (event) => {
    if (popup.hidden) return;
    if (event.key === "Escape") closePopup();
    if (event.key === "Tab") {
      const items = Array.from(popup.querySelectorAll<HTMLElement>("button, a[href]"));
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });

  const applyRoute = (): void => {
    const onStruktur = window.location.hash === STRUKTUR_HASH;
    const wasStruktur = !page.hidden;
    home.hidden = onStruktur;
    page.hidden = !onStruktur;
    document.title = onStruktur ? PAGE_TITLE : originalTitle;
    if (onStruktur) {
      closePopup();
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    } else if (wasStruktur) {
      // Kembali ke halaman utama: lompat ke bagian yang dituju (mis. #kontak, #berita).
      const id = window.location.hash.slice(1);
      const target = id ? document.getElementById(id) : null;
      if (target) target.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      else window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
    // Hitung ulang animasi AOS dan posisi menu aktif setelah tampilan berganti.
    window.dispatchEvent(new Event("resize"));
  };

  window.addEventListener("hashchange", applyRoute);
  if (window.location.hash === STRUKTUR_HASH) applyRoute();
}
