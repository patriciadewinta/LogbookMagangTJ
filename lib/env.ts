// Sanitasi env var yang ke-copy-paste dari Word/Notepad/dashboard Vercel.
//
// Nilai yang di-paste sering membawa karakter tak terlihat di ujungnya:
//   - U+FEFF (BOM)  → bikin `new Headers()` melempar
//     "Cannot convert argument to a ByteString because the character at
//     index N has a value of 65279". Gejalanya muncul saat build Vercel
//     ("Failed to collect page data"), bukan saat dev lokal.
//   - U+200B (zero-width space), U+00A0 (non-breaking space) → bikin URL
//     atau kredensial gagal auth tanpa pesan error yang jelas.
//   - \r\n dari file .env buatan Windows.
//
// Dulu ini di-patch satu-satu di tempat pemakaian (lihat riwayat commit
// "strip BOM/whitespace di RESEND_API_KEY"). Sekarang terpusat di sini
// supaya variabel baru otomatis ikut aman.

// Karakter tak terlihat yang dibuang dari TENGAH nilai — spasi asli tidak
// dibuang di sini karena password/kunci bisa saja memuatnya.
const INVISIBLE = /[​-‍⁠﻿]/g;

/** Buang BOM & karakter tak terlihat, lalu trim ujungnya. */
export function cleanEnv(value: string | undefined): string {
  if (!value) return "";
  return value.replace(INVISIBLE, "").trim();
}

/**
 * Baca env var yang sudah disanitasi. Untuk kredensial yang spasi di
 * tengahnya pasti bukan bagian nilai (API key, app password), pakai
 * opsi `stripAllWhitespace`.
 */
export function env(
  name: string,
  options: { stripAllWhitespace?: boolean } = {},
): string {
  const raw = cleanEnv(process.env[name]);
  return options.stripAllWhitespace ? raw.replace(/\s+/g, "") : raw;
}

/**
 * Validasi env wajib saat boot, bukan saat dipakai pertama kali.
 * Gagal di sini = pesan jelas di log build, bukan TypeError samar
 * di tengah request. Dipanggil dari next.config.ts supaya build Vercel
 * berhenti lebih awal kalau ada yang belum di-set.
 */
export const REQUIRED_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_APP_URL",
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
] as const;

/** Kembalikan daftar nama env yang kosong/hanya berisi whitespace. */
export function missingEnv(names: readonly string[] = REQUIRED_ENV): string[] {
  return names.filter((name) => cleanEnv(process.env[name]) === "");
}
