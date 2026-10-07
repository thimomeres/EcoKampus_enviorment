import type { Map as LeafletMap, Marker, LayerGroup, TileLayer, CircleMarker } from "leaflet";
import {
  BIN_META,
  CAMPUS_CENTER,
  trashPoints,
  type BinType,
  type TrashPoint,
} from "../data/trashBins";
import { escapeHtml } from "../utils/format";

type Filter = "all" | BinType;
type Leaflet = typeof import("leaflet");

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "organik", label: BIN_META.organik.label },
  { id: "anorganik", label: BIN_META.anorganik.label },
  { id: "b3", label: BIN_META.b3.label },
];

// Foto opsional: taruh file di src/assets/Image/lokasi/. Jika folder kosong, tidak ada error.
const PHOTOS = import.meta.glob<string>("../assets/Image/lokasi/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

function photoUrl(name?: string): string | null {
  if (!name) return null;
  const key = Object.keys(PHOTOS).find((k) => k.endsWith(`/${name}`));
  return key ? PHOTOS[key] : null;
}

const state: {
  filter: Filter;
  map: LeafletMap | null;
  L: Leaflet | null;
  markers: Map<string, Marker>;
  layer: LayerGroup | null;
  me: CircleMarker | null;
} = { filter: "all", map: null, L: null, markers: new Map(), layer: null, me: null };

function visiblePoints(): TrashPoint[] {
  return trashPoints.filter((p) => state.filter === "all" || p.types.includes(state.filter));
}

/** Satu jenis = satu warna; beberapa jenis = pin terbelah sesuai warna tiap tong (mis. hijau + kuning). */
function typesBackground(types: BinType[]): string {
  const colors = types.map((t) => BIN_META[t].color);
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  const stops = colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(", ");
  return `linear-gradient(135deg, ${stops})`;
}

function pinColor(p: TrashPoint): string {
  return typesBackground(p.types);
}

function badges(types: BinType[]): string {
  return types
    .map(
      (t) =>
        `<span class="bin-badge" style="--bin:${BIN_META[t].color}">${escapeHtml(BIN_META[t].label)}</span>`,
    )
    .join("");
}

function directionsUrl(p: TrashPoint): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;
}

function accuracyNote(p: TrashPoint): string {
  const parts: string[] = [];
  if (p.accuracy === "gedung") parts.push("Lokasi per gedung");
  if (!p.verified) parts.push("koordinat perkiraan");
  return parts.length ? `<p class="lokasi-acc">${escapeHtml(parts.join(" · "))}</p>` : "";
}

function popupHtml(p: TrashPoint): string {
  const photo = photoUrl(p.photo);
  return `
    <div class="lokasi-popup">
      ${photo ? `<img src="${escapeHtml(photo)}" alt="Foto ${escapeHtml(p.name)}" loading="lazy" />` : ""}
      <h4>${escapeHtml(p.name)}</h4>
      <p>${escapeHtml(p.description)}</p>
      <div class="lokasi-badges">${badges(p.types)}</div>
      ${accuracyNote(p)}
      <a class="lokasi-route" href="${escapeHtml(directionsUrl(p))}" target="_blank" rel="noopener noreferrer">Rute di Google Maps ↗</a>
    </div>`;
}

function listHtml(points: TrashPoint[]): string {
  if (points.length === 0) {
    return `<div class="lokasi-empty"><p>Belum ada titik untuk jenis tong ini.</p><button type="button" class="btn-primary" data-lokasi-reset>Tampilkan semua</button></div>`;
  }
  return points
    .map((p) => {
      const photo = photoUrl(p.photo);
      return `
      <article class="lokasi-card">
        ${photo ? `<img class="lokasi-card__img" src="${escapeHtml(photo)}" alt="" loading="lazy" />` : ""}
        <div class="lokasi-card__body">
          <h3>${escapeHtml(p.name)}</h3>
          <p>${escapeHtml(p.description)}</p>
          <div class="lokasi-badges">${badges(p.types)}</div>
          ${accuracyNote(p)}
          <div class="lokasi-card__actions">
            <button type="button" class="lokasi-btn" data-focus="${escapeHtml(p.id)}">Lihat di peta</button>
            <a class="lokasi-btn lokasi-btn--ghost" href="${escapeHtml(directionsUrl(p))}" target="_blank" rel="noopener noreferrer">Rute ↗</a>
          </div>
        </div>
      </article>`;
    })
    .join("");
}

