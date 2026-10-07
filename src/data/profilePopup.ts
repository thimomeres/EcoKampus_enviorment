// Data popup profil di halaman Berita. Edit teks di sini.
// Foto: taruh file di src/assets/Image/profil/ dengan nama "jerhemy-owen.jpg"
// (boleh .jpg/.jpeg/.png/.webp). Jika belum ada, popup tampil dengan inisial.
export interface ProfilePopupData {
  name: string;
  caption: string;
}

export const PROFILE_POPUP: ProfilePopupData = {
  name: "Jerhemy Owen",
  caption: "Selamat datang di halaman Berita EcoKampus.", // TODO: ganti dengan teks yang Anda mau
};

const photos = import.meta.glob("../assets/Image/profil/jerhemy-owen.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const PROFILE_PHOTO: string | null = Object.values(photos)[0] ?? null;
