// Template email khusus "Reset Password Logbook Magang".
//
// Struktur & warna mengikuti desain Figma (file 1LZyWO11nj22zs2sWT9qki,
// node 254:349 "Card Reset Password"). Angka layout diambil dari pengukuran
// langsung node Figma, bukan perkiraan:
//
//   Kartu                570 x 711 px, bg #e9ecfc, radius 10px
//   Area putih header    526 x 52 px, inset 22px dari tepi kartu
//   Logo TJ              18 x 18, di x=50 / y=42.51 (lokal kartu)
//   Judul logbook        Inter bold 14
//   Kotak gradient       x=24, y=77.28, 522 x 191.27
//   Garis atas/bawah     nempel di tepi kotak gradient (y=75 & y=269.87)
//   Judul reset          Inter bold 30
//   Body                 Inter 14 (mixed bold)
//   Tombol               gradient 5672EE -> 406FE6 -> 001192
//
// PENTING — beda dari shell buildEmailHtml: di sini KARTU-nya yang biru
// #e9ecfc, dan hanya header yang putih. Di luar kartu tetap putih (default
// email client). Figma menaruh gradient sebagai kotak tersendiri di antara
// dua garis, bukan sebagai background header.
//
// Catatan kompatibilitas email client:
// - Semua layout pakai <table> + inline style (Gmail/Outlook strip <style>).
// - `linear-gradient` & `rgba()` tidak didukung Outlook desktop. Setiap
//   elemen bergradient/bergaris punya `bgcolor`/warna solid sebagai fallback.
// - Outlook tidak paham `border-radius` pada <a>/<td> biasa, jadi tombol
//   dibungkus <table> dengan bgcolor (area klik ikut ter-render).

import { escapeEmailHtml } from "./email-template";

const FONT = "Inter, Arial, Helvetica, sans-serif";
const BLUE = "#001192";
const CARD_BG = "#e9ecfc";
const BODY_TEXT = "#1f1f1f";

// Warna solid pengganti gradient untuk Outlook (yang tidak render gradient).
const HERO_SOLID = "#dbe1fb";
const BUTTON_SOLID = "#406fe6";
// Garis pemisah opsional (Figma punya Line 1 & 2, tapi tidak wajib di email).

// Gradient disalin apa adanya dari Figma.
const HEADER_GRADIENT =
  "linear-gradient(180deg, rgba(133,148,250,0.25) 0%, rgba(255,255,255,0.25) 50.489%, rgba(185,187,200,0.07) 100%)";
const BUTTON_GRADIENT =
  "linear-gradient(90deg, #5672ee 0%, #406fe6 50.969%, #001192 100%)";

// public/ tidak ikut bundle serverless function di Vercel, jadi aset harus
// diambil lewat URL publik. Gmail menahan gambar eksternal sampai penerima
// klik "Tampilkan gambar", jadi setiap gambar wajib punya alt text.
function assetUrl(path: string, fallback = "") {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || fallback;
  return base ? `${base}${path}` : "";
}

export interface ResetPasswordEmailOptions {
  name: string;
  resetUrl: string;
}

