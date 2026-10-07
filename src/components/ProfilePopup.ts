import { PROFILE_PHOTO, PROFILE_POPUP } from "../data/profilePopup";
import { escapeHtml } from "../utils/format";

const SEEN_KEY = "ecokampus-profile-popup-seen";

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
    /* penyimpanan diblokir: abaikan */
  }
}

function renderPopup(): string {
  const { name, caption } = PROFILE_POPUP;
  const media = PROFILE_PHOTO
    ? `<img class="profile-popup__img" src="${escapeHtml(PROFILE_PHOTO)}" alt="Foto ${escapeHtml(name)}" />`
    : `<div class="profile-popup__initial" aria-hidden="true">${escapeHtml(name.charAt(0))}</div>`;
  return `
    <div id="profile-popup" class="profile-popup" hidden role="dialog" aria-modal="true" aria-labelledby="profile-popup-title">
      <div class="profile-popup__backdrop" data-close-profile></div>
      <div class="profile-popup__panel">
        <button type="button" class="profile-popup__close" data-close-profile aria-label="Tutup">×</button>
        ${media}
        <h3 id="profile-popup-title">${escapeHtml(name)}</h3>
        <p>${escapeHtml(caption)}</p>
        <button type="button" class="btn-primary" data-close-profile>Lanjut ke berita</button>
      </div>
    </div>`;
}

export function initProfilePopup(): void {
  const section = document.getElementById("berita");
  if (!section || alreadySeen()) return;

  document.body.insertAdjacentHTML("beforeend", renderPopup());
  const popup = document.getElementById("profile-popup");
  if (!popup) return;

  let previousFocus: HTMLElement | null = null;

  const close = (): void => {
    popup.hidden = true;
    document.body.classList.remove("modal-open");
    previousFocus?.focus();
  };

  const open = (): void => {
    markSeen();
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    popup.hidden = false;
    document.body.classList.add("modal-open");
    popup.querySelector<HTMLButtonElement>(".btn-primary")?.focus();
  };

  popup.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).closest("[data-close-profile]")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (popup.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "Tab") {
      const items = popup.querySelectorAll<HTMLElement>("button");
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

  // Muncul sekali, saat bagian Berita pertama kali masuk layar.
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        open();
      }
    },
    { threshold: 0.25 },
  );
  observer.observe(section);
}
