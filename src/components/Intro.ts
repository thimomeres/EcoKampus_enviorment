import logoUnklab from "../assets/Image/logounklab.png";
import logoIgnite from "../assets/Image/ignitelogo-removebg-preview.png";

const SEEN_KEY = "ecokampus-intro-seen";

function alreadySeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* abaikan */
  }
}

/** Intro singkat: logo UNKLAB masuk lalu tulisan "Ignite the Light". Tampil sekali per sesi. */
export function initIntro(): void {
  const force = new URLSearchParams(window.location.search).has("intro");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!force && (reduced || alreadySeen())) return;
  markSeen();

  const embers = Array.from({ length: 10 }, (_, i) => {
    const left = 12 + ((i * 37) % 76);
    const delay = (i % 5) * 0.35 + 1.2;
    const dur = 2.2 + (i % 4) * 0.5;
    const size = 4 + (i % 3) * 2;
    return `<i class="intro__ember" style="left:${left}%;--d:${delay}s;--t:${dur}s;--s:${size}px"></i>`;
  }).join("");

  const el = document.createElement("div");
  el.className = "intro";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Selamat datang di website Divisi Lingkungan Hidup");
  el.innerHTML = `
    <div class="intro__rays" aria-hidden="true"></div>
    <div class="intro__glow" aria-hidden="true"></div>
    ${embers}
    <div class="intro__stage">
      <img class="intro__logo" src="${logoUnklab}" alt="Logo Universitas Klabat" width="160" height="160" />
      <img class="intro__ignite" src="${logoIgnite}" alt="Ignite the Light" />
      <div class="intro__welcome">
        <p class="intro__hello">Welcome to Website</p>
        <h1 class="intro__title">Divisi Lingkungan Hidup</h1>
        <button type="button" class="intro__enter">Masuk <span aria-hidden="true">→</span></button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  document.body.classList.add("intro-lock");

  let done = false;
  const finish = (): void => {
    if (done) return;
    done = true;
    el.classList.add("intro--out");
    document.body.classList.remove("intro-lock");
    window.setTimeout(() => el.remove(), 700);
  };

  const enter = el.querySelector<HTMLButtonElement>(".intro__enter");
  enter?.addEventListener("click", finish);
  window.setTimeout(() => enter?.focus({ preventScroll: true }), 3200);
}
