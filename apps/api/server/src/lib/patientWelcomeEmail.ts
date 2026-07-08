import crypto from 'crypto'
import { query, queryOne } from './db'
import { signToken } from './jwt'

export async function sendPatientWelcomeEmail(patient: any, clinicName: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  // Generate magic link token
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h for first access

  await query(
    'INSERT INTO magic_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [patient.user_id, tokenHash, expiresAt]
  )

  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  const link = `${appUrl}/auth/verify?token=${rawToken}`
  const firstName = patient.first_name ?? patient.full_name?.split(' ')[0] ?? 'Paciente'

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Golden top bar -->
        <tr><td style="background:#C9A84C;height:5px;font-size:0">&nbsp;</td></tr>

        <!-- Header navy -->
        <tr>
          <td style="background:#0D1B2E;padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#C9A84C">Pro</span>
            </div>
            <div style="font-size:12px;color:#93afd4;margin-top:6px;letter-spacing:0.5px">
              Consentimientos Digitales · Tu Portal de Salud
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0D1B2E">Hola, ${firstName} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
              La clínica <strong>${clinicName}</strong> ha activado tu acceso personal a
              <strong>ConsentsPro</strong>, tu portal de salud digital seguro.
            </p>

            <!-- Info box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
              <tr>
                <td style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:20px 24px">
                  <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0369A1;text-transform:uppercase;letter-spacing:0.5px">¿Qué es ConsentsPro?</p>
                  <p style="margin:0 0 6px;font-size:14px;color:#334155">ConsentsPro es la plataforma donde puedes consultar en cualquier momento:</p>
                  <p style="margin:4px 0;font-size:14px;color:#334155">✔ Tus consentimientos informados firmados</p>
                  <p style="margin:4px 0;font-size:14px;color:#334155">✔ Tu historia clínica</p>
                  <p style="margin:4px 0;font-size:14px;color:#334155">✔ Tus fotos de tratamiento</p>
                </td>
              </tr>
            </table>

            <!-- How to access box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px">
              <tr>
                <td style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:20px 24px">
                  <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#C2410C;text-transform:uppercase;letter-spacing:0.5px">¿Cómo acceder?</p>
                  <p style="margin:4px 0;font-size:14px;color:#334155">1. Pulsa el botón de abajo</p>
                  <p style="margin:4px 0;font-size:14px;color:#334155">2. El enlace te llevará directamente a tu portal personal</p>
                  <p style="margin:4px 0;font-size:14px;color:#334155">3. En próximos accesos puedes usar huella o Face ID en tu dispositivo</p>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
              <tr>
                <td align="center">
                  <a href="${link}"
                     style="display:inline-block;padding:16px 48px;background:#C9A84C;color:#0D1B2E;font-size:16px;font-weight:800;text-decoration:none;border-radius:10px;letter-spacing:0.3px">
                    ACCEDER A MI PORTAL
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6">
              ⏱ Este enlace es válido durante 24 horas<br>
              ⚠️ Si no solicitaste este acceso, ignora este email.
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:0 40px"><div style="height:1px;background:#E2E8F0"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#334155">${clinicName}</p>
            <p style="margin:0 0 4px;font-size:12px;color:#94a3b8">Powered by ConsentsPro</p>
            <p style="margin:0;font-size:11px;color:#cbd5e1">Conforme a Ley 41/2002 · RGPD · eIDAS</p>
          </td>
        </tr>

        <!-- Golden bottom bar -->
        <tr><td style="background:#C9A84C;height:5px;font-size:0">&nbsp;</td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: patient.email,
    subject: `Tu acceso a ConsentsPro — ${clinicName}`,
    html,
  })
  if (error) console.error(`[patientWelcomeEmail] send to ${patient.email} failed:`, error)
}
