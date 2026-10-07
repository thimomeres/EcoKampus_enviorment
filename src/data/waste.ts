export interface WasteType {
  id: "organik" | "anorganik" | "b3";
  title: string;
  colorClass: string;
  description: string;
  examples: string[];
  mixedImpact: string;
}

export interface WorkProgram {
  id: string;
  name: string;
  summary: string;
}

export const WASTE_TYPES: WasteType[] = [
  {
    id: "organik",
    title: "Organik",
    colorClass: "waste-card--organik",
    description:
      "Sisa makhluk hidup yang mudah membusuk. Dipilah terpisah agar bisa dikompos, bukan menumpuk di TPA.",
    examples: ["Sisa makanan", "Daun dan ranting", "Kulit buah"],
    mixedImpact:
      "Jika tercampur, organik membusuk di antara plastik dan menghasilkan gas serta bau yang memicu masalah di TPA.",
  },
  {
    id: "anorganik",
    title: "Anorganik",
    colorClass: "waste-card--anorganik",
    description:
      "Material yang tidak mudah membusuk dan masih bernilai daur ulang jika bersih dan terpisah.",
    examples: ["Botol plastik", "Kertas dan kardus", "Kaleng minuman"],
    mixedImpact:
      "Jika tercampur sisa makanan, material ini kotor dan sulit didaur ulang — akhirnya ikut dibuang ke TPA.",
  },
  {
    id: "b3",
    title: "B3",
    colorClass: "waste-card--b3",
    description:
      "Bahan berbahaya dan beracun. Tidak boleh dicampur ke tong biasa karena mencemari tanah dan air.",
    examples: ["Baterai bekas", "Lampu neon/LED", "Elektronik rusak"],
    mixedImpact:
      "Jika tercampur, zat kimia merembes ke sampah lain dan membuat seluruh tumpukan lebih berbahaya.",
  },
];

export const WORK_PROGRAMS: WorkProgram[] = [
  {
    id: "sort",
    name: "SORT",
    summary:
      "Pengadaan tempat sampah dan pemilahan organik–anorganik di lingkungan kampus UNKLAB agar buang sampah punya jalur yang jelas.",
  },
  {
    id: "bringit",
    name: "BRINGIT",
    summary:
      "Gerakan membawa tumbler pribadi setiap hari. Ada apresiasi bagi mahasiswa yang konsisten mengurangi plastik sekali pakai.",
  },
  {
    id: "waste-to-resource",
    name: "From Waste to Resource",
    summary:
      "Workshop bersama fakultas pertanian tentang lingkungan: mengubah cara pandang sampah dari beban menjadi sumber daya.",
  },
];
