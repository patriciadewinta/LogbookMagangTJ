# Deploy ke Vercel — Checklist

Dokumen ini mencatat hal-hal yang **harus** benar supaya deploy tidak gagal,
beserta alasan di baliknya. Urutannya sengaja: env dulu, baru deploy.

---

## 1. Set Environment Variables di Vercel

Vercel → Project → **Settings → Environment Variables**. Set untuk
**Production**, **Preview**, dan **Development** (centang ketiganya).

Daftar lengkap + contoh ada di `.env.example`. Yang wajib:

| Nama | Catatan |
|---|---|
| `DATABASE_URL` | Supabase **session pooler** (port **5432**), tambah `?connection_limit=5` |
| `DIRECT_URL` | Koneksi langsung, untuk `prisma migrate` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | aman di client |
| `SUPABASE_SERVICE_ROLE_KEY` | **server-only**, jangan pernah ke komponen client |
| `NEXT_PUBLIC_APP_URL` | URL produksi, **tanpa** trailing slash |
| `GMAIL_USER` | alamat Gmail pengirim |
| `GMAIL_APP_PASSWORD` | App Password 16 huruf (**bukan** password Gmail) |

> **Ketik manual. Jangan paste dari Word/Notepad/dokumen.**
>
> Ini penyebab build gagal yang sudah dua kali kejadian di project ini.
> Nilai yang di-paste membawa BOM (`U+FEFF`) di depan, lalu dipakai jadi
> header HTTP → Node melempar:
> `Cannot convert argument to a ByteString because the character at index 7
> has a value of 65279`.
>
> Kode sudah menyaring BOM di `lib/env.ts` dan `next.config.ts` sekarang
> menolak build lebih awal kalau ada env kosong, tapi bersih dari sumber
> tetap lebih baik.

## 2. Kenapa `DATABASE_URL` harus session pooler (5432)

Dari catatan di `.env` project ini: **transaction pooler ≈ 375ms/query,
session pooler ≈ 76ms/query.** Itu selisih ~300ms **per query**, dan satu
halaman bisa melakukan 3–6 query. Ini penyebab terbesar app terasa lemot.

Di Vercel (serverless), koneksi dibuat ulang sering, jadi tetap pasang
`?connection_limit=5` supaya tidak kena `EMAXCONNSESSION` — pool default
Prisma (`cpu*2+1`) gampang lewat batas pooler.

## 3. Region

- **Supabase**: sudah Singapore (`ap-southeast-1`) — jangan diubah.
- **Vercel**: pastikan region function juga dekat. Settings → Functions →
  Region → pilih **Singapore (sin1)**. Kalau function di US sementara DB di
  Singapore, tiap query menyeberang Pasifik.

## 4. Yang sudah dikonfigurasi di repo

| Berkas | Isi |
|---|---|
| `next.config.ts` | Validasi env saat build; `serverExternalPackages` untuk Prisma + Chromium; `outputFileTracingIncludes` untuk `templates/`; header keamanan |
| `lib/env.ts` | Sanitasi BOM/karakter tak terlihat di semua env var |
| `proxy.ts` | Tanpa query DB (dulu 1 round-trip di **setiap** request) |
| `app/actions.ts` | `submitLogbook` redirect dulu, PDF + email jalan via `after()` |

Timeout function: generate PDF pakai Chromium. Kalau nanti muncul timeout
saat submit, tambahkan di berkas yang memanggil `submitLogbook`:

```ts
export const maxDuration = 60; // detik — hanya efektif di Vercel Pro
```

## 5. Urutan deploy

```bash
# 1. Pastikan build lokal hijau dulu
npm run build

# 2. Deploy
vercel --prod
```

Kalau build gagal, baca pesannya: sejak `next.config.ts` diubah, kegagalan
env akan muncul sebagai daftar nama variabel yang kosong — bukan lagi
TypeError samar.

## 6. Setelah deploy — yang perlu dicek manual

- [ ] **Login** sebagai mahasiswa dan sebagai OD (pastikan OD mendarat di `/od`)
- [ ] **Submit logbook** → harus langsung pindah ke `/done-submit`, lalu PDF
      muncul di History beberapa detik kemudian (bukan instan — ini memang
      sengaja, lihat bagian 7)
- [ ] **Email TTD masuk** ke pembimbing, dan tombol di email bisa dibuka
- [ ] **QR verifikasi** di PDF mengarah ke domain produksi (bukan localhost)
      → kalau salah, `NEXT_PUBLIC_APP_URL` belum benar
- [ ] **Reset password** — link di email mengarah ke domain produksi
- [ ] **Upload avatar** & **import anak magang** berhasil (butuh
      `SUPABASE_SERVICE_ROLE_KEY`)

## 7. Catatan soal `submitLogbook` yang sekarang asinkron

Sebelumnya: user menunggu generate PDF (launch Chromium, 3–8 dtk) + upload +
insert + kirim SMTP Gmail (2–5 dtk) **sebelum** halaman berpindah. Total bisa
10–15 detik menatap spinner.

Sekarang: `redirect("/done-submit")` jalan lebih dulu, sisanya lewat
`after()` dari `next/server`.

**Konsekuensi yang perlu kamu tahu:** kalau generate PDF atau kirim email
gagal, user **tidak akan melihat error** — halaman sukses sudah terlanjur
tampil. Kegagalannya dicatat di log server:

```
submitLogbook latar gagal (submission <id>): <error>
```

Cek di Vercel → Project → **Logs** (filter `submitLogbook`) kalau ada laporan
"logbook tidak muncul" atau "email tidak masuk". Kalau nanti mau user tetap
dapat notifikasi kegagalan, itu perubahan terpisah — mis. simpan status
`pending`/`failed` di kolom submission lalu polling di halaman History.
