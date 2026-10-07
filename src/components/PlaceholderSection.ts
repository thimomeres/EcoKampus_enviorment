export function renderPlaceholderSection(options: {
  id: string;
  title: string;
  kicker: string;
  description: string;
  icon: string;
}): string {
  const { id, title, kicker, description, icon } = options;
  return `
    <section id="${id}" class="section-content placeholder-section" data-aos="fade-up">
      <div class="placeholder-card">
        <div class="placeholder-card__icon" aria-hidden="true">${icon}</div>
        <p class="placeholder-card__kicker">${kicker}</p>
        <h2>${title}</h2>
        <p>${description}</p>
        <p class="placeholder-card__soon">Segera hadir</p>
      </div>
    </section>
  `;
}

export function renderLokasiPlaceholder(): string {
  return renderPlaceholderSection({
    id: "lokasi",
    title: "Lokasi Tong Sampah Kampus",
    kicker: "Peta interaktif",
    description:
      "Nanti kamu bisa mencari tong organik, anorganik, dan B3 terdekat di UNKLAB lewat peta. Titik lokasi masih disusun agar data di lapangan akurat.",
    icon: `<svg viewBox="0 0 64 64" width="56" height="56"><path fill="#2e7d32" d="M32 6c-9 0-16 7-16 16 0 12 16 34 16 34s16-22 16-34c0-9-7-16-16-16zm0 22a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>`,
  });
}

export function renderGamePlaceholder(): string {
  return renderPlaceholderSection({
    id: "game",
    title: "Game Pilah Sampah",
    kicker: "Belajar sambil main",
    description:
      "Mini-game akan mengajak mahasiswa memilah organik, anorganik, dan B3 ke tong yang tepat. Skor dan tantangan harian menyusul di rilis berikutnya.",
    icon: `<svg viewBox="0 0 64 64" width="56" height="56"><rect x="8" y="20" width="48" height="28" rx="8" fill="#fbc02d"/><circle cx="24" cy="34" r="6" fill="#2e7d32"/><circle cx="40" cy="34" r="6" fill="#795548"/><rect x="28" y="12" width="8" height="10" fill="#2e7d32"/></svg>`,
  });
}
