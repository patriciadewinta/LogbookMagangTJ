import { pdfToPng } from "pdf-to-png-converter";
import { createWorker } from "tesseract.js";
import type { Worker } from "tesseract.js";

// Logbook kehadiran berbentuk tabel TANGGAL | KEGIATAN | PARAF.
// Detect baris yang ada tanggal (day + month + year pattern).
// Handle OCR errors: letter-number confusion, spacing issues.
let workerPromise: Promise<Worker> | null = null;

function getWorker() {
  if (!workerPromise) workerPromise = createWorker("ind");
  return workerPromise;
}

export async function ocrAttendanceCount(
  file: File | Uint8Array,
  filename: string
): Promise<number | null> {
  try {
    if (!filename.toLowerCase().endsWith(".pdf")) return null;
    const bytes =
      file instanceof Uint8Array ? file : new Uint8Array(await file.arrayBuffer());

    const pages = await pdfToPng(bytes, { viewportScale: 2.0 });
    if (!pages.length) return null;

    const worker = await getWorker();
    const seenDates = new Set<string>();

    for (const page of pages) {
      if (!page.content) continue;
      const { data } = await worker.recognize(page.content);

      // Pattern 1: "3 agustus 2026", "26 Agustus 2026"
      const datePattern1 = /\b(\d{1,2})\s+[A-Za-z]+[A-Za-z\s]*(\d{2,4})\b/g;
      // Pattern 2: "3/8/2026", "26-08-2026"
      const datePattern2 = /\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/g;

      for (const match of data.text.matchAll(datePattern1)) {
        const day = match[1].padStart(2, '0');
        const year = match[2];
        seenDates.add(`${day}-${year}`);
      }

      for (const match of data.text.matchAll(datePattern2)) {
        const day = match[1].padStart(2, '0');
        const year = match[3];
        seenDates.add(`${day}-${year}`);
      }
    }

    return seenDates.size > 0 ? seenDates.size : null;
  } catch {
    // OCR gagal (file korup / lib tidak jalan) — jangan memblokir submit.
    return null;
  }
}