export function buildResetPasswordEmailHtml({
  name,
  resetUrl,
}: ResetPasswordEmailOptions): string {
  const heroUrl = assetUrl("/assets/reset-password-hero.png");
  const lockUrl = assetUrl("/assets/reset-password-lock.png");
  const logoUrl = assetUrl("/assets/logo-tj.png");

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reset Password Logbook Magang</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; -webkit-text-size-adjust: 100%;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; padding: 24px 12px;">
    <tr>
      <td align="center">

        <!-- ===== Kartu: bg #e9ecfc, 570px, radius 10 ===== -->
        <table role="presentation" width="570" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 570px; background-color: ${CARD_BG}; border-radius: 10px; overflow: hidden;">

          <!-- Area putih header 526x52, inset 22px dari tepi kartu -->
          <tr>
            <td style="padding: 22px 22px 0 22px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                <tr>
                  <td height="52" style="height: 52px; padding: 0 28px; font-family: ${FONT}; font-size: 14px; font-weight: bold; color: ${BLUE}; letter-spacing: 0.2px; vertical-align: middle;">
                    ${
                      logoUrl
                        ? `<img src="${logoUrl}" alt="Logo TransJakarta" width="18" height="18" style="display: inline-block; vertical-align: middle; border-radius: 4px; margin-right: 8px;"/>`
                        : ""
                    }<span style="display: inline-block; vertical-align: middle;">Logbook Magang TJ</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Jarak pemisah: Figma menaruh kotak gradient ~3px di bawah area
               putih. Tanpa ini gradient menempel ke header putih. -->
          <tr><td height="3" style="height: 3px; font-size: 0; line-height: 0;">&nbsp;</td></tr>

          <!-- Kotak gradient 522x191.27, inset 24px (area putih di atasnya
               inset 22px — beda 2px, sesuai Figma). -->
          <tr>
            <td style="padding: 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td bgcolor="${HERO_SOLID}" background="${heroUrl}" height="191" style="height: 191px; background-color: ${HERO_SOLID}; background-image: ${HEADER_GRADIENT}; background-repeat: no-repeat; background-position: center center; background-size: cover; border-radius: 4px; font-size: 0; line-height: 0;">
                    &nbsp;
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ===== Judul ===== -->
          <tr>
            <td style="padding: 26px 24px 0 24px; font-family: ${FONT}; font-size: 30px; font-weight: bold; color: ${BLUE}; line-height: 38px; letter-spacing: 0.3px;">
              Reset Password Logbook Magang
            </td>
          </tr>

          <!-- ===== Isi ===== -->
          <tr>
            <td style="padding: 12px 24px 0 24px; font-family: ${FONT}; font-size: 14px; color: ${BODY_TEXT}; line-height: 22px; letter-spacing: 0.14px;">
              <p style="margin: 0 0 12px 0;">Yth. <b>${escapeEmailHtml(name)}</b>,</p>
              <p style="margin: 0 0 12px 0;">
                Kami menerima permintaan untuk mengatur ulang password akun
                Logbook Magang Anda. Klik tombol di bawah untuk membuat
                password baru. Link ini bersifat pribadi dan hanya berlaku
                selama <b>1 jam</b>. Setelah masa berlaku habis, silakan minta
                ulang melalui halaman Lupa Password.
              </p>
              <p style="margin: 0 0 12px 0;">
                Mohon <b>TIDAK</b> menyerahkan password Anda ke siapa pun,
                termasuk Tim IT PT TransJakarta.
              </p>
              <p style="margin: 0;">
                Jika Anda tidak melakukan permintaan ini, abaikan email ini —
                password Anda tidak akan berubah.
              </p>
            </td>
          </tr>

          <!-- ===== Tombol CTA (gradient + ikon gembok) ===== -->
          <tr>
            <td style="padding: 22px 24px 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td align="center" bgcolor="${BUTTON_SOLID}" style="background-color: ${BUTTON_SOLID}; background-image: ${BUTTON_GRADIENT}; border-radius: 4px;">
                    <a href="${resetUrl}" target="_blank" role="button" style="display: block; padding: 15px 24px; font-family: ${FONT}; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 4px; mso-padding-alt: 15px 24px;">
                      <span style="display: inline-block; vertical-align: middle;">
                        ${
                          lockUrl
                            ? `<img src="${lockUrl}" alt="" width="16" height="14" style="display: inline-block; vertical-align: middle; border: 0; margin-right: 8px;"/>`
                            : ""
                        }<span style="display: inline-block; vertical-align: middle;">Reset Password</span>
                      </span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Link cadangan: sebagian webmail memblokir <a> yang dibungkus
               table, jadi link mentah selalu disediakan. -->
          <tr>
            <td style="padding: 14px 24px 26px 24px; font-family: ${FONT}; font-size: 12px; color: #6b6f8a; line-height: 18px;">
              Jika tombol tidak berfungsi, salin dan buka link berikut di browser:<br/>
              <a href="${resetUrl}" target="_blank" style="color: ${BLUE}; word-break: break-all;">${escapeEmailHtml(resetUrl)}</a>
            </td>
          </tr>

        </table>
        <!-- /Kartu -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
