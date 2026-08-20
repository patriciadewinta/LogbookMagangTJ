# Panduan Power Automate + Adaptive Card (LogbookMagangTJ)

Dokumen referensi untuk membangun flow notifikasi logbook. Payload dari aplikasi sudah memakai
**schema final** (`lib/notify.ts` → `buildLogbookNotification`), jadi flow di Power Automate
tidak perlu dibongkar ulang saat data asli datang.

## Status

- [x] Payload final dibuat di `app/actions.ts` (`submitLogbook`) + `lib/notify.ts`.
- [ ] Flow "When an HTTP request is received" dibuat di Power Automate.
- [ ] Tes kirim email/card pakai placeholder.
- [ ] Webhook URL di-set ke `.env.local`.
- [ ] Ganti seed approvers + data asli.

## Sample payload (untuk "Use sample payload to generate schema")

```json
{
  "tahap": "pembimbing",
  "emailTujuan": "pembimbing@contoh.com",
  "namaTujuan": "Sari Lestari",
  "emailPengaju": "budi@contoh.com",
  "namaPengaju": "Budi Santoso",
  "universitas": "Universitas Indonesia",
  "posisi": "Mobile Developer Intern",
  "domisili": "DKI Jakarta",
  "namaFile": "logbook-agustus-2026.pdf",
  "filePath": "uuid-pengguna/1724030400000-logbook-agustus-2026.pdf",
  "tanggal": "2026-08-19",
  "pesan": "Bapak/Ibu Sari Lestari, saya Budi Santoso, peserta magang dari Universitas Indonesia. Saya mohon Bapak/Ibu berkenan menandatangani logbook saya sebagai pemenuhan laporan magang. Terima kasih."
}
```

Catatan: `tahap` saat ini selalu `"pembimbing"` karena baru notifikasi awal yang terpasang.
Saat approval kadep/kadiv berjalan nanti, tinggal panggil `buildLogbookNotification` dengan
`tahap` yang berbeda.

## Contoh pesan per tahap

`pesan` disusun otomatis oleh `composeLogbookMessage` (`lib/notify.ts`), berbeda tiap tahap,
dengan sapaan sopan dan tanpa ucapan waktu. Penandatangan sebelumnya disebut dengan
**nama + tahap proses** ("oleh {nama} pada tahap {tahap}") — bukan jabatan, jadi aman kalau
jabatan approver berbeda dari label tahap.

- **pembimbing** (belum ada yang ttd):
  > Bapak/Ibu Sari Lestari, saya Budi Santoso, peserta magang dari Universitas Indonesia. Saya mohon Bapak/Ibu berkenan menandatangani logbook saya sebagai pemenuhan laporan magang. Terima kasih.

- **kadep** (pembimbing sudah ttd):
  > Bapak/Ibu Dewi Lestari, saya Budi Santoso, peserta magang dari Universitas Indonesia. Logbook saya telah ditandatangani oleh Sari Lestari pada tahap pembimbing. Untuk kelengkapan laporan magang, saya mohon Bapak/Ibu berkenan menandatangani logbook saya. Terima kasih.

- **kadiv** (pembimbing + kadep sudah ttd):
  > Bapak/Ibu Agus Wijaya, saya Budi Santoso, peserta magang dari Universitas Indonesia. Logbook saya telah ditandatangani oleh Sari Lestari pada tahap pembimbing dan Dewi Lestari pada tahap kepala departemen. Untuk kelengkapan laporan magang, saya mohon Bapak/Ibu berkenan menandatangani logbook saya. Terima kasih.

## Langkah build flow

1. Buka https://make.powerautomate.com → **Create** → **Automated cloud flow** →
   cari trigger **"When an HTTP request is received"**. Method: `POST`.
2. Di area *Request Body JSON Schema* klik **"Use sample payload to generate schema"** →
   tempel JSON sample di atas → **Done**.
