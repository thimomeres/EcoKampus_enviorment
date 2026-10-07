export type BinType = "organik" | "anorganik" | "b3";

export interface BinMeta {
  label: string;
  color: string;
}

export const BIN_META: Record<BinType, BinMeta> = {
  organik: { label: "Organik", color: "#2e7d32" },
  anorganik: { label: "Anorganik", color: "#fbc02d" },
  b3: { label: "B3", color: "#c62828" },
};

/** Warna pin untuk titik yang punya lebih dari satu jenis tong ("terpilah"). */
export const MIXED_COLOR = "#795548";

export interface TrashPoint {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  types: BinType[];
  /** "gedung" = lokasi umum per gedung, "tepat" = titik tong yang sebenarnya */
  accuracy: "gedung" | "tepat";
  /** false = koordinat masih perkiraan, belum dicek di lapangan */
  verified: boolean;
  /** Nama file foto (opsional) di src/assets/Image/lokasi/, mis. "gedung-kuliah-1.jpg" */
  photo?: string;
}

// Pusat kampus Universitas Klabat, Airmadidi (rata-rata ketiga titik tong).
export const CAMPUS_CENTER: { lat: number; lng: number; zoom: number } = {
  lat: 1.41788,
  lng: 124.983803,
  zoom: 17,
};

// Koordinat diambil langsung di lapangan (Google Maps, iPhone). Semua titik saat ini
// hanya punya tong organik + anorganik (hijau + kuning); belum ada tong B3.
export const trashPoints: TrashPoint[] = [
  {
    id: "pioneer-chapel",
    name: "Depan Pioneer Chapel",
    description: "Tong sampah organik dan anorganik di depan Pioneer Chapel.",
    lat: 1.4185921,
    lng: 124.9840924,
    types: ["organik", "anorganik"],
    accuracy: "tepat",
    verified: true,
    photo: "pioneer-chapel.jpg",
  },
  {
    id: "gedung-kuliah-1",
    name: "Gedung Kuliah 1",
    description: "Tong sampah organik dan anorganik di area Gedung Kuliah 1.",
    lat: 1.4177401,
    lng: 124.9845796,
    types: ["organik", "anorganik"],
    accuracy: "tepat",
    verified: true,
    photo: "gedung-kuliah-1.jpg",
  },
  {
    id: "gedung-kuliah-3",
    name: "Gedung Kuliah 3",
    description: "Tong sampah organik dan anorganik di area Gedung Kuliah 3.",
    lat: 1.4173043,
    lng: 124.9827366,
    types: ["organik", "anorganik"],
    accuracy: "tepat",
    verified: true,
    photo: "gedung-kuliah-3.jpg",
  },
  // TODO: tambah titik baru di sini
];
