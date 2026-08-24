import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import type { Browser } from "puppeteer-core";

export type LogbookEntry = { tanggal: string; kegiatan: string };

export interface GenerateLogbookPdfInput {
  profile: {
    fullName: string | null;
    university: string | null;
    posisi: string | null;
    nim: string | null;
  };
  entries: LogbookEntry[];
  periodYear: number;
  periodMonth: number;
  pembimbing: string | null;
  kadep: string | null;
  kadiv: string | null;
  // Untuk placeholder jabatan: "(Ketua Departemen {departemen})" dan
  // "(Kepala Divisi {divisi})" — diambil dari kolom divisi tabel approver.
  kadepDepartemen: string | null;
  kadivDivisi: string | null;
  // URL halaman verifikasi untuk QR tanda tangan digital (opsional;
  // tanpa ini QR tidak dicetak).
  verificationUrl?: string;
  // Tahap yang SUDAH ditandatangani — QR hanya muncul di slot tahap yang
  // sudah acc. QR anak magang (kolom "Dibuat oleh") selalu ada selama
  // verificationUrl terisi karena dibuat saat pengajuan.
  signed?: {
    pembimbing: boolean;
    kadep: boolean;
    kadiv: boolean;
  };
}

const hariFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long" });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
const tglFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const bulanFmt = new Intl.DateTimeFormat("id-ID", { month: "long" });

// Browser singleton — hindari cold-start Chrome tiap generate.
// Di Vercel (serverless) pakai @sparticuz/chromium; di dev lokal pakai
// Chrome/Edge yang terinstall di mesin.
let browserPromise: Promise<Browser> | null = null;