3. Tambah action **"Send an email (V2)"** (Office 365 Outlook).
   - Untuk tes kirim pertama, kolom *To* boleh di-hardcode ke email sendiri dulu (placeholder).
   - Subject/body pakai **dynamic content** dari picker (jangan diketik manual).
4. **Test** → *Run flow* → cek email masuk. Kalau oke, salin **HTTP POST URL** dari trigger →
   taruh di `.env.local`:

   ```
   POWER_AUTOMATE_WEBHOOK_URL="https://prod-...westus.logic.azure.com/..."
   ```

   lalu restart `npm run dev`.
5. Email approver asli nanti tinggal diedit di tabel `approvers` (DB) — schema flow tidak berubah.

## Template body email (HTML)

Field diisi lewat dynamic content picker.

```html
<p>Halo <b>{namaTujuan}</b>,</p>
<p>{pesan}</p>
<table>
  <tr><td><b>Nama</b></td><td>{namaPengaju}</td></tr>
  <tr><td><b>Universitas</b></td><td>{universitas}</td></tr>
  <tr><td><b>Posisi</b></td><td>{posisi}</td></tr>
  <tr><td><b>File</b></td><td>{namaFile}</td></tr>
  <tr><td><b>Tanggal</b></td><td>{tanggal}</td></tr>
</table>
```

Catatan: `pesan` sudah diawali sapaan "Bapak/Ibu {namaTujuan}", jadi baris
`<p>Halo <b>{namaTujuan}</b>,</p>` boleh dihapus supaya tidak dobel.

## Opsi Adaptive Card (Teams)

Kalau mau notifikasi masuk ke Teams (bukan email), ganti action ke
**"Post adaptive card in a chat or channel"**. Contoh JSON card:

```json
{
  "type": "AdaptiveCard",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "version": "1.4",
  "body": [
    {
      "type": "TextBlock",
      "size": "Medium",
      "weight": "Bolder",
      "text": "Logbook Baru ({tahap})"
    },
    {
      "type": "TextBlock",
      "text": "{pesan}"
    },
    {
      "type": "FactSet",
      "facts": [
        { "title": "Nama", "value": "{namaPengaju}" },
        { "title": "Universitas", "value": "{universitas}" },
        { "title": "Posisi", "value": "{posisi}" },
        { "title": "File", "value": "{namaFile}" },
        { "title": "Tanggal", "value": "{tanggal}" }
      ]
    }
  ]
}
```

## Catatan lisensi / akun

- **Akun pribadi (free)**: bisa bikin flow, tapi ada batasan besar:
  - Trigger *"When an HTTP request is received"* secara resmi masuk **premium**
    (sering tetap muncul di free, tapi Microsoft mulai menegakkan lisensi → tidak dijamin).
  - *Office 365 Outlook* butuh **akun kerja/sekolah**. Connector *Outlook.com* untuk
    akun personal sudah deprecated (Mei 2025).
  - Free plan: limit ~750 run/bulan, **tidak bisa share flow**, tidak ada Approvals.
- **Solusi kalau butuh kirim email asli ke approver:**
  1. Minta **akun Microsoft 365 kantor** (kalau instansi tempat magang punya O365).
  2. Atau **kirim email langsung dari app** (tanpa Power Automate): Nodemailer + SMTP,
     Resend, atau SendGrid. Ganti isi `lib/notify.ts`, schema payload tetap sama.

## Catatan lain

- **Link file**: payload hanya berisi nama + path file, bukan URL publik. Kalau email/card
  mau ada tombol "Buka file", bucket `logbooks` di Supabase perlu di-public
  (URL = `https://<ref>.supabase.co/storage/v1/object/public/logbooks/{filePath}`),
  atau app mengirim signed URL — bisa ditambahkan belakangan tanpa bongkar schema flow.
- **Error typecheck pre-existing**: `app/actions.ts:379,490,602` memakai `startDate`/`endDate`
  yang belum ada di model `Profile` (`prisma/schema.prisma`) — di luar cakupan panduan ini.
