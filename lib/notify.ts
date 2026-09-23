import { sendMail } from "./email";
import { env } from "./env";
import { escapeEmailHtml } from "./email-template";
import { buildSignatureRequestEmailHtml } from "./email-signature-request";

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
  ctaUrl?: string;
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
  ctaUrl?: string;
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
    ctaUrl: input.ctaUrl,
  };
}

const TAHAP_LABEL: Record<string, string> = {
  pembimbing: "Pembimbing",
  kadep: "Kepala Departemen",
  kadiv: "Kepala Divisi",
};

function buildLogbookEmail(payload: LogbookNotificationPayload): {
  subject: string;
  html: string;
} {
  const label = TAHAP_LABEL[payload.tahap] ?? payload.tahap;
  const subject = `Permohonan penandatanganan logbook magang — tahap ${label}`;

  // Desain card punya template sendiri (Figma node 256:284), tidak pakai
  // shell buildEmailHtml yang dipakai email notifikasi lain.
  const html = buildSignatureRequestEmailHtml({
    namaTujuan: payload.namaTujuan,
    namaPengaju: payload.namaPengaju,
    universitas: payload.universitas,
    peranTujuan: label,
    ctaUrl: payload.ctaUrl,
  });
  return { subject, html };
}

export async function sendLogbookEmail(
  payload: LogbookNotificationPayload
): Promise<boolean> {
  const { subject, html } = buildLogbookEmail(payload);
  const res = await sendMail({
    to: payload.emailTujuan,
    subject,
    html,
  });
  return res.success;
}

export async function notifyPowerAutomate(
  payload: Record<string, unknown>
): Promise<boolean> {
  // URL webhook juga rawan kena BOM saat di-paste dari Power Automate.
  const url = env("POWER_AUTOMATE_WEBHOOK_URL");
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
