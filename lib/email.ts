import { Resend } from 'resend';

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

  try {
    const data = await resend.emails.send({
      from: 'Logbook Magang <onboarding@resend.dev>', // Pakai default domain Resend (gratis)
      to: email,
      subject: 'Set Password untuk Logbook Magang',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #001192;">Halo, ${name}!</h2>
          <p>Anda telah ditambahkan ke program magang.</p>
          <p>Silakan set password dengan klik tombol di bawah:</p>
          <br/>
          <a href="${setPasswordUrl}" style="background: #001192; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Password</a>
          <br/>
          <p>Atau buka link ini: <a href="${setPasswordUrl}">${setPasswordUrl}</a></p>
          <p>Link berlaku 7 hari.</p>
          <br/>
          <p>Terima kasih!</p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
