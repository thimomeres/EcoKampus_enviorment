import "./style.css";
import "./styles/beranda.css";
import "./styles/berita.css";
import "./styles/kontak.css";
import "./styles/lokasi.css";
import "./styles/game.css";
import "./styles/struktur.css";
import "./styles/intro.css";
import AOS from "aos";
import "aos/dist/aos.css";
import logoCampus from "./assets/Image/logounklab.png";
import { initHeroSlider, renderBeranda } from "./components/Beranda";
import { renderTentang } from "./components/about";
import { initBerita, initHomeNews, renderBerita } from "./components/Berita";
import { initLokasi, renderLokasi } from "./components/Lokasi";
import { initGame, renderGame } from "./components/Game";
import { initKontak, renderKontak } from "./components/Kontak";
import { renderFooter } from "./components/Footer";
import { initIntro } from "./components/Intro";
import { initStruktur, renderStrukturPage } from "./components/Struktur";

initIntro();

const logoCampusEl = document.getElementById(
  "logo-campus",
) as HTMLImageElement | null;
if (logoCampusEl) logoCampusEl.src = logoCampus;

const appContent = document.getElementById("app-content");
if (appContent) {
  appContent.innerHTML = `
    <div id="home-page">
      ${renderBeranda()}
      ${renderTentang()}
      ${renderLokasi()}
      ${renderBerita()}
      ${renderGame()}
      ${renderKontak()}
    </div>
    <div id="struktur-page" hidden>${renderStrukturPage()}</div>
    ${renderFooter()}
  `;
  initHeroSlider();
  initKontak();
  initLokasi();
  initGame();
  initHomeNews();
  initStruktur();
  initBerita(() => {
    AOS.refresh();
  });
}

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
AOS.init({
  duration: prefersReduced ? 0 : 800,
  once: true,
  offset: 80,
  disable: prefersReduced,
});

const navToggle = document.querySelector<HTMLButtonElement>(".nav-toggle");
const mainNav = document.getElementById("main-nav");

function closeNav() {
  navToggle?.classList.remove("nav-toggle--open");
  mainNav?.classList.remove("nav--open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Buka menu navigasi");
}

function openNav() {
  navToggle?.classList.add("nav-toggle--open");
  mainNav?.classList.add("nav--open");
  navToggle?.setAttribute("aria-expanded", "true");
  navToggle?.setAttribute("aria-label", "Tutup menu navigasi");
}

navToggle?.addEventListener("click", () => {
  const isOpen = mainNav?.classList.contains("nav--open");
  if (isOpen) closeNav();
  else openNav();
});

mainNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeNav);
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 768) closeNav();
});

function initScrollSpy(): void {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("#main-nav a[href^='#']"));
  const items = links
    .map((link) => {
      const id = link.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      return section ? { link, section } : null;
    })
    .filter((item): item is { link: HTMLAnchorElement; section: HTMLElement } => item !== null);

  if (items.length === 0) return;

  let current: HTMLAnchorElement | null = null;
  const setActive = (next: HTMLAnchorElement): void => {
    if (next === current) return;
    current = next;
    links.forEach((link) => {
      const active = link === next;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  // Menu aktif = bagian terakhir yang sudah melewati garis di ±30% tinggi layar.
  // Dihitung dari posisi scroll, jadi tetap akurat walau tinggi bagian berubah (berita dimuat, animasi AOS).
  const update = (): void => {
    const header = document.querySelector<HTMLElement>("body > header");
    const line = (header?.offsetHeight ?? 80) + window.innerHeight * 0.3;
    let active = items[0];
    for (const item of items) {
      if (item.section.getBoundingClientRect().top <= line) active = item;
    }
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    if (atBottom) active = items[items.length - 1];
    setActive(active.link);
  };

  let queued = false;
  const schedule = (): void => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  const content = document.getElementById("app-content");
  if (content && "ResizeObserver" in window) new ResizeObserver(schedule).observe(content);
  links.forEach((link) => link.addEventListener("click", () => setActive(link)));
  update();
}

initScrollSpy();
