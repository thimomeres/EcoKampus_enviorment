import { BIN_META, type BinType } from "../data/trashBins";
import { GAME_ITEMS, ROUNDS_PER_GAME, type GameItem } from "../data/gameItems";
import { WASTE_TYPES } from "../data/waste";
import { escapeHtml } from "../utils/format";
import binGreen from "../assets/Image/bins/tong-hijau.png";
import binYellow from "../assets/Image/bins/tong-kuning.png";
import binRed from "../assets/Image/bins/tong-merah.png";

type Phase = "intro" | "play" | "feedback" | "end";

interface GameState {
  phase: Phase;
  queue: GameItem[];
  round: number;
  score: number;
  streak: number;
  bestStreak: number;
  correct: number;
  best: number;
  lastCorrect: boolean;
  lastBin: BinType | null;
  lastGain: number;
}

interface BinInfo {
  img: string;
  tag: string;
  full: string;
  alt: string;
}

const BIN_INFO: Record<BinType, BinInfo> = {
  organik: {
    img: binGreen,
    tag: "Tong Hijau",
    full: "Sampah Organik",
    alt: "Tong sampah hijau untuk sampah organik",
  },
  anorganik: {
    img: binYellow,
    tag: "Tong Kuning",
    full: "Sampah Anorganik",
    alt: "Tong sampah kuning untuk sampah anorganik",
  },
  b3: {
    img: binRed,
    tag: "Tong Merah",
    full: "Sampah B3 (Bahan Berbahaya & Beracun)",
    alt: "Tong sampah merah untuk sampah B3",
  },
};

const BEST_KEY = "ecokampus-game-best-v1";
const BIN_ORDER: BinType[] = ["organik", "anorganik", "b3"];

