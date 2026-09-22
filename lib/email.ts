import nodemailer from "nodemailer";
import { buildEmailHtml, escapeEmailHtml } from "./email-template";

// Kirim email via Gmail SMTP pakai App Password (bukan password akun biasa).
// Buat App Password di: myaccount.google.com/apppasswords (butuh 2FA aktif).
// Env: GMAIL_USER = alamat gmail, GMAIL_APP_PASSWORD = 16 huruf app password.
// Sanitasi BOM/spasi — nilai env yang ke-copy-paste bisa bawa karakter tak
// terlihat yang bikin auth SMTP gagal.
function getTransporter() {
  const user = process.env.GMAIL_USER?.replace(/^﻿/, "").trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/^﻿/, "").replace(/\s+/g, "");
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

  const bodyHtml = `
    <p>Yth. <b>${escapeEmailHtml(name)}</b>,</p>
    <p>Kami menerima permintaan untuk mengatur ulang password akun Logbook Magang Anda.
    Jika Anda tidak melakukan permintaan ini, abaikan email ini.</p>
    <p>Klik tombol di bawah untuk membuat password baru. Link ini bersifat pribadi
    dan berlaku selama <b>1 jam</b>. Setelah masa berlaku habis, silakan minta ulang.</p>
  `;

  const html = buildEmailHtml({
    heading: "Reset Password Logbook Magang",
    bodyHtml,
    ctaText: "Reset Password",
    ctaUrl: resetUrl,
  });

  return sendMail({
    to: email,
    subject: "Reset Password Logbook Magang TransJakarta",
    html,
  });
}
