import crypto from 'crypto'
import { query } from './db'

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'Superadministrador',
  clinica: 'Clínica',
  lab_partner: 'Laboratorio colaborador',
}

export async function sendInviteEmail(user: { id: string; email: string; full_name: string; role: string }, clinicName: string | null) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h for first access

  await query(
    'INSERT INTO magic_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, tokenHash, expiresAt]
  )

  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  const link = `${appUrl}/auth/verify?token=${rawToken}`
  const firstName = user.full_name?.split(' ')[0] ?? 'Hola'
  const roleLabel = ROLE_LABEL[user.role] ?? user.role

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr>
          <td style="background:#1a2744;padding:32px 40px;text-align:center">
            <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#f59e0b;text-decoration:underline;text-underline-offset:3px">Pro</span>
            </div>
            <div style="font-size:12px;color:#93afd4;margin-top:6px;letter-spacing:0.3px">
              Plataforma de Consentimientos Informados
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Hola, ${firstName} 👋</p>
            <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6">
              Has sido invitado a ConsentsPro${clinicName ? ` por <strong>${clinicName}</strong>` : ''} con el rol de <strong>${roleLabel}</strong>.
              Pulsa el botón para acceder de forma segura a tu cuenta.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${link}"
                     style="display:inline-block;padding:14px 36px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px">
                    Acceder a ConsentsPro
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6">
              O copia y pega este enlace en tu navegador:<br>
              <span style="color:#2563eb;word-break:break-all;font-size:12px">${link}</span>
            </p>
          </td>
        </tr>

        <tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8">
              Este enlace caduca en 24 horas · Si no esperabas esta invitación, ignora este email
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1">
              ConsentsPro · Conforme a Ley 41/2002 · RGPD · eIDAS
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: user.email,
    subject: 'Te han invitado a ConsentsPro',
    html,
  })
  if (error) console.error(`[inviteEmail] send to ${user.email} failed:`, error)
}
