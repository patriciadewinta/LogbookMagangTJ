// Template email khusus "Reset Password Logbook Magang".
//
// Struktur & warna mengikuti desain Figma (file 1LZyWO11nj22zs2sWT9qki,
// node 254:349 "Card Reset Password"): panel luar #e9ecfc, kartu putih
// rounded 10px, band gradient biru-ungu di header, ilustrasi hero, judul
// biru #001192, dan tombol gradient dengan ikon gembok.
//
// Catatan kompatibilitas email client:
// - Semua layout pakai <table> + inline style (Gmail/Outlook strip <style>).
// - `background-image` + `linear-gradient` tidak didukung Outlook desktop.
//   Karena itu setiap elemen bergradient punya `bgcolor` solid sebagai
//   fallback (pola "bulletproof" yang sama dengan lib/email-template.ts).
// - Outlook tidak paham `border-radius` pada <a>/<td> biasa, jadi tombol
//   dibungkus <table> dengan bgcolor (area klik ikut ter-render).

import { escapeEmailHtml } from "./email-template";

const FONT = "'Inter', Arial, Helvetica, sans-serif";
const BLUE = "#001192";
const PANEL_BG = "#e9ecfc";
const BODY_TEXT = "#1f1f1f";

// Gradient header & tombol disalin apa adanya dari Figma.
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

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reset Password Logbook Magang</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${PANEL_BG}; -webkit-text-size-adjust: 100%;">

  <!-- Panel luar -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${PANEL_BG}; padding: 24px 12px;">
    <tr>
      <td align="center">

        <!-- Kartu putih 570px -->
        <table role="presentation" width="570" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 570px; background-color: #ffffff; border-radius: 10px; overflow: hidden;">

          <!-- ===== Header band (gradient) ===== -->
          <tr>
            <td bgcolor="#eef0fd" background="${heroUrl}" style="background-color: #eef0fd; background-image: ${HEADER_GRADIENT}; border-radius: 10px 10px 0 0; padding: 22px 24px 20px 24px;">

              <!-- Baris logo + nama sistem -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="font-family: ${FONT}; font-size: 14px; font-weight: bold; color: ${BLUE}; letter-spacing: 0.2px;">
                    ${
                      heroUrl
                        ? `<img src="${assetUrl("/assets/logo-tj.png")}" alt="Logo TransJakarta" width="18" height="18" style="display: inline-block; vertical-align: middle; border-radius: 4px; margin-right: 6px;"/>`
                        : ""
                    }Logbook Magang TJ
                  </td>
                </tr>
              </table>

              <!-- Garis pemisah -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 14px;">
                <tr><td style="border-top: 1px solid rgba(0,17,146,0.16); font-size: 0; line-height: 0;">&nbsp;</td></tr>
              </table>

            </td>
          </tr>

          <!-- ===== Ilustrasi hero ===== -->
          <tr>
            <td align="center" style="background-color: #ffffff; padding: 4px 24px 0 24px;">
              ${
                heroUrl
                  ? `<img src="${heroUrl}" alt="Ilustrasi reset password" width="180" style="display: block; width: 180px; max-width: 100%; height: auto; border: 0; outline: none;"/>`
                  : ""
              }
            </td>
          </tr>

          <!-- Garis pemisah bawah hero -->
          <tr>
            <td style="background-color: #ffffff; padding: 4px 24px 0 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top: 1px solid rgba(0,17,146,0.12); font-size: 0; line-height: 0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- ===== Judul ===== -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 24px 0 24px; font-family: ${FONT}; font-size: 30px; font-weight: bold; color: ${BLUE}; line-height: 38px; letter-spacing: 0.3px;">
              Reset Password Logbook Magang
            </td>
          </tr>

          <!-- ===== Isi ===== -->
          <tr>
            <td style="background-color: #ffffff; padding: 16px 24px 0 24px; font-family: ${FONT}; font-size: 14px; color: ${BODY_TEXT}; line-height: 22px; letter-spacing: 0.14px;">
              <p style="margin: 0 0 14px 0;">Yth. <b>${escapeEmailHtml(name)}</b>,</p>
              <p style="margin: 0 0 14px 0;">
                Kami menerima permintaan untuk mengatur ulang password akun
                Logbook Magang Anda. Silakan klik tombol di bawah ini untuk
                membuat password baru.
              </p>
              <p style="margin: 0 0 14px 0;">
                Link ini bersifat pribadi dan hanya berlaku selama
                <b>1 jam</b>. Setelah masa berlaku habis, silakan minta ulang
                melalui halaman Lupa Password.
              </p>
              <p style="margin: 0;">
                Jika Anda tidak melakukan permintaan ini, abaikan email ini —
                password Anda tidak akan berubah.
              </p>
            </td>
          </tr>

          <!-- ===== Tombol CTA (gradient + ikon gembok) ===== -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 24px 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                <tr>
                  <td align="center" bgcolor="#406fe6" style="background-color: #406fe6; background-image: ${BUTTON_GRADIENT}; border-radius: 10px;">
                    <a href="${resetUrl}" target="_blank" role="button" style="display: block; padding: 15px 24px; font-family: ${FONT}; font-size: 14px; font-weight: bold; color: #ffffff; text-decoration: none; border-radius: 10px; mso-padding-alt: 15px 24px;">
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
            <td style="background-color: #ffffff; padding: 14px 24px 28px 24px; font-family: ${FONT}; font-size: 12px; color: #8a8a8a; line-height: 18px;">
              Jika tombol tidak berfungsi, salin dan buka link berikut di browser:<br/>
              <a href="${resetUrl}" target="_blank" style="color: ${BLUE}; word-break: break-all;">${escapeEmailHtml(resetUrl)}</a>
            </td>
          </tr>

        </table>
        <!-- /Kartu -->

      </td>
    </tr>
  </table>

  <!-- Footer di luar kartu -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 0 20px 28px 20px; font-family: ${FONT}; font-size: 12px; color: #7a7f9a; line-height: 18px;">
        Email ini dikirim otomatis oleh sistem Logbook Magang TJ.
        Mohon tidak membalas email ini.
      </td>
    </tr>
  </table>

</body>
</html>`;
}
