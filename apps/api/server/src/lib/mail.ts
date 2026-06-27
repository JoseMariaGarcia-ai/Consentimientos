import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendMagicLink(to: string, token: string, appUrl: string) {
  const link = `${appUrl}/auth/verify?token=${token}`
  await transporter.sendMail({
    from: `"ConsentsPro" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
    to,
    subject: 'Tu enlace de acceso a ConsentsPro',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#2563eb">ConsentsPro</h2>
        <p>Haz clic en el enlace para acceder. Caduca en 15 minutos.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Entrar en ConsentsPro
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:24px">
          Si no solicitaste este enlace, ignora este email.
        </p>
      </div>
    `,
  })
}