export function renderLokasi(): string {
  const chips = FILTERS.map(
    (f) =>
      `<button type="button" class="filter-chip${f.id === "all" ? " is-active" : ""}" data-lokasi-filter="${f.id}" aria-pressed="${f.id === "all"}">${escapeHtml(f.label)}</button>`,
  ).join("");

  return `
    <section id="lokasi" class="section-content lokasi-section">
      <header class="section-heading" data-aos="fade-up">
        <h2>Lokasi Tong Sampah Kampus</h2>
        <p>Temukan tong sampah terpilah di kampus UNKLAB. Pilih jenis tong, lalu lihat lokasinya di peta satelit.</p>
      </header>
      <p class="lokasi-note" data-aos="fade-up">
        Saat ini lokasi ditampilkan per gedung. Titik yang lebih rinci akan ditambahkan secara bertahap.
      </p>

      <div class="lokasi-toolbar" data-aos="fade-up">
        <div class="filter-chips" role="group" aria-label="Filter jenis tong">${chips}</div>
        <div class="lokasi-actions">
          <div class="lokasi-seg" role="group" aria-label="Jenis peta">
            <button type="button" class="lokasi-seg__btn is-active" data-layer="sat" aria-pressed="true">Satelit</button>
            <button type="button" class="lokasi-seg__btn" data-layer="osm" aria-pressed="false">Peta</button>
          </div>
          <button type="button" class="lokasi-btn" id="lokasi-locate">Lokasi saya</button>
          <button type="button" class="lokasi-btn lokasi-btn--ghost" id="lokasi-reset">Kembali ke kampus</button>
        </div>
      </div>
      <p id="lokasi-geo" class="lokasi-geo" aria-live="polite"></p>

      <div class="lokasi-layout">
        <div class="lokasi-map-wrap" data-aos="fade-up">
          <div id="lokasi-map" role="region" aria-label="Peta lokasi tong sampah Universitas Klabat" tabindex="0"></div>
          <ul class="lokasi-legend" aria-label="Legenda">
            <li><span class="legend-dot" style="background:${typesBackground(["organik", "anorganik"])}"></span>Organik + anorganik</li>
          </ul>
          <div id="lokasi-loading" class="lokasi-overlay">Memuat peta…</div>
          <div id="lokasi-error" class="lokasi-overlay" hidden>
            <p>Peta tidak dapat dimuat. Periksa koneksi internet.</p>
            <button type="button" class="btn-primary" id="lokasi-retry">Muat ulang peta</button>
          </div>
          <div id="lokasi-pick" class="lokasi-pick" hidden></div>
        </div>
        <aside id="lokasi-list" class="lokasi-list" aria-label="Daftar lokasi tong sampah"></aside>
      </div>
      <p id="lokasi-live" class="visually-hidden" aria-live="polite"></p>
    </section>
  `;
}

function pinIcon(L: Leaflet, p: TrashPoint) {
  const html = `<div class="pin" style="--pin:${pinColor(p)}"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="#fff" d="M9 3h6l1 2h4v2H4V5h4l1-2zm-3 6h12l-1 12H7L6 9z"/></svg></div>`;
  return L.divIcon({
    className: "pin-wrap",
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -34],
  });
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function moveTo(lat: number, lng: number, zoom: number): void {
  const map = state.map;
  if (!map) return;
  if (reducedMotion()) map.setView([lat, lng], zoom);
  else map.flyTo([lat, lng], zoom, { duration: 1.1 });
}

function syncMarkers(): void {
  const { L, layer } = state;
  if (!L || !layer) return;
  layer.clearLayers();
  state.markers.clear();
  const points = visiblePoints();
  for (const p of points) {
    const marker = L.marker([p.lat, p.lng], { icon: pinIcon(L, p), title: p.name, alt: p.name });
    marker.bindPopup(popupHtml(p), { maxWidth: 260 });
    marker.addTo(layer);
    state.markers.set(p.id, marker);
  }
  const list = document.getElementById("lokasi-list");
  if (list) list.innerHTML = listHtml(points);
  const live = document.getElementById("lokasi-live");
  if (live) live.textContent = `${points.length} lokasi ditampilkan`;
}

