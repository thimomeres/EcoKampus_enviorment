import logoCampus from "../assets/Image/logounklab.png";

export function renderFooter(): string {
  const year = new Date().getFullYear();
  return `
    <footer class="site-footer">
      <div class="site-footer__brand">
        <img src="${logoCampus}" alt="" class="site-footer__logo" />
        <div>
          <p class="site-footer__name">EcoKampus</p>
          <p>Divisi Lingkungan Hidup BEM Universitas Klabat</p>
        </div>
      </div>
      <nav class="site-footer__nav" aria-label="Tautan cepat">
        <a href="#home">Beranda</a>
        <a href="#tentang">Tentang</a>
        <a href="#lokasi">Lokasi</a>
        <a href="#berita">Berita</a>
        <a href="#game">Game</a>
        <a href="#kontak">Kontak</a>
      </nav>
      <p class="site-footer__copy">© ${year} EcoKampus. Dibuat oleh Divisi Lingkungan Hidup BEM UNKLAB.</p>
    </footer>
  `;
}
