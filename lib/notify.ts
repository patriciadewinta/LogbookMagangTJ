import { Resend } from "resend";

export type LogbookNotificationPayload = {
  tahap: string;
  emailTujuan: string;
  namaTujuan: string;
  emailPengaju: string;
  namaPengaju: string;
  universitas: string;
  posisi: string;
  domisili: string;
  namaFile: string;
  filePath: string;
  tanggal: string;
  pesan: string;
};

export function composeLogbookMessage(input: {
  tahap: string;
  namaTujuan: string;
  namaPengaju: string;
  universitas?: string;
  namaPembimbing?: string;
  namaKadep?: string;
}): string {
  const univ = input.universitas ? ` dari ${input.universitas}` : "";
  const namaPenerima = input.namaTujuan.replace(/\.\s*$/, "");
  const awalan = `Bapak/Ibu ${namaPenerima},`;
  const inti = `saya ${input.namaPengaju}, peserta magang${univ}.`;
  const tutup = " Terima kasih.";

  if (input.tahap === "kadep") {
    return `${awalan} ${inti} Logbook saya telah ditandatangani oleh ${input.namaPembimbing ?? "pembimbing"} pada tahap pembimbing. Untuk kelengkapan laporan magang, saya mohon Bapak/Ibu berkenan menandatangani logbook saya.${tutup}`;
  }
  if (input.tahap === "kadiv") {
    return `${awalan} ${inti} Logbook saya telah ditandatangani oleh ${input.namaPembimbing ?? "pembimbing"} pada tahap pembimbing dan ${input.namaKadep ?? "kepala departemen"} pada tahap kepala departemen. Untuk kelengkapan laporan magang, saya mohon Bapak/Ibu berkenan menandatangani logbook saya.${tutup}`;
  }
  return `${awalan} ${inti} Saya mohon Bapak/Ibu berkenan menandatangani logbook saya sebagai pemenuhan laporan magang.${tutup}`;
}

// Format YYYY-MM-DD sesuai tanggal lokal (toISOString bisa geser sehari
// untuk zona WIB karena konversi ke UTC).
function toISODateLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function buildLogbookNotification(input: {
  tahap: string;
  emailTujuan: string;
  namaTujuan: string;
  emailPengaju: string;
  namaPengaju: string;
  namaPembimbing?: string;
  namaKadep?: string;
  universitas?: string;
  posisi?: string;
  domisili?: string;
  namaFile: string;
  filePath: string;
  tanggal?: Date | string;
  pesan?: string;
}): LogbookNotificationPayload {
  const tanggal = input.tanggal ? new Date(input.tanggal) : new Date();
  return {
    tahap: input.tahap,
    emailTujuan: input.emailTujuan,
    namaTujuan: input.namaTujuan,
    emailPengaju: input.emailPengaju,
    namaPengaju: input.namaPengaju,
    universitas: input.universitas ?? "",
    posisi: input.posisi ?? "",
    domisili: input.domisili ?? "",
    namaFile: input.namaFile,
    filePath: input.filePath,
    tanggal: toISODateLocal(tanggal),
    pesan:
      input.pesan ??
      composeLogbookMessage({
        tahap: input.tahap,
        namaTujuan: input.namaTujuan,
        namaPengaju: input.namaPengaju,
        universitas: input.universitas,
        namaPembimbing: input.namaPembimbing,
        namaKadep: input.namaKadep,
      }),
  };
}

const TAHAP_LABEL: Record<string, string> = {
  pembimbing: "Pembimbing",
  kadep: "Kepala Departemen",
  kadiv: "Kepala Divisi",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLogbookEmail(payload: LogbookNotificationPayload): {
  subject: string;
  html: string;
} {
  const e = escapeHtml;
  const label = TAHAP_LABEL[payload.tahap] ?? payload.tahap;
  const subject = `Permohonan penandatanganan logbook magang — tahap ${label}`;
  const html = [
    `<p>${e(payload.pesan)}</p>`,
    "<table>",
    `<tr><td><b>Nama</b></td><td>${e(payload.namaPengaju)}</td></tr>`,
    `<tr><td><b>Universitas</b></td><td>${e(payload.universitas)}</td></tr>`,
    `<tr><td><b>Posisi</b></td><td>${e(payload.posisi)}</td></tr>`,
    `<tr><td><b>Domisili</b></td><td>${e(payload.domisili)}</td></tr>`,
    `<tr><td><b>File</b></td><td>${e(payload.namaFile)}</td></tr>`,
    `<tr><td><b>Tanggal</b></td><td>${e(payload.tanggal)}</td></tr>`,
    "</table>",
    '<p style="color:#888;font-size:12px">Dikirim otomatis oleh aplikasi Logbook Magang.</p>',
  ].join("");
  return { subject, html };
}

export async function sendLogbookEmail(
  payload: LogbookNotificationPayload
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error(
      "RESEND_API_KEY belum di-set di .env.local. Cek panduan setup Resend."
    );
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    const { subject, html } = buildLogbookEmail(payload);
    const res = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "Logbook Magang <onboarding@resend.dev>",
      to: payload.emailTujuan,
      subject,
      html,
    });
    if (res.error) {
      console.error("Resend menolak kirim email:", res.error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Gagal kirim email logbook:", err);
    return false;
  }
}

export async function notifyPowerAutomate(
  payload: Record<string, unknown>
): Promise<boolean> {
  const url = process.env.POWER_AUTOMATE_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error("Power Automate webhook gagal:", err);
    return false;
  }
}