function fitAll(): void {
  const { map, L } = state;
  if (!map || !L) return;
  const pts = visiblePoints();
  if (pts.length === 0) {
    map.setView([CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], CAMPUS_CENTER.zoom);
    return;
  }
  if (pts.length === 1) {
    map.setView([pts[0].lat, pts[0].lng], 18);
    return;
  }
  map.fitBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lng] as [number, number])), {
    padding: [60, 60],
    maxZoom: 18,
  });
}

function setupPickMode(map: LeafletMap, L: Leaflet): void {
  const box = document.getElementById("lokasi-pick");
  if (!box) return;
  let temp: CircleMarker | null = null;
  box.hidden = false;
  box.innerHTML = `<strong>Mode pilih titik aktif.</strong> Klik di peta untuk mengambil koordinat.`;
  map.on("click", (e) => {
    const text = `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}`;
    temp?.remove();
    temp = L.circleMarker(e.latlng, { radius: 7, color: "#fff", weight: 2, fillColor: "#c62828", fillOpacity: 1 }).addTo(map);
    box.innerHTML = `<strong>Mode pilih titik aktif.</strong>
      <input id="pick-value" readonly value="${text}" aria-label="Koordinat terpilih" />
      <button type="button" id="pick-copy" class="lokasi-btn">Salin</button>`;
    const input = document.getElementById("pick-value") as HTMLInputElement;
    document.getElementById("pick-copy")?.addEventListener("click", () => {
      const done = () => {
        const b = document.getElementById("pick-copy");
        if (b) b.textContent = "Tersalin ✓";
      };
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(done, () => input.select());
      } else {
        input.select();
      }
    });
  });
}

async function buildMap(): Promise<void> {
  const mapEl = document.getElementById("lokasi-map");
  const loading = document.getElementById("lokasi-loading");
  const errorBox = document.getElementById("lokasi-error");
  if (!mapEl || state.map) return;

  const L = await import("leaflet");
  await import("leaflet/dist/leaflet.css");
  state.L = L;

  const bounds = L.latLngBounds(
    [CAMPUS_CENTER.lat - 0.012, CAMPUS_CENTER.lng - 0.012],
    [CAMPUS_CENTER.lat + 0.012, CAMPUS_CENTER.lng + 0.012],
  );
  const map = L.map(mapEl, {
    center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
    zoom: CAMPUS_CENTER.zoom,
    minZoom: 15,
    maxZoom: 19,
    maxBounds: bounds,
    maxBoundsViscosity: 0.8,
    scrollWheelZoom: false,
  });
  state.map = map;

  const sat: TileLayer = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      maxZoom: 19,
      attribution:
        "Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    },
  );
  const osm: TileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  });
  sat.addTo(map);

  let loaded = 0;
  let failed = 0;
  const watch = (layer: TileLayer) => {
    layer.on("tileload", () => {
      loaded += 1;
      if (loading) loading.hidden = true;
      if (errorBox) errorBox.hidden = true;
    });
    layer.on("tileerror", () => {
      failed += 1;
      if (failed >= 4 && loaded === 0) {
        if (loading) loading.hidden = true;
        if (errorBox) errorBox.hidden = false;
      }
    });
  };
  watch(sat);
  watch(osm);

  state.layer = L.layerGroup().addTo(map);
  syncMarkers();
  fitAll();

  map.on("click", () => map.scrollWheelZoom.enable());
  map.on("mouseout", () => map.scrollWheelZoom.disable());
  window.addEventListener("resize", () => map.invalidateSize());
  window.setTimeout(() => map.invalidateSize(), 250);

  // Pengalih layer
  document.querySelectorAll<HTMLButtonElement>("[data-layer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const useSat = btn.dataset.layer === "sat";
      if (useSat) {
        map.removeLayer(osm);
        sat.addTo(map);
      } else {
        map.removeLayer(sat);
        osm.addTo(map);
      }
      document.querySelectorAll<HTMLButtonElement>("[data-layer]").forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      });
    });
  });

  document.getElementById("lokasi-retry")?.addEventListener("click", () => {
    failed = 0;
    if (errorBox) errorBox.hidden = true;
    if (loading) loading.hidden = false;
    sat.redraw();
    osm.redraw();
  });

  if (new URLSearchParams(window.location.search).get("pick") === "1") {
    setupPickMode(map, L);
  }
}

