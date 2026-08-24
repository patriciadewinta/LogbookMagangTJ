import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import type { Browser } from "puppeteer";

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
}

const hariFmt = new Intl.DateTimeFormat("id-ID", { weekday: "long" });
const tglFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const bulanFmt = new Intl.DateTimeFormat("id-ID", { month: "long" });

// Browser singleton — hindari cold-start Chrome tiap generate.
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = import("puppeteer").then((p) =>
      p.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      })
    );
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
  sorted.forEach((entry, i) => {
    const d = new Date(`${entry.tanggal}T00:00:00`);
    const row = templateRow.clone();
    row.find("td.col-no").text(String(i + 1));
    row.find("td.col-hari").text(hariFmt.format(d));
    row.find("td.col-tgl").text(tglFmt.format(d));
    row.find("td.col-keg").text(entry.kegiatan);
    tbody.append(row);
  });
  templateRow.remove();

  // Area tanda tangan
  $('[data-field="tanggal-ttd"]').text(tglFmt.format(new Date()));
  $('[data-field="nama-pembimbing-text"]').text(input.pembimbing || "-");
  $('[data-field="nama-kadep-text"]').text(input.kadep || "-");
  $('[data-field="nama-kadiv-text"]').text(input.kadiv || "-");

  // QR placeholder (src kosong) dibuang; logo di-inline base64
  // supaya tidak bergantung pada akses file:// Chrome.
  $("img[src='']").remove();
  const logoPath = path.join(process.cwd(), "public", "assets", "logo-tj.png");
  if (fs.existsSync(logoPath)) {
    const b64 = fs.readFileSync(logoPath).toString("base64");
    $('img[src="../public/assets/logo-tj.png"]').attr("src", `data:image/png;base64,${b64}`);
  }

  const html = $.html();

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}
