// Game Pilah Sampah dalam popup + musik latar.
// - Game tampil di popup sendiri (tombol "Main Game" di bagian Game).
// - Musik (src/assets/music/*.mp3) berputar berulang selama game berlangsung.
// - Musik berhenti saat popup ditutup atau saat layar hasil muncul.
const trackModules = import.meta.glob("../assets/music/*.{mp3,ogg,wav,m4a,aac}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const PREF_KEY = "ecokampus-game-music";
const VOLUME = 0.5; // sedang

function readEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

function saveEnabled(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* abaikan */
  }
}

export function initGameMusic(): void {
  const section = document.getElementById("game");
  const root = document.getElementById("game-root");
  if (!section || !root) return;

  const tracks = Object.values(trackModules);
  let enabled = readEnabled();
  let popupOpen = false;
  let index = tracks.length ? Math.floor(Math.random() * tracks.length) : 0;
  let audio: HTMLAudioElement | null = null;
  let fadeTimer = 0;

  // Penanda posisi asli game di halaman (tempat kembali setelah popup ditutup)
  const anchor = document.createElement("span");
  anchor.hidden = true;
  root.parentElement?.insertBefore(anchor, root);

  // ---- Popup: game dipindahkan ke dalamnya ----
  const popup = document.createElement("div");
  popup.className = "game-popup";
  popup.hidden = true;
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-labelledby", "game-popup-title");
  popup.innerHTML = `
    <div class="game-popup__backdrop" data-game-close></div>
    <div class="game-popup__panel" tabindex="-1">
      <div class="game-popup__bar">
        <h3 id="game-popup-title">Game Pilah Sampah</h3>
        <div class="game-popup__actions">
          <button type="button" class="game-popup__music" aria-pressed="${enabled}"></button>
          <button type="button" class="game-popup__close" data-game-close aria-label="Tutup game">×</button>
        </div>
      </div>
      <div class="game-popup__body"></div>
    </div>`;
  document.body.appendChild(popup);
  const body = popup.querySelector(".game-popup__body") as HTMLElement;
  const musicBtn = popup.querySelector<HTMLButtonElement>(".game-popup__music") as HTMLButtonElement;

  if (tracks.length === 0) musicBtn.hidden = true;

  function paintMusicButton(): void {
    musicBtn.setAttribute("aria-pressed", String(enabled));
    musicBtn.textContent = enabled ? "🔊 Musik" : "🔇 Musik";
    musicBtn.classList.toggle("is-playing", enabled && !!audio && !audio.paused);
  }

  // ---- Musik ----
  function fadeTo(target: number, ms: number, done?: () => void): void {
    window.clearInterval(fadeTimer);
    if (!audio) return done?.();
    const a = audio;
    const step = Math.max(0.02, Math.abs(target - a.volume) / Math.max(1, ms / 50));
    fadeTimer = window.setInterval(() => {
      const diff = target - a.volume;
      if (Math.abs(diff) <= step) {
        a.volume = target;
        window.clearInterval(fadeTimer);
        done?.();
      } else {
        a.volume = Math.min(1, Math.max(0, a.volume + Math.sign(diff) * step));
      }
    }, 50);
  }

  function ensureAudio(): HTMLAudioElement {
    if (audio) return audio;
    audio = new Audio(tracks[index]);
    audio.preload = "auto";
    audio.volume = 0;
    audio.loop = tracks.length === 1; // satu lagu: ulang terus
    audio.addEventListener("ended", () => {
      if (!audio) return;
      index = (index + 1) % tracks.length;
      audio.src = tracks[index];
      if (shouldPlay()) void audio.play().catch(() => undefined);
    });
    return audio;
  }

  type Phase = "intro" | "play" | "end";

  function phase(): Phase {
    if (root!.querySelector(".game-final")) return "end";
    if (root!.querySelector(".game-start")) return "intro";
    return "play";
  }

  function gameRunning(): boolean {
    return popupOpen && phase() === "play";
  }

  function shouldPlay(): boolean {
    return tracks.length > 0 && enabled && gameRunning() && !document.hidden;
  }

  function syncMusic(): void {
    if (shouldPlay()) {
      const a = ensureAudio();
      if (a.paused) {
        a.volume = 0;
        void a
          .play()
          .then(() => {
            fadeTo(VOLUME, 600);
            paintMusicButton();
          })
          .catch(() => paintMusicButton());
      } else {
        fadeTo(VOLUME, 400);
      }
    } else if (audio && !audio.paused) {
      const a = audio;
      fadeTo(0, popupOpen ? 700 : 150, () => {
        a.pause();
        if (!popupOpen) a.currentTime = 0;
        paintMusicButton();
      });
    }
    paintMusicButton();
  }

  // ---- Buka / tutup popup (game dipindahkan masuk-keluar popup) ----
  function openPopup(): void {
    if (popupOpen) return;
    popupOpen = true;
    body.appendChild(root as HTMLElement);
    popup.hidden = false;
    document.body.classList.add("game-lock");
    popup.querySelector<HTMLElement>(".game-popup__panel")?.focus();
  }

  function resetToIntro(): void {
    // Meniru klik "Pelajari lagi" agar game kembali ke layar belajar.
    const r = root as HTMLElement;
    const b = document.createElement("button");
    b.dataset.game = "intro";
    r.appendChild(b);
    b.click();
    b.remove();
  }

  function closePopup(reset: boolean): void {
    if (!popupOpen) return;
    popupOpen = false;
    popup.hidden = true;
    document.body.classList.remove("game-lock");
    anchor.parentElement?.insertBefore(root as HTMLElement, anchor.nextSibling);
    if (reset && phase() !== "intro") resetToIntro();
    syncMusic();
    (section as HTMLElement).querySelector<HTMLElement>(".game-start")?.focus({ preventScroll: true });
  }

  document.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("[data-game-close]")) closePopup(true);
  });

  document.addEventListener("keydown", (event) => {
    if (!popupOpen) return;
    if (event.key === "Escape") closePopup(true);
  });

  musicBtn.addEventListener("click", () => {
    enabled = !enabled;
    saveEnabled(enabled);
    syncMusic();
  });

  // Isi game berubah: mulai main -> popup terbuka; kembali ke layar belajar -> popup tertutup
  new MutationObserver(() => {
    const p = phase();
    if (p !== "intro" && !popupOpen) openPopup();
    else if (p === "intro" && popupOpen) closePopup(false);
    syncMusic();
  }).observe(root, { childList: true, subtree: true });
  document.addEventListener("visibilitychange", syncMusic);

  paintMusicButton();
}
