import { CONTACT } from "../data/contact";
import { escapeHtml } from "../utils/format";
import { renderStrukturCard } from "./Struktur";

function waLink(text: string): string {
  return `https://wa.me/${CONTACT.whatsappE164}?text=${encodeURIComponent(text)}`;
}

export function renderKontak(): string {
  return `
    <section id="kontak" class="section-content kontak-section">
      <header class="section-heading" data-aos="fade-up">
        <h2>Kontak</h2>
        <p>Hubungi Divisi Lingkungan Hidup BEM UNKLAB lewat WhatsApp, Instagram, atau kirim pesan lewat formulir.</p>
      </header>
      <div class="kontak-grid">
        <div class="kontak-col">
        <div class="kontak-card" data-aos="fade-up">
          <h3>${escapeHtml(CONTACT.picName)}</h3>
          <ul class="kontak-list">
            <li>
              <span aria-hidden="true">☎</span>
              <a href="${waLink("Halo EcoKampus, saya ingin bertanya.")}" target="_blank" rel="noopener noreferrer">${escapeHtml(CONTACT.whatsappDisplay)}</a>
            </li>
            <li>
              <span aria-hidden="true">◎</span>
              <a href="${escapeHtml(CONTACT.instagramUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(CONTACT.instagramHandle)}</a>
            </li>
            <li>
              <span aria-hidden="true">⌂</span>
              <span>${escapeHtml(CONTACT.address)}</span>
            </li>
            <li>
              <span aria-hidden="true">◷</span>
              <span>${escapeHtml(CONTACT.hours)}</span>
            </li>
          </ul>
        </div>
        ${renderStrukturCard()}
        </div>
        <form id="kontak-form" class="kontak-form" data-aos="fade-up" novalidate>
          <h3>Kirim Pesan</h3>
          <p class="kontak-form__note">Tulis saran untuk Divisi Lingkungan Hidup atau laporan sampah (sebutkan lokasinya). Pesan langsung diteruskan ke email divisi.</p>
          <label>
            Pesan
            <textarea id="kontak-pesan" name="pesan" required minlength="10" maxlength="800" rows="6" placeholder="Tulis saran atau laporan sampah di sini..."></textarea>
            <span class="field-error" data-error-for="pesan"></span>
          </label>
          <input class="kontak-honey" type="text" name="_honey" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <button type="submit" class="btn-primary">Kirim</button>
          <p id="kontak-status" class="kontak-status" role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>
  `;
}

export function initKontak(): void {
  const form = document.getElementById("kontak-form") as HTMLFormElement | null;
  if (!form) return;

  const pesan = document.getElementById("kontak-pesan") as HTMLTextAreaElement;
  const status = document.getElementById("kontak-status") as HTMLElement;
  const err = form.querySelector('[data-error-for="pesan"]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');

  function setStatus(message: string, kind: "ok" | "error" | ""): void {
    status.textContent = message;
    status.className = `kontak-status${kind ? ` kontak-status--${kind}` : ""}`;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("", "");
    if (err) err.textContent = "";

    if (pesan.value.trim().length < 10) {
      if (err) err.textContent = "Pesan minimal 10 karakter.";
      return;
    }
    // Honeypot: bot mengisi kolom tersembunyi ini
    if ((form.elements.namedItem("_honey") as HTMLInputElement).value) return;

    if (submit) {
      submit.disabled = true;
      submit.textContent = "Mengirim...";
    }
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Pesan: pesan.value.trim(),
          _subject: "[EcoKampus] Pesan baru dari website",
          _template: "table",
          _captcha: "false",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { success?: string | boolean };
      if (!res.ok || String(data.success) === "false") throw new Error("gagal");
      setStatus("Terima kasih! Pesan Anda sudah terkirim ke Divisi Lingkungan Hidup.", "ok");
      form.reset();
    } catch {
      setStatus("Pesan belum terkirim. Coba lagi sebentar, atau kirim lewat WhatsApp.", "error");
    } finally {
      if (submit) {
        submit.disabled = false;
        submit.textContent = "Kirim";
      }
    }
  });
}