function locateMe(): void {
  const msg = document.getElementById("lokasi-geo");
  const { map, L } = state;
  if (!msg) return;
  if (!navigator.geolocation) {
    msg.textContent = "Peramban kamu tidak mendukung fitur lokasi.";
    return;
  }
  if (!map || !L) {
    msg.textContent = "Peta belum siap, coba sebentar lagi.";
    return;
  }
  msg.textContent = "Mencari lokasimu…";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      const pts = visiblePoints().length ? visiblePoints() : trashPoints;
      let nearest = pts[0];
      let best = Infinity;
      for (const p of pts) {
        const d = haversineMeters(latitude, longitude, p.lat, p.lng);
        if (d < best) {
          best = d;
          nearest = p;
        }
      }
      const dist = best < 1000 ? `${Math.round(best)} m` : `${(best / 1000).toFixed(1)} km`;
      if (best > 3000) {
        msg.textContent = `Kamu berada di luar area kampus (± ${dist} dari titik terdekat, ${nearest.name}).`;
        return;
      }
      state.me?.remove();
      state.me = L.circleMarker([latitude, longitude], {
        radius: 9,
        color: "#fff",
        weight: 3,
        fillColor: "#1976d2",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip("Lokasimu");
      msg.textContent = `Titik terdekat: ${nearest.name} (± ${dist}).`;
      moveTo(latitude, longitude, 18);
    },
    (err) => {
      msg.textContent =
        err.code === err.PERMISSION_DENIED
          ? "Izin lokasi ditolak. Aktifkan izin lokasi di peramban untuk memakai fitur ini."
          : "Lokasimu tidak dapat ditentukan saat ini.";
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
  );
}

function setFilter(filter: Filter): void {
  state.filter = filter;
  document.querySelectorAll<HTMLButtonElement>("[data-lokasi-filter]").forEach((chip) => {
    const on = chip.dataset.lokasiFilter === filter;
    chip.classList.toggle("is-active", on);
    chip.setAttribute("aria-pressed", String(on));
  });
  syncMarkers();
  fitAll();
}

export function initLokasi(): void {
  const section = document.getElementById("lokasi");
  if (!section) return;

  // Daftar lokasi langsung tampil (tanpa menunggu peta)
  const list = document.getElementById("lokasi-list");
  if (list) list.innerHTML = listHtml(visiblePoints());

  section.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    const chip = target.closest<HTMLElement>("[data-lokasi-filter]");
    if (chip) {
      setFilter(chip.dataset.lokasiFilter as Filter);
      return;
    }
    if (target.closest("[data-lokasi-reset]")) {
      setFilter("all");
      return;
    }
    const focusBtn = target.closest<HTMLElement>("[data-focus]");
    if (focusBtn) {
      const id = focusBtn.dataset.focus ?? "";
      const point = trashPoints.find((p) => p.id === id);
      const marker = state.markers.get(id);
      if (point && marker) {
        document.getElementById("lokasi-map")?.scrollIntoView({
          behavior: reducedMotion() ? "auto" : "smooth",
          block: "center",
        });
        moveTo(point.lat, point.lng, 19);
        window.setTimeout(() => marker.openPopup(), reducedMotion() ? 0 : 1100);
      }
      return;
    }
    if (target.closest("#lokasi-retry") && !state.map) {
      const loading = document.getElementById("lokasi-loading");
      const errorBox = document.getElementById("lokasi-error");
      if (loading) loading.hidden = false;
      if (errorBox) errorBox.hidden = true;
      start();
      return;
    }
    if (target.closest("#lokasi-reset")) {
      state.map?.closePopup();
      fitAll();
      return;
    }
    if (target.closest("#lokasi-locate")) {
      locateMe();
    }
  });

  // Peta dibuat lazy: baru dimuat saat section mendekati layar
  const start = () => {
    void buildMap().catch(() => {
      const loading = document.getElementById("lokasi-loading");
      const errorBox = document.getElementById("lokasi-error");
      if (loading) loading.hidden = true;
      if (errorBox) errorBox.hidden = false;
    });
  };
  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        start();
      }
    },
    { rootMargin: "300px 0px" },
  );
  observer.observe(section);
}
