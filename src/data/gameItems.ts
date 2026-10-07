import type { BinType } from "./trashBins";

export interface GameItem {
  id: string;
  name: string;
  emoji: string;
  /** Gambar pengganti (opsional); salah satu dipilih acak setiap kali soal muncul. */
  variants?: string[];
  type: BinType;
  /** Penjelasan singkat yang tampil setelah menjawab */
  why: string;
}

export const GAME_ITEMS: GameItem[] = [
  // Organik
  { id: "kulit-pisang", name: "Kulit pisang", emoji: "🍌", variants: ["🍌", "🥭"], type: "organik", why: "Sisa buah mudah membusuk dan bisa dijadikan kompos." },
  { id: "sisa-nasi", name: "Nasi sisa", emoji: "🍚", type: "organik", why: "Sisa makanan adalah sampah organik. Pisahkan dari plastik agar tidak menghasilkan gas metana di TPA." },
  { id: "daun-kering", name: "Daun kering", emoji: "🍂", type: "organik", why: "Daun terurai alami dan cocok untuk kompos." },
  { id: "sisa-sayur", name: "Sisa sayur", emoji: "🥬", type: "organik", why: "Sayuran sisa masak adalah organik dan cepat membusuk." },
  { id: "cangkang-telur", name: "Cangkang telur", emoji: "🥚", type: "organik", why: "Cangkang telur berasal dari makhluk hidup dan bisa terurai menjadi kompos." },
  { id: "ampas-kopi", name: "Ampas kopi", emoji: "☕", type: "organik", why: "Ampas kopi organik dan bisa dipakai sebagai campuran kompos." },
  { id: "ranting", name: "Ranting pohon", emoji: "🌿", type: "organik", why: "Ranting dan potongan tanaman termasuk sampah organik." },
  { id: "kulit-apel", name: "Sisa apel", emoji: "🍎", variants: ["🍎", "🍏", "🍐"], type: "organik", why: "Sisa buah termasuk sampah organik." },
  { id: "kulit-semangka", name: "Kulit semangka", emoji: "🍉", type: "organik", why: "Kulit buah mudah terurai dan bagus untuk kompos." },
  { id: "bonggol-jagung", name: "Bonggol jagung", emoji: "🌽", type: "organik", why: "Bonggol jagung berasal dari tanaman dan bisa terurai menjadi kompos." },
  { id: "kulit-jeruk", name: "Kulit jeruk", emoji: "🍊", type: "organik", why: "Kulit jeruk adalah sisa buah yang bisa dikomposkan." },
  { id: "kulit-wortel", name: "Kulit wortel", emoji: "🥕", type: "organik", why: "Sisa kupasan sayur cepat membusuk dan cocok untuk kompos." },
  { id: "roti-basi", name: "Roti basi", emoji: "🍞", type: "organik", why: "Roti basi adalah sisa makanan, jadi masuk organik." },
  { id: "tulang-ayam", name: "Tulang ayam", emoji: "🍗", type: "organik", why: "Sisa lauk termasuk organik. Pisahkan dari plastik pembungkusnya." },
  { id: "bunga-layu", name: "Bunga layu", emoji: "🌸", type: "organik", why: "Bunga dan daun layu terurai alami." },
  { id: "kulit-kentang", name: "Kulit kentang", emoji: "🥔", type: "organik", why: "Kupasan umbi termasuk organik dan mudah menjadi kompos." },
  { id: "ampas-teh", name: "Ampas teh", emoji: "🍵", type: "organik", why: "Ampas teh organik dan baik untuk campuran kompos." },
  { id: "kulit-nanas", name: "Kulit nanas", emoji: "🍍", type: "organik", why: "Kulit nanas adalah sisa buah yang bisa dikomposkan." },
  { id: "kulit-kacang", name: "Kulit kacang", emoji: "🥜", type: "organik", why: "Kulit kacang berasal dari tanaman dan terurai alami." },
  { id: "jerami", name: "Jerami kering", emoji: "🌾", type: "organik", why: "Jerami dan rumput kering adalah organik dan bagus untuk kompos." },
  // Anorganik
  { id: "botol-plastik", name: "Botol plastik", emoji: "🧴", variants: ["🧴", "🍼"], type: "anorganik", why: "Plastik tidak membusuk, tetapi bisa didaur ulang jika bersih dan terpisah." },
  { id: "kaleng", name: "Kaleng minuman", emoji: "🥫", type: "anorganik", why: "Logam bernilai daur ulang tinggi bila tidak tercampur sisa makanan." },
  { id: "kertas", name: "Kertas bekas", emoji: "📄", variants: ["📄", "📃", "🗞️"], type: "anorganik", why: "Kertas kering bisa didaur ulang. Jangan sampai basah oleh sisa makanan." },
  { id: "kardus", name: "Kardus", emoji: "📦", type: "anorganik", why: "Kardus adalah bahan daur ulang yang bernilai." },
  { id: "gelas-plastik", name: "Gelas plastik", emoji: "🥤", variants: ["🥤", "🧋"], type: "anorganik", why: "Plastik sekali pakai. Lebih baik dikurangi dengan membawa tumbler (program BRINGIT)." },
  { id: "kantong-plastik", name: "Kantong plastik", emoji: "🛍️", type: "anorganik", why: "Kantong plastik sulit terurai. Buang di tong anorganik, dan lebih baik pakai tas kain." },
  { id: "botol-kaca", name: "Toples kaca", emoji: "🍯", type: "anorganik", why: "Kaca bisa didaur ulang berkali-kali tanpa menurunkan mutu." },
  { id: "styrofoam", name: "Wadah styrofoam", emoji: "🍱", type: "anorganik", why: "Styrofoam hampir tidak terurai. Buang ke anorganik dan hindari memakainya." },
  { id: "koran", name: "Koran bekas", emoji: "📰", type: "anorganik", why: "Koran kering bisa didaur ulang. Jaga agar tidak basah." },
  { id: "kemasan-jus", name: "Kemasan kotak jus", emoji: "🧃", type: "anorganik", why: "Kemasan karton berlapis plastik bisa didaur ulang jika dibilas dan dipipihkan." },
  { id: "baju-bekas", name: "Baju bekas", emoji: "👕", type: "anorganik", why: "Kain sulit terurai. Lebih baik disumbangkan, kalau rusak masuk anorganik." },
  { id: "sepatu-rusak", name: "Sepatu rusak", emoji: "👟", type: "anorganik", why: "Karet dan sintetis tidak membusuk, jadi masuk anorganik." },
  { id: "ember-plastik", name: "Ember plastik pecah", emoji: "🪣", type: "anorganik", why: "Plastik keras bisa didaur ulang di bank sampah." },
  { id: "sendok-plastik", name: "Sendok plastik", emoji: "🥄", type: "anorganik", why: "Alat makan sekali pakai sulit terurai. Bawa alat makan sendiri jika bisa." },
  { id: "buku-bekas", name: "Buku tulis bekas", emoji: "📓", type: "anorganik", why: "Kertas bisa didaur ulang bila kering dan bersih." },
  { id: "kotak-makan", name: "Kotak makan sekali pakai", emoji: "🥡", type: "anorganik", why: "Kemasan sekali pakai masuk anorganik. Bersihkan sisa makanan dulu." },
  // B3
  { id: "baterai", name: "Baterai bekas", emoji: "🔋", variants: ["🔋", "🪫"], type: "b3", why: "Baterai mengandung logam berat yang mencemari tanah dan air." },
  { id: "lampu", name: "Lampu neon", emoji: "💡", type: "b3", why: "Lampu neon mengandung merkuri. Jangan dipecahkan atau dicampur dengan sampah biasa." },
  { id: "hp-rusak", name: "HP rusak", emoji: "📱", type: "b3", why: "Sampah elektronik mengandung bahan berbahaya dan perlu penanganan khusus." },
  { id: "obat-kedaluwarsa", name: "Obat kedaluwarsa", emoji: "💊", type: "b3", why: "Obat kedaluwarsa dapat mencemari lingkungan, jadi tidak boleh dibuang ke tong biasa." },
  { id: "cat-bekas", name: "Sisa cat", emoji: "🎨", type: "b3", why: "Cat mengandung bahan kimia berbahaya." },
  { id: "kabel-rusak", name: "Charger rusak", emoji: "🔌", type: "b3", why: "Perangkat elektronik rusak termasuk limbah B3 (e-waste)." },
  { id: "termometer", name: "Termometer raksa", emoji: "🌡️", type: "b3", why: "Raksa sangat beracun dan tidak boleh dibuang ke tong biasa." },
  { id: "jarum-suntik", name: "Jarum suntik bekas", emoji: "💉", type: "b3", why: "Limbah medis tajam dan infeksius adalah B3 dan butuh penanganan khusus." },
  { id: "cairan-kimia", name: "Cairan kimia lab", emoji: "🧪", type: "b3", why: "Bahan kimia berbahaya tidak boleh dibuang ke saluran atau tong biasa." },
  { id: "oli-bekas", name: "Oli bekas", emoji: "🛢️", type: "b3", why: "Oli bekas mencemari tanah dan air, jadi tergolong B3." },
  { id: "laptop-rusak", name: "Laptop rusak", emoji: "💻", type: "b3", why: "Perangkat elektronik mengandung logam berat dan harus diserahkan ke pengelola e-waste." },
  { id: "tv-rusak", name: "TV rusak", emoji: "📺", type: "b3", why: "Televisi bekas termasuk limbah elektronik yang butuh penanganan khusus." },
  { id: "tinta-printer", name: "Cartridge tinta", emoji: "🖨️", type: "b3", why: "Sisa tinta dan cartridge mengandung bahan kimia yang berbahaya." },
];

export const ROUNDS_PER_GAME = 10;
