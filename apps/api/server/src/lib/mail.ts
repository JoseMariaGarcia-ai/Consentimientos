import { Resend } from 'resend'

export async function sendMagicLink(to: string, token: string, _appUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const appUrl = process.env.APP_URL ?? _appUrl
  const link = `${appUrl}/auth/verify?token=${token}`
  await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to,
    subject: 'Tu enlace de acceso a ConsentsPro',
    html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
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

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Acceso seguro</p>
            <p style="margin:0 0 32px;font-size:15px;color:#64748b;line-height:1.6">
              Haz clic en el botón para acceder de forma segura a tu cuenta.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${link}"
                     style="display:inline-block;padding:14px 36px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px">
                    Entrar en ConsentsPro
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

        <!-- Divider -->
        <tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8">
              Este enlace caduca en 15 minutos · Si no solicitaste este acceso, ignora este email
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
</html>`,
  })
}
