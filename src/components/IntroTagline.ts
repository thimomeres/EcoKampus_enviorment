import "./Favicon";
// Tulisan di bawah "Divisi Lingkungan Hidup" pada layar pembuka.
const TAGLINE = "Edukasi Pemilahan Sampah";

export function addIntroTagline(): void {
  const title = document.querySelector(".intro__title");
  if (!title || document.querySelector(".intro__sub")) return;
  const p = document.createElement("p");
  p.className = "intro__sub";
  p.textContent = TAGLINE;
  p.style.cssText =
    "display:inline-block;margin:4px 0 0;padding:6px 18px;border-radius:999px;" +
    "background:rgba(255,255,255,.14);border:1px solid rgba(251,192,45,.55);color:#fff;" +
    "font-size:clamp(.85rem,2.4vw,1.05rem);font-weight:500;letter-spacing:.06em;";
  title.insertAdjacentElement("afterend", p);
}