const state: GameState = {
  phase: "intro",
  queue: [],
  round: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  correct: 0,
  best: 0,
  lastCorrect: false,
  lastBin: null,
  lastGain: 0,
};

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function loadBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function saveBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* mode privat / kuota penuh */
  }
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const SEEN_KEY = "ecokampus-game-seen";
const SEEN_MAX = 30;

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function rememberSeen(ids: string[]): void {
  try {
    const next = [...readSeen().filter((id) => !ids.includes(id)), ...ids].slice(-SEEN_MAX);
    localStorage.setItem(SEEN_KEY, JSON.stringify(next));
  } catch {
    /* penyimpanan diblokir: abaikan */
  }
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Soal acak: jumlah tiap jenis ikut diacak, soal yang baru saja muncul di permainan
 * sebelumnya diprioritaskan terakhir, dan gambar tiap soal dipilih acak dari variannya.
 */
function buildQueue(): GameItem[] {
  const seen = new Set(readSeen());
  const pool = (t: BinType): GameItem[] => {
    const all = shuffle(GAME_ITEMS.filter((i) => i.type === t));
    return [...all.filter((i) => !seen.has(i.id)), ...all.filter((i) => seen.has(i.id))];
  };
  const b3 = randomInt(1, 3);
  const organik = randomInt(3, 5);
  const anorganik = ROUNDS_PER_GAME - b3 - organik;
  const picked = [
    ...pool("organik").slice(0, organik),
    ...pool("anorganik").slice(0, anorganik),
    ...pool("b3").slice(0, b3),
  ];
  const queue = shuffle(picked)
    .slice(0, ROUNDS_PER_GAME)
    .map((item) => {
      const options = item.variants && item.variants.length > 0 ? item.variants : [item.emoji];
      return { ...item, emoji: options[Math.floor(Math.random() * options.length)] ?? item.emoji };
    });
  rememberSeen(queue.map((item) => item.id));
  return queue;
}

function currentItem(): GameItem | undefined {
  return state.queue[state.round];
}

function binsHtml(locked: boolean): string {
  const item = currentItem();
  return BIN_ORDER.map((t) => {
    const meta = BIN_META[t];
    const info = BIN_INFO[t];
    let result = "";
    if (state.phase === "feedback" && item) {
      if (t === item.type) result = " is-right";
      else if (state.lastBin === t) result = " is-wrong";
    }
    return `<button type="button" class="game-bin${result}" data-bin="${t}" style="--bin:${meta.color}" ${locked ? "disabled" : ""} aria-label="${escapeHtml(info.tag)}: ${escapeHtml(meta.label)}">
      <span class="game-bin__imgwrap"><img class="game-bin__img" src="${info.img}" alt="" draggable="false" /></span>
      <span class="game-bin__label">${escapeHtml(meta.label)}</span>
    </button>`;
  }).join("");
}

function hudHtml(): string {
  const shown = Math.min(state.round + 1, ROUNDS_PER_GAME);
  return `<div class="game-hud" aria-live="polite">
    <span>Ronde <strong>${shown}/${ROUNDS_PER_GAME}</strong></span>
    <span>Skor <strong>${state.score}</strong></span>
    <span>Beruntun <strong>${state.streak}🔥</strong></span>
    <span>Rekor <strong>${state.best}</strong></span>
  </div>`;
}

function introHtml(): string {
  const cards = WASTE_TYPES.map((w) => {
    const info = BIN_INFO[w.id];
    const meta = BIN_META[w.id];
    return `<article class="learn-card" style="--bin:${meta.color}">
      <img class="learn-card__bin" src="${info.img}" alt="${escapeHtml(info.alt)}" />
      <span class="learn-card__tag">${escapeHtml(info.tag)}</span>
      <h4>${escapeHtml(info.full)}</h4>
      <p>${escapeHtml(w.description)}</p>
      <ul class="learn-chips" aria-label="Contoh">${w.examples.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("")}</ul>
      <p class="learn-card__tip"><span aria-hidden="true">💡</span> ${escapeHtml(w.mixedImpact)}</p>
    </article>`;
  }).join("");

  return `<div class="game-intro">
    <p class="game-kicker">Belajar dulu, baru main</p>
    <h3 class="game-title">Kenali 3 Jenis Sampah</h3>
    <div class="learn-grid">${cards}</div>
    <ol class="game-how" aria-label="Cara bermain">
      <li><strong>1</strong><span>Satu sampah muncul di layar.</span></li>
      <li><strong>2</strong><span>Seret ke tong yang tepat (atau ketuk tongnya).</span></li>
      <li><strong>3</strong><span>Baca penjelasannya, kumpulkan skor!</span></li>
    </ol>
    ${state.best > 0 ? `<p class="game-best">Rekormu: <strong>${state.best}</strong></p>` : ""}
    <button type="button" class="btn-primary game-start" data-game="start">Mulai main</button>
  </div>`;
}

function playHtml(): string {
  const item = currentItem();
  if (!item) return "";
  const feedback = state.phase === "feedback";
  const gain = state.lastGain > 0 ? ` +${state.lastGain}` : "";
  const message = feedback
    ? `<div class="game-feedback ${state.lastCorrect ? "is-right" : "is-wrong"}" role="status">
        <p class="game-feedback__title">${state.lastCorrect ? `✅ Benar!${gain}` : `❌ Kurang tepat. Seharusnya ${escapeHtml(BIN_INFO[item.type].tag)} (${escapeHtml(BIN_META[item.type].label)}).`}</p>
        <p>${escapeHtml(item.why)}</p>
        <button type="button" class="btn-primary" data-game="next" id="game-next">${state.round + 1 >= ROUNDS_PER_GAME ? "Lihat hasil" : "Lanjut"}</button>
      </div>`
    : `<p class="game-hint">Seret sampah ke tong yang tepat, atau ketuk tongnya.</p>`;

  return `${hudHtml()}
    <div class="game-stage">
      <div class="game-item${feedback ? " is-locked" : " game-item--enter"}" id="game-item" ${feedback ? "" : 'tabindex="0"'} role="img" aria-label="Sampah: ${escapeHtml(item.name)}">
        <span class="game-item__emoji" aria-hidden="true">${item.emoji}</span>
        <span class="game-item__name">${escapeHtml(item.name)}</span>
      </div>
    </div>
    ${message}
    <div class="game-bins" id="game-bins">${binsHtml(feedback)}</div>`;
}

function endHtml(): string {
  const pct = Math.round((state.correct / ROUNDS_PER_GAME) * 100);
  let title = "Ayo belajar lagi!";
  if (pct >= 90) title = "Juara Pilah Sampah! 🏆";
  else if (pct >= 70) title = "Hebat, hampir sempurna! 🌱";
  else if (pct >= 50) title = "Lumayan, terus berlatih! 👍";
  const isBest = state.score >= state.best && state.score > 0;
  return `<div class="game-panel">
    <h3 class="game-title">${title}</h3>
    <p class="game-final">${state.score}<small> poin</small></p>
    <p>${state.correct} dari ${ROUNDS_PER_GAME} benar · Beruntun terbaik ${state.bestStreak}🔥</p>
    ${isBest ? `<p class="game-best">🎉 Rekor baru!</p>` : `<p class="game-best">Rekormu: <strong>${state.best}</strong></p>`}
    <p>Ingat: <strong>organik</strong> untuk sisa makhluk hidup, <strong>anorganik</strong> untuk plastik, kertas, dan logam, <strong>B3</strong> untuk bahan berbahaya.</p>
    <div class="game-panel__actions">
      <button type="button" class="btn-primary" data-game="start">Main lagi</button>
      <button type="button" class="btn-outline btn-outline--dark" data-game="intro">Pelajari lagi</button>
      <a class="btn-outline btn-outline--dark" href="#lokasi">Cari tong terdekat</a>
    </div>
  </div>`;
}

function draw(root: HTMLElement): void {
  root.innerHTML =
    state.phase === "intro"
      ? introHtml()
      : state.phase === "end"
        ? endHtml()
        : playHtml();
  if (state.phase === "play") attachDrag(root);
  if (state.phase === "feedback") root.querySelector<HTMLButtonElement>("#game-next")?.focus();
}

function answer(root: HTMLElement, bin: BinType): void {
  const item = currentItem();
  if (!item || state.phase !== "play") return;
  const right = item.type === bin;
  state.lastBin = bin;
  state.lastCorrect = right;
  if (right) {
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.correct += 1;
    state.lastGain = 10 + Math.min(state.streak - 1, 5) * 2;
    state.score += state.lastGain;
  } else {
    state.streak = 0;
    state.lastGain = 0;
  }
  state.phase = "feedback";
  draw(root);
}

function start(root: HTMLElement): void {
  state.queue = buildQueue();
  state.round = 0;
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.correct = 0;
  state.lastBin = null;
  state.phase = "play";
  draw(root);
  root.querySelector<HTMLElement>("#game-item")?.focus({ preventScroll: true });
}

function next(root: HTMLElement): void {
  state.round += 1;
  if (state.round >= ROUNDS_PER_GAME) {
    if (state.score > state.best) {
      state.best = state.score;
      saveBest(state.best);
    }
    state.phase = "end";
  } else {
    state.phase = "play";
  }
  draw(root);
  if (state.phase === "play") {
    root.querySelector<HTMLElement>("#game-item")?.focus({ preventScroll: true });
  }
}

/** Drag & drop memakai Pointer Events agar jalan di mouse dan layar sentuh. */
function attachDrag(root: HTMLElement): void {
  const item = root.querySelector<HTMLElement>("#game-item");
  const bins = Array.from(root.querySelectorAll<HTMLButtonElement>(".game-bin"));
  if (!item) return;

  item.addEventListener(
    "animationend",
    () => item.classList.remove("game-item--enter"),
    { once: true },
  );

  let startX = 0;
  let startY = 0;
  let curX = 0;
  let curY = 0;
  let dragging = false;

  const binAt = (x: number, y: number): HTMLButtonElement | null => {
    for (const bin of bins) {
      const r = bin.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return bin;
    }
    return null;
  };
  const clearHover = () => bins.forEach((b) => b.classList.remove("is-hover"));

  item.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    curX = 0;
    curY = 0;
    item.classList.remove("game-item--enter");
    item.style.transition = "";
    item.setPointerCapture(e.pointerId);
    item.classList.add("is-dragging");
  });

  item.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    curX = e.clientX - startX;
    curY = e.clientY - startY;
    item.style.transform = `translate(${curX}px, ${curY}px) scale(1.08)`;
    clearHover();
    binAt(e.clientX, e.clientY)?.classList.add("is-hover");
  });

  const finish = (e: PointerEvent, cancelled: boolean) => {
    if (!dragging) return;
    dragging = false;
    item.classList.remove("is-dragging");
    clearHover();
    const target = cancelled ? null : binAt(e.clientX, e.clientY);
    const binType = target?.dataset.bin as BinType | undefined;

    if (!target || !binType) {
      // Jatuh di luar tong: kembali ke tempat semula
      if (!reducedMotion()) item.style.transition = "transform 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.2)";
      item.style.transform = "";
      return;
    }

    if (reducedMotion()) {
      answer(root, binType);
      return;
    }
    // Animasi "masuk ke dalam tong"
    const ir = item.getBoundingClientRect();
    const br = target.getBoundingClientRect();
    const dx = br.left + br.width / 2 - (ir.left + ir.width / 2);
    const dy = br.top + br.height * 0.3 - (ir.top + ir.height / 2);
    item.style.transition = "transform 0.28s ease-in, opacity 0.28s ease-in";
    item.style.transform = `translate(${curX + dx}px, ${curY + dy}px) scale(0.2)`;
    item.style.opacity = "0";
    target.classList.add("is-catch");
    window.setTimeout(() => answer(root, binType), 280);
  };
  item.addEventListener("pointerup", (e) => finish(e, false));
  item.addEventListener("pointercancel", (e) => finish(e, true));
}

export function renderGame(): string {
  return `
    <section id="game" class="section-content game-section">
      <header class="section-heading game-heading" data-aos="fade-up">
        <h2>Game Pilah Sampah</h2>
        <p>Pelajari jenis sampah, lalu uji pemahamanmu dengan menyeret sampah ke tong yang tepat.</p>
      </header>
      <div class="game-card" id="game-root" data-aos="fade-up"></div>
    </section>
  `;
}

export function initGame(): void {
  const root = document.getElementById("game-root");
  if (!root) return;
  state.best = loadBest();
  state.phase = "intro";
  draw(root);

  root.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    const action = target.closest<HTMLElement>("[data-game]")?.dataset.game;
    if (action === "start") {
      start(root);
      return;
    }
    if (action === "next") {
      next(root);
      return;
    }
    if (action === "intro") {
      state.phase = "intro";
      draw(root);
      return;
    }
    const bin = target.closest<HTMLButtonElement>(".game-bin");
    if (bin?.dataset.bin && state.phase === "play") answer(root, bin.dataset.bin as BinType);
  });
}
