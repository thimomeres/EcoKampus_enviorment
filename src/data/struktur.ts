// Struktur Divisi Lingkungan Hidup BEM UNKLAB. Edit nama/jabatan di sini.
//
// FOTO: taruh foto di src/assets/Image/struktur/ dengan nama sesuai `id`, misalnya
//   keysia-dillak.jpg, jesi-sianturi.jpg, gerard-luden.jpg ...
// (boleh .jpg/.jpeg/.png/.webp, sebaiknya persegi). Selama belum ada, tampil foto dummy.
export interface Member {
  id: string;
  name: string;
  role: string;
}

export interface Unit {
  id: string;
  title: string;
  members: Member[];
}

export const KOORDINATOR: Member = {
  id: "keysia-dillak",
  name: "Keysia Dillak",
  role: "Koordinator Lingkungan Hidup",
};

// TODO: ganti "Anggota" dengan jabatan sebenarnya bila ada (mis. Ketua Bidang, Sekretaris).
export const UNITS: Unit[] = [
  {
    id: "program-operasional",
    title: "Program & Operasional",
    members: [
      { id: "jesi-sianturi", name: "Jesi Sianturi", role: "Anggota" },
      { id: "gerard-luden", name: "Gerard Luden", role: "Anggota" },
    ],
  },
  {
    id: "logistik",
    title: "Logistik",
    members: [
      { id: "yemima-simbage", name: "Yemima Simbage", role: "Anggota" },
      { id: "jonathan-tuuk", name: "Jonathan Tuuk", role: "Anggota" },
    ],
  },
  {
    id: "administrasi-event",
    title: "Administrasi & Event",
    members: [
      { id: "anggun-sasue", name: "Anggun Sasue", role: "Anggota" },
      { id: "natania-johannis", name: "Natania Johannis", role: "Anggota" },
    ],
  },
];

const photoModules = import.meta.glob("../assets/Image/struktur/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** Cari foto berdasarkan id anggota (nama file tanpa ekstensi). */
export function photoFor(id: string): string | null {
  for (const [path, url] of Object.entries(photoModules)) {
    const file = path.split("/").pop() ?? "";
    if (file.replace(/\.[^.]+$/, "") === id) return url;
  }
  return null;
}

export function memberCount(): number {
  return 1 + UNITS.reduce((total, unit) => total + unit.members.length, 0);
}
