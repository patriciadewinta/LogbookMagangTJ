import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

const APPROVED = ["pembimbing_approved", "kadep_approved", "kadiv_approved"];

type SignInput = {
  id: string;
  userId: string;
  logbookFilePath: string;
  status: string;
  pembimbingName: string | null;
  kadepName: string | null;
  kadivName: string | null;
  signedFilePath: string | null;
};

const dateStr = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

// Buat salinan logbook bertanda tangan (e-sign). Idempotent: kembalikan path
// yang sudah ada bila sudah digenerate. Dipanggil lazily dari halaman yang
// menampilkan submission (status approval diupdate dari luar, mis. Power Automate).
export async function generateSignedPdf(submission: SignInput): Promise<string | null> {
  try {
    if (!APPROVED.includes(submission.status)) return null;
    if (submission.signedFilePath) return submission.signedFilePath;
    if (!submission.logbookFilePath.toLowerCase().endsWith(".pdf")) return null;

    const admin = createAdminClient();
    const { data: original, error: dlErr } = await admin.storage
      .from("logbooks")
      .download(submission.logbookFilePath);
    if (dlErr || !original) return null;

    const pdf = await PDFDocument.load(await original.arrayBuffer());
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const ink = rgb(0.1, 0.12, 0.2);
    const muted = rgb(0.45, 0.45, 0.5);

    const signatories: { role: string; name: string }[] = [];
    if (APPROVED.includes(submission.status) && submission.pembimbingName) {
      signatories.push({ role: "Pembimbing", name: submission.pembimbingName });
    }
    if (submission.status !== "pembimbing_approved" && submission.kadepName) {
      signatories.push({ role: "Kepala Departemen", name: submission.kadepName });
    }
    if (submission.status === "kadiv_approved" && submission.kadivName) {
      signatories.push({ role: "Kepala Divisi", name: submission.kadivName });
    }
    if (signatories.length === 0) return null;

    const page = pdf.addPage([595.28, 841.89]); // A4
    page.drawText("HALAMAN PERSETUJUAN", { x: 60, y: 780, size: 16, font: bold, color: ink });
    page.drawText("Logbook ini telah diperiksa dan disetujui oleh:", {
      x: 60,
      y: 756,
      size: 11,
      font,
      color: muted,
    });

    let y = 690;
    for (const s of signatories) {
      page.drawText(`${s.role}:`, { x: 60, y, size: 11, font, color: muted });
      page.drawText(s.name, { x: 60, y: y - 20, size: 14, font: bold, color: ink });
      page.drawText(`Disetujui ${dateStr(new Date())}`, {
        x: 60,
        y: y - 38,
        size: 10,
        font,
        color: muted,
      });
      page.drawLine({
        start: { x: 60, y: y - 52 },
        end: { x: 300, y: y - 52 },
        thickness: 0.5,
        color: muted,
      });
      y -= 86;
    }

    const signedBytes = await pdf.save();
    const signedPath = `${submission.userId}/${submission.id}-signed.pdf`;
    const { error: upErr } = await admin.storage
      .from("logbooks")
      .upload(signedPath, signedBytes, { contentType: "application/pdf", upsert: true });
    if (upErr) return null;

    await prisma.logbookSubmission.update({
      where: { id: submission.id },
      data: { signedFilePath: signedPath },
    });
    return signedPath;
  } catch {
    return null;
  }
}
