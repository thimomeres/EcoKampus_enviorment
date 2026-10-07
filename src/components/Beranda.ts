import logoBEM from "../assets/Image/Bem2026.png";
import logoIgnite from "../assets/Image/ignitelogo-removebg-preview.png";
import bg1 from "../assets/Image/baground2.jpg";
import bg2 from "../assets/Image/baground3.jpeg";
import { WASTE_TYPES, WORK_PROGRAMS } from "../data/waste";
import tongTerdekat from "../assets/Image/tong-terdekat.jpg";

function wasteIcon(id: string): string {
  if (id === "organik") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M24 6c8 8 16 12 16 22a16 16 0 1 1-32 0c0-10 8-14 16-22z"/></svg>`;
  }
  if (id === "anorganik") {
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M18 8h12l2 6h8v4H8v-4h8l2-6zm-6 14h24l-2 18H14L12 22z"/></svg>`;
  }
  return `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="currentColor" d="M8 20h32v20H8V20zm16-12 6 8H18l6-8zM22 26h4v8h-4z"/></svg>`;
}

export function renderBeranda(): string {
  const wasteCards = WASTE_TYPES.map(
    (item) => `
      <article class="waste-card ${item.colorClass}" data-aos="fade-up">
        <div class="waste-card__icon">${wasteIcon(item.id)}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <ul>${item.examples.map((ex) => `<li>${ex}</li>`).join("")}</ul>
        <p class="waste-card__impact">${item.mixedImpact}</p>
      </article>
    `,
  ).join("");

  const programCards = WORK_PROGRAMS.map(
    (item) => `
      <article class="program-card" data-aos="fade-up">
        <h3>${item.name}</h3>
        <p>${item.summary}</p>
      </article>
    `,
  ).join("");

  return `
    <section id="home" class="hero">
      <div class="hero-bg" aria-hidden="true">
        <div class="hero-bg__layer is-active" style="--hero-image: url('${bg1}')"></div>
        <div class="hero-bg__layer" style="--hero-image: url('${bg2}')"></div>
      </div>
      <div class="hero-overlay"></div>
      <div class="hero-inner">
        <div class="hero-brand" data-aos="fade-down">
          <img src="${logoIgnite}" alt="Ignite The Light" class="hero-brand__logo hero-brand__logo--ignite" />
          <img src="${logoBEM}" alt="Logo BEM Unklab 2026" class="hero-brand__logo hero-brand__logo--bem" />
        </div>
        <h1 data-aos="fade-up" data-aos-delay="200">Pilah Sampah dari Sekarang</h1>
        <p data-aos="fade-up" data-aos-delay="350">
          Platform pusat edukasi dalam pemilahan sampah pada tempat sampah di kampus UNKLAB
          demi lingkungan yang bersih, sehat, dan berkelanjutan.
        </p>
        <div class="hero-actions" data-aos="fade-up" data-aos-delay="500">
          <a href="#lokasi" class="btn-primary">Lihat Lokasi Tong Sampah</a>
          <a href="#game" class="btn-outline">Main Game Pilah Sampah</a>
        </div>
      </div>
    </section>

    <section class="facts-strip section-content" aria-label="Fakta singkat EcoKampus">
      <article class="fact-card" data-aos="fade-up">
        <p class="fact-card__num">3</p>
        <h2>Jenis Sampah</h2>
        <p>Organik, anorganik, dan B3 — masing-masing punya tong dan cara kelola sendiri.</p>
      </article>
      <article class="fact-card" data-aos="fade-up" data-aos-delay="100">
        <p class="fact-card__num">3</p>
        <h2>Program Kerja</h2>
        <p>SORT, BRING IT, dan From Waste to Resource menggerakkan kebiasaan hijau di UNKLAB.</p>
      </article>
      <article class="fact-card" data-aos="fade-up" data-aos-delay="200">
        <p class="fact-card__num">1</p>
        <h2>Kampus Hijau</h2>
        <p>Satu gerakan bersama warga kampus: pilah dari sumbernya, setiap hari.</p>
      </article>
    </section>

    <section class="section-content waste-section">
      <header class="section-heading" data-aos="fade-up">
        <h2>Kenali 3 Jenis Sampah</h2>
        <p>Warna kartu mengikuti warna tong standar agar mudah diingat saat membuang.</p>
      </header>
      <div class="waste-grid">${wasteCards}</div>
    </section>

    <section class="section-content why-section">
      <header class="section-heading" data-aos="fade-up">
        <h2>Mengapa ini penting</h2>
      </header>
      <ol class="why-list">
        <li data-aos="fade-up">Membuang sampah sembarangan dan mencampur organik, anorganik, serta B3 membuat tumpukan sulit dikelola.</li>
        <li data-aos="fade-up" data-aos-delay="80">Banyak mahasiswa belum mengenal kategori sampah dan dampaknya jika tidak dipilah.</li>
        <li data-aos="fade-up" data-aos-delay="160">Belum ada media informasi terpusat di kampus yang menjelaskan cara memilah dengan jelas.</li>
      </ol>
    </section>

    <section class="section-content program-section">
      <header class="section-heading" data-aos="fade-up">
        <h2>Program Kerja</h2>
        <p>Tiga inisiatif Divisi Lingkungan Hidup yang bisa kamu ikuti.</p>
      </header>
      <div class="program-grid">${programCards}</div>
    </section>

    <section class="section-content map-preview" data-aos="fade-up">
      <div class="map-preview__card">
        <div class="map-preview__art">
          <img
            src="${tongTerdekat}"
            alt="Tiga tong sampah terpilah (organik, anorganik, B3) di depan peta kampus UNKLAB"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div class="map-preview__copy">
          <h2>Temukan tong sampah terdekat</h2>
          <p>Lihat titik tong sampah organik dan anorganik di peta satelit kampus UNKLAB, lengkap dengan rute menuju lokasinya.</p>
          <a class="btn-primary" href="#lokasi">Buka lokasi tong sampah</a>
        </div>
      </div>
    </section>

    <section class="section-content home-news" data-aos="fade-up">
      <header class="section-heading section-heading--row">
        <div>
          <h2>Berita terbaru</h2>
          <p>Cuplikan kabar lingkungan yang relevan untuk warga kampus.</p>
        </div>
        <a class="text-link" href="#berita">Lihat semua berita</a>
      </header>
      <div id="home-news-grid" class="news-grid news-grid--home">
        <div class="news-skeleton"></div>
        <div class="news-skeleton"></div>
        <div class="news-skeleton"></div>
      </div>
    </section>
  `;
}

export function initHeroSlider(): void {
  const layers = document.querySelectorAll<HTMLElement>(".hero-bg__layer");
  if (layers.length < 2) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  let current = 0;
  window.setInterval(() => {
    layers[current].classList.remove("is-active");
    current = (current + 1) % layers.length;
    layers[current].classList.add("is-active");
  }, 10000);
}
