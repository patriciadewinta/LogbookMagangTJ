import nodemailer from "nodemailer";
import { buildEmailHtml, escapeEmailHtml } from "./email-template";
import { buildResetPasswordEmailHtml } from "./email-reset-password";
import { env } from "./env";

// Kirim email via Gmail SMTP pakai App Password (bukan password akun biasa).
// Buat App Password di: myaccount.google.com/apppasswords (butuh 2FA aktif).
// Env: GMAIL_USER = alamat gmail, GMAIL_APP_PASSWORD = 16 huruf app password.
// Sanitasi BOM/karakter tak terlihat ditangani lib/env.ts — dulu di-patch
// inline di sini, sekarang terpusat supaya variabel lain ikut aman.
function getTransporter() {
  const user = env("GMAIL_USER");
  const pass = env("GMAIL_APP_PASSWORD", { stripAllWhitespace: true });
  if (!user || !pass) {
    console.error("GMAIL_USER / GMAIL_APP_PASSWORD belum di-set di env.");
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: unknown }> {
  const transporter = getTransporter();
  if (!transporter) return { success: false, error: "missing gmail env" };
  try {
    const from =
      process.env.EMAIL_FROM ??
      `Logbook Magang <${process.env.GMAIL_USER}>`;
    await transporter.sendMail({ from, ...options });
    return { success: true };
  } catch (error) {
    console.error("Gagal kirim email:", error);
    return { success: false, error };
  }
}

export interface SendPasswordSetEmailParams {
  email: string;
  name: string;
  token: string;
}

export async function sendPasswordSetEmail({
  email,
  name,
  token,
}: SendPasswordSetEmailParams) {
  const setPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login/set-password?token=${token}`;

  const bodyHtml = `
    <p>Yth. <b>${escapeEmailHtml(name)}</b>,</p>
    <p>Anda terdaftar sebagai peserta magang di PT Transportasi Jakarta.
    Akun Logbook Magang Anda sudah dibuat oleh petugas OD. Silakan
    <b>buat password</b> untuk akun tersebut melalui tombol di bawah ini —
    tanpa password, Anda belum bisa login.</p>
    <p>Tombol di atas mengarah ke halaman <b>Pembuatan Password</b>
    (bukan transaksi apa pun). Link berlaku <b>7 hari</b> dan hanya bisa
    dipakai satu kali. Kalau sudah kedaluwarsa, minta link baru ke petugas OD.</p>
    <p style="color: #8a8a8a; font-size: 13px;">Email ini dikirim otomatis dari
    sistem Logbook Magang. Kalau Anda merasa tidak pernah mendaftar magang di
    PT Transportasi Jakarta, abaikan saja email ini.</p>
  `;

  const html = buildEmailHtml({
    heading: "Pembuatan Password Akun Logbook Magang",
    bodyHtml,
    ctaText: "Buat Password Sekarang",
    ctaUrl: setPasswordUrl,
  });

  return sendMail({
    to: email,
    subject: `Buat password akun Logbook Magang Anda, ${name}`,
    html,
  });
}

export interface SendPasswordResetEmailParams {
  email: string;
  name: string;
  token: string;
}

export async function sendPasswordResetEmail({
  email,
  name,
  token,
}: SendPasswordResetEmailParams) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login/reset-password?token=${token}`;

  // Email reset punya desain sendiri (Figma node 254:349), tidak pakai
  // shell buildEmailHtml yang dipakai email notifikasi logbook.
  const html = buildResetPasswordEmailHtml({ name, resetUrl });

  return sendMail({
    to: email,
    subject: "Reset Password Logbook Magang TransJakarta",
    html,
  });
}