function findLocalChrome(): string | null {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter((p): p is string => !!p);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = (async () => {
      const puppeteer = await import("puppeteer-core");
      if (process.env.VERCEL) {
        const chromium = (await import("@sparticuz/chromium")).default;
        return puppeteer.default.launch({
          headless: true,
          args: [...chromium.args, "--no-sandbox"],
          executablePath: await chromium.executablePath(),
        });
      }
      const executablePath = findLocalChrome();
      if (!executablePath) {
        throw new Error(
          "Chrome/Edge tidak ditemukan. Set env CHROME_PATH dengan path browser Chromium."
        );
      }
      return puppeteer.default.launch({
        headless: true,
        executablePath,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
    })();
    const cleanup = () => {
      browserPromise = null;
    };
    browserPromise.then((b) => b.once("disconnected", cleanup), cleanup);
  }
  return browserPromise;
}

export async function generateLogbookPdf(
  input: GenerateLogbookPdfInput
): Promise<Buffer> {
  const templatePath = path.join(process.cwd(), "templates", "logbook-template.html");
  const $ = cheerio.load(fs.readFileSync(templatePath, "utf8"));

  // Identitas
  $('[data-field="nama"]').text(input.profile.fullName || "-");
  $('[data-field="nim"]').text(input.profile.nim || "-");
  $('[data-field="divisi"]').text(input.profile.posisi || "-");
  $('[data-field="universitas"]').text(input.profile.university || "-");

  const bulan = bulanFmt.format(new Date(input.periodYear, input.periodMonth - 1, 1));
  const lastDay = new Date(input.periodYear, input.periodMonth, 0).getDate();
  $('[data-field="periode"]').text(
    `1 ${bulan} s/d ${lastDay} ${bulan} ${input.periodYear}`
  );

  // Baris kegiatan: clone row template per entry
  const templateRow = $("tr[data-row='kegiatan']");
  const tbody = templateRow.parent();
  templateRow.removeAttr("data-row");

  const sorted = [...input.entries].sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  // Satu QR untuk semua titik tanda tangan digital (paraf merged + TTD bawah).
  let qrDataUrl = "";
  if (input.verificationUrl) {
    const QRCode = (await import("qrcode")).default;
    qrDataUrl = await QRCode.toDataURL(input.verificationUrl, { margin: 1, width: 320 });
  }

  // Kolom PARAF (pembimbing) = satu cell merged: rowspan sejumlah kegiatan,
  // berisi satu QR tanda tangan pembimbing + nama & jabatan di bawahnya.
  // QR paraf hanya dicetak setelah pembimbing menandatangani (acc).
  const parafSigned = input.signed?.pembimbing ?? false;
  const parafCell = (rowspan: number, src: string) =>
    src
      ? `<td class="col-paraf" rowspan="${rowspan}"><img src="${src}" alt="Paraf QR" style="width: 80px; height: 80px; display: block; margin: 0 auto;"><div style="font-size: 6pt; margin-top: 4pt;">${escapeHtml(input.pembimbing || "-")}</div><div style="font-size: 6pt;">(Pembimbing Magang)</div></td>`
      : `<td class="col-paraf" rowspan="${rowspan}"></td>`;

  sorted.forEach((entry, i) => {
    const d = new Date(`${entry.tanggal}T00:00:00`);
    const row = templateRow.clone();
    row.find("td.col-no").text(String(i + 1));
    row.find("td.col-hari").text(hariFmt.format(d));
    row.find("td.col-tgl").text(tglFmt.format(d));
    row.find("td.col-keg").text(entry.kegiatan);
    if (i === 0) row.append(parafCell(sorted.length, parafSigned ? qrDataUrl : ""));
    tbody.append(row);
  });
  templateRow.remove();

  // Area tanda tangan (template HR):
  // Kolom 1 "Dibuat oleh" = peserta magang, kolom 2 & 3 "Diketahui oleh"
  // = kadep & kadiv.
  $('[data-field="tanggal-ttd"]').text(tglFmt.format(new Date()));
  $('[data-field="nama-pembimbing-text"]').text(input.profile.fullName || "-");
  $('[data-field="nama-kadep-text"]').text(input.kadep || "-");
  $('[data-field="nama-kadiv-text"]').text(input.kadiv || "-");
  $('[data-field="nama-kadep-jabatan"]').each((_i, el) => {
    $(el).text($(el).text().replace("{departemen}", input.kadepDepartemen || "—"));
  });
  $('[data-field="nama-kadiv-jabatan"]').each((_i, el) => {
    $(el).text($(el).text().replace("{divisi}", input.kadivDivisi || "—"));
  });

  // QR tanda tangan digital: scan → halaman verifikasi logbook (dibuat oleh /
  // disetujui oleh siapa, tanggal & jam — live dari database).
  // QR anak magang (qr-pembimbing) selalu ada; QR kadep/kadiv baru muncul
  // setelah tahap masing-masing ditandatangani.
  if (qrDataUrl) {
    $('[data-field="qr-pembimbing"]').attr("src", qrDataUrl);
    if (input.signed?.kadep) $('[data-field="qr-kadep"]').attr("src", qrDataUrl);
    if (input.signed?.kadiv) $('[data-field="qr-kadiv"]').attr("src", qrDataUrl);
  }
  // QR yang tidak terisi (fallback) dibuang supaya tidak render ikon broken.
  $('img[src=""]').remove();

  // Logo di-inline base64 dari folder templates (ikut ke-bundle serverless,
  // beda dengan public/ yang cuma disajikan statis).
  const logoPath = path.join(process.cwd(), "templates", "logo-tj.png");
  if (fs.existsSync(logoPath)) {
    const b64 = fs.readFileSync(logoPath).toString("base64");
    $('img[src="../public/assets/logo-tj.png"]').attr(
      "src",
      `data:image/png;base64,${b64}`
    );
  } else {
    $('img[src="../public/assets/logo-tj.png"]').remove();
  }

  const html = $.html();

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // Template tanpa resource eksternal (logo sudah di-inline base64),
    // jadi "load" cukup — "networkidle0" sudah tidak ada di API terbaru.
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
