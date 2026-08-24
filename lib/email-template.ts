// Template dasar email resmi Logbook Magang TJ.
// Table-based + inline style karena email client (Gmail, Outlook) tidak
// mendukung Tailwind/CSS eksternal.

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type EmailShellOptions = {
  heading: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
};

const FONT = "Arial, Helvetica, sans-serif";
const BLUE = "#001192";
const BG = "#edf7fe";

export function buildEmailHtml({
  heading,
  bodyHtml,
  ctaText,
  ctaUrl,
}: EmailShellOptions): string {
  const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/assets/logo-tj.png`;

  const cta =
    ctaText && ctaUrl
      ? `
      <tr>
        <td style="padding: 0 32px 8px 32px;">
          <a href="${ctaUrl}" style="display: inline-block; background: ${BLUE}; color: #ffffff; font-family: ${FONT}; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 36px; border-radius: 10px;">
            ${escapeEmailHtml(ctaText)}
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 32px 32px 32px; font-family: ${FONT}; font-size: 12px; color: #8a8a8a; line-height: 18px;">
          Jika tombol tidak berfungsi, salin dan buka link berikut di browser:<br/>
          <a href="${ctaUrl}" style="color: ${BLUE}; word-break: break-all;">${ctaUrl}</a>
        </td>
      </tr>`
      : `<tr><td style="height: 24px; line-height: 24px; font-size: 0;">&nbsp;</td></tr>`;

  return `<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background-color: ${BG};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${BG}; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e3eefb;">

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px; border-bottom: 3px solid ${BLUE};">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right: 14px; vertical-align: middle;">
                    <img src="${logoUrl}" alt="Logo TJ" width="48" height="48" style="display: block; border-radius: 10px;"/>
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-family: ${FONT}; font-size: 18px; font-weight: bold; color: ${BLUE}; letter-spacing: 0.5px;">LOGBOOK MAGANG</div>
                    <div style="font-family: ${FONT}; font-size: 12px; color: #8a8a8a; letter-spacing: 2px;">TJ</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Heading -->
          <tr>
            <td style="padding: 32px 32px 0 32px; font-family: ${FONT}; font-size: 24px; font-weight: bold; color: #1a1a1a; line-height: 30px;">
              ${escapeEmailHtml(heading)}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 16px 32px 0 32px; font-family: ${FONT}; font-size: 15px; color: #333333; line-height: 24px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr><td style="height: 16px; line-height: 16px; font-size: 0;">&nbsp;</td></tr>
          ${cta}

          <!-- Footer -->
          <tr>
            <td style="padding: 18px 32px; background-color: #f5faff; border-top: 1px solid #e3eefb; font-family: ${FONT}; font-size: 12px; color: #8a8a8a; line-height: 18px;">
              Email ini dikirim otomatis oleh sistem Logbook Magang TJ.
              Mohon tidak membalas email ini. Jika Anda merasa menerima email ini
              karena kesalahan, abaikan saja.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function detailTable(rows: Array<[string, string]>): string {
  const cells = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 8px 12px; font-family: ${FONT}; font-size: 14px; color: #666666; white-space: nowrap; vertical-align: top;">${escapeEmailHtml(label)}</td>
          <td style="padding: 8px 12px; font-family: ${FONT}; font-size: 14px; color: #1a1a1a; font-weight: bold; vertical-align: top;">${escapeEmailHtml(value)}</td>
        </tr>`
    )
    .join("");
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5faff; border: 1px solid #e3eefb; border-radius: 10px; margin-top: 16px;">
      ${cells}
    </table>`;
}
