// Template email khusus "Reset Password Logbook Magang".
//
// Struktur mengikuti card "Permohonan Tanda Tangan Logbook" (Figma node
// 256:284) supaya kedua email punya bentuk yang sama:
//
//   Kartu              570 px, bg #e9ecfc, radius 10
//   Kotak putih        522 px, inset 24px, mulai 22px dari atas kartu
//                      -> berisi SELURUH isi (logo, gradient, judul, isi, tombol)
//   Logo Tj            19 x 17 @ padding 20px 26px
//   Line 1             tepat di atas kotak gradient
//   Gradient rect      522 x 191, hero image di tengahnya
//   Judul              Inter bold 30, #001192
//   Body               Inter 14
//   Tombol             gradient 5672EE -> 406FE6 -> 001192
//
// Catatan kompatibilitas email client:
// - Semua layout pakai <table> + inline style (Gmail/Outlook strip <style>).
// - `linear-gradient` & `rgba()` tidak didukung Outlook desktop, jadi setiap
//   elemen bergradient punya `bgcolor` solid sebagai fallback.
// - Outlook tidak paham `border-radius` pada <a>/<td> biasa, jadi tombol
//   dibungkus <table> dengan bgcolor (area klik ikut ter-render).
// - Gambar hero dipasang lewat <img> (bukan cuma `background-image`) karena
//   Gmail/Outlook memblokir background-image.

import { escapeEmailHtml } from "./email-template";

const FONT = "Inter, Arial, Helvetica, sans-serif";
const BLUE = "#001192";
const CARD_BG = "#e9ecfc";
const BODY_TEXT = "#000000";

// Warna solid pengganti gradient untuk Outlook (tidak render gradient).
const HERO_SOLID = "#c9d2f6";
const BUTTON_SOLID = "#406fe6";
// Garis: rgba tak didukung Outlook, jadi pakai hex setara.
const RULE = "#c3cae8";

// Gradient hero: 3 stop dari Figma, masing-masing sudah dikalikan opacity
// keseluruhan 25% (Figma menyimpan "opacity layer" terpisah dari opacity stop,
// sedangkan CSS tidak punya tempat untuk itu — kalau dipasang sebagai
// `opacity: 0.25` pada elemennya, hero image ikut pudar juga).
//   0%   #8594FA @100% x25% -> rgba(133,148,250,0.25)
//   50%  #FFFFFF @100% x25% -> rgba(255,255,255,0.25)
//   100% #B9BBC8 @ 27% x25% -> rgba(185,187,200,0.0675)
const HERO_GRADIENT =
  "linear-gradient(180deg, rgba(133,148,250,0.25) 0%, rgba(255,255,255,0.25) 50%, rgba(185,187,200,0.0675) 100%)";
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

          <!-- Kotak putih 522px, inset 24px, mulai 22px dari atas kartu.
               Berisi SELURUH isi, bukan cuma strip header. -->
          <tr>
            <td style="padding: 22px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 10px;">

                <!-- Baris logo + nama sistem -->
                <tr>
                  <td style="padding: 20px 26px 0 26px; font-family: ${FONT}; font-size: 14px; font-weight: bold; color: ${BLUE}; letter-spacing: 0.2px;">
                    ${
                      logoUrl
                        ? `<img src="${logoUrl}" alt="Logo TransJakarta" width="19" height="17" style="display: inline-block; vertical-align: middle; border-radius: 4px; margin-right: 6px;"/>`
                        : ""
                    }<span style="display: inline-block; vertical-align: middle;">Logbook Magang TJ</span>
                  </td>
                </tr>

                <!-- Line 1: tepat di atas kotak gradient -->
                <tr>
                  <td style="padding: 20px 0 0 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="border-top: 1px solid ${RULE}; font-size: 0; line-height: 0;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Kotak gradient 522x191 dengan ilustrasi hero di tengahnya -->
                <tr>
                  <td bgcolor="${HERO_SOLID}" background="${heroUrl}" height="191" style="height: 191px; background-color: ${HERO_SOLID}; background-image: ${HERO_GRADIENT}; background-repeat: no-repeat; background-position: center center; background-size: cover; border-bottom: 1px solid ${RULE}; font-size: 0; line-height: 0; padding: 0;">
                    ${
                      heroUrl
                        ? `<img src="${heroUrl}" alt="Ilustrasi reset password" width="155" height="142" style="display: block; width: 155px; height: auto; border: 0; margin: 0 auto;"/>`
                        : "&nbsp;"
                    }
                  </td>
                </tr>

                <!-- ===== Judul ===== -->
                <tr>
                  <td style="padding: 19px 26px 0 26px; font-family: ${FONT}; font-size: 30px; font-weight: bold; color: ${BLUE}; line-height: 38px; letter-spacing: 0.3px;">
                    Reset Password Logbook Magang
                  </td>
                </tr>

                <!-- ===== Isi ===== -->
                <tr>
                  <td style="padding: 12px 25px 0 25px; font-family: ${FONT}; font-size: 14px; color: ${BODY_TEXT}; line-height: 22px; letter-spacing: 0.14px;">
                    <p style="margin: 0 0 12px 0; font-weight: bold;">Yth. <b>${escapeEmailHtml(name)}</b>,</p>
                    <p style="margin: 0 0 12px 0;">
                      Kami menerima permintaan untuk mengatur ulang password akun
                      Logbook Magang Anda. Klik tombol di bawah untuk membuat
                      password baru. Link ini bersifat pribadi dan hanya berlaku
                      selama <b>1 jam</b>. Setelah masa berlaku habis, silakan
                      minta ulang melalui halaman Lupa Password.
                    </p>
                    <p style="margin: 0 0 12px 0;">
                      Mohon <b>TIDAK</b> menyerahkan password Anda ke siapa pun. Jika Anda tidak melakukan permintaan ini, abaikan email ini. Password Anda tidak akan berubah.
                    </p>
                  </td>
                </tr>

                <!-- ===== Tombol CTA (gradient + ikon gembok) ===== -->
                <tr>
                  <td style="padding: 22px 49px 0 49px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="${BUTTON_SOLID}" style="background-color: ${BUTTON_SOLID}; background-image: ${BUTTON_GRADIENT}; border-radius: 10px;">
                          <a href="${resetUrl}" target="_blank" role="button" style="display: block; padding: 15px 24px; font-family: ${FONT}; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 10px; mso-padding-alt: 15px 24px;">
                            ${
                              lockUrl
                                ? `<img src="${lockUrl}" alt="" width="16" height="14" style="display: inline-block; vertical-align: middle; border: 0; margin-right: 8px;"/>`
                                : ""
                            }<span style="display: inline-block; vertical-align: middle;">Reset Password</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Link cadangan: sebagian webmail memblokir <a> yang dibungkus
                     table, jadi link mentah selalu disediakan. -->
                <tr>
                  <td style="padding: 15px 25px 12px 25px; font-family: ${FONT}; font-size: 12px; color: #6b6f8a; line-height: 18px;">
                    Jika tombol tidak berfungsi, salin dan buka link berikut di browser:<br/>
                    <a href="${resetUrl}" target="_blank" style="color: ${BLUE}; word-break: break-all;">${escapeEmailHtml(resetUrl)}</a>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Sisa tinggi kartu di bawah kotak putih (Figma: kotak putih
               berakhir di y=688.78, kartu 711 -> sisa ~22px). -->
          <tr><td height="22" style="height: 22px; font-size: 0; line-height: 0;">&nbsp;</td></tr>

        </table>
        <!-- /Kartu -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}