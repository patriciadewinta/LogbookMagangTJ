import { Resend } from 'resend';
import { buildEmailHtml, escapeEmailHtml } from './email-template';

const resend = new Resend(process.env.RESEND_API_KEY);

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
  const setPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL}/set-password?token=${token}`;

  const bodyHtml = `
    <p>Yth. <b>${escapeEmailHtml(name)}</b>,</p>
    <p>Anda telah terdaftar sebagai peserta magang di unit kerja kami. Untuk
    melanjutkan proses magang, Anda wajib membuat akun dengan menetapkan
    password melalui tombol di bawah ini.</p>
    <p>Link ini bersifat pribadi dan berlaku selama <b>7 hari</b>. Setelah masa
    berlaku habis, silakan hubungi petugas OD untuk mendapatkan link baru.</p>
  `;

  const html = buildEmailHtml({
    heading: 'Pembuatan Akun Logbook Magang',
    bodyHtml,
    ctaText: 'Set Password',
    ctaUrl: setPasswordUrl,
  });

  try {
    const data = await resend.emails.send({
      from: 'Logbook Magang <onboarding@resend.dev>', // Pakai default domain Resend (gratis)
      to: email,
      subject: 'Pembuatan Akun Logbook Magang TransJakarta',
      html,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
