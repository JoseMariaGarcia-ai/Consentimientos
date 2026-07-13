import { Resend } from 'resend'
import { queryOne } from './db'

export type LowBalanceLevel = '20' | '10' | '5' | '0'

const LEVEL_CONTENT: Record<LowBalanceLevel, { subject: string; tone: string; message: string; color: string }> = {
  '20': {
    subject: 'Saldo IA por debajo del 20%',
    tone: 'Informativo',
    message: 'Te queda menos del 20% de tu saldo IA. Recarga para evitar interrupciones.',
    color: '#2563eb',
  },
  '10': {
    subject: 'Saldo IA por debajo del 10%',
    tone: 'Urgente',
    message: 'Tu saldo IA está por debajo del 10%. Recarga pronto para evitar que los agentes se detengan.',
    color: '#d97706',
  },
  '5': {
    subject: 'AVISO CRÍTICO — Saldo IA a punto de agotarse',
    tone: 'Crítico',
    message: 'AVISO CRÍTICO: Tu saldo IA está a punto de agotarse. Si no recargas, los agentes de voz y WhatsApp dejarán de funcionar en cuanto el saldo llegue a 0€.',
    color: '#dc2626',
  },
  '0': {
    subject: 'Saldo IA agotado — Agentes pausados',
    tone: 'Crítico',
    message: 'Saldo agotado. Los agentes de voz y WhatsApp están pausados hasta que recargues.',
    color: '#dc2626',
  },
}

function fmtEuros(cents: bigint | number): string {
  return (Number(cents) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

function emailHtml(level: LowBalanceLevel, balanceCents: bigint, appUrl: string): string {
  const c = LEVEL_CONTENT[level]
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr><td style="background:#1a2744;padding:32px 40px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">Consents<span style="color:#f59e0b;text-decoration:underline;text-underline-offset:3px">Pro</span></div>
          <div style="font-size:12px;color:#93afd4;margin-top:6px;letter-spacing:0.3px">Bono IA</div>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:${c.color};text-transform:uppercase;letter-spacing:0.5px">${c.tone}</p>
          <p style="margin:0 0 24px;font-size:16px;color:#0f172a;line-height:1.6">${c.message}</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:28px">
            <tr><td style="font-size:13px;color:#64748b">Saldo actual</td><td align="right" style="font-size:18px;font-weight:700;color:${c.color}">${fmtEuros(balanceCents)}</td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
            <a href="${appUrl}/ai-credits" style="display:inline-block;padding:14px 36px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px">Recargar saldo</a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>
        <tr><td style="padding:24px 40px;text-align:center">
          <p style="margin:0;font-size:11px;color:#cbd5e1">ConsentsPro · Bono IA</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

// Se llama best-effort desde creditService tras marcar el umbral como
// notificado — un fallo de envío de email nunca debe revertir ni afectar
// al cobro de saldo que ya se completó.
export async function notifyLowBalance(clinicId: string, level: LowBalanceLevel, balanceCents: bigint) {
  const clinic = await queryOne<{ email: string | null; name: string; phone: string | null }>(
    'SELECT email, name, phone FROM clinics WHERE id = $1', [clinicId]
  )
  if (!clinic?.email) return
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
  const resend = new Resend(process.env.RESEND_API_KEY)
  const c = LEVEL_CONTENT[level]
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: clinic.email,
    subject: `${c.subject} — ConsentsPro`,
    html: emailHtml(level, balanceCents, appUrl),
  })
  if (error) console.error(`[creditNotificationEmail] fallo enviando email a ${clinic.email}:`, error)

  // Al 5% (crítico), se intenta también WhatsApp/SMS si la clínica tiene
  // YCloud configurado — "si disponible", según el documento de requisitos.
  if (level === '5' && clinic.phone) {
    await notifyViaWhatsApp(clinicId, clinic.phone, c.message).catch(err =>
      console.error(`[creditNotificationEmail] fallo enviando WhatsApp crítico a clínica ${clinicId}:`, err.message)
    )
  }
}

async function notifyViaWhatsApp(clinicId: string, phone: string, message: string) {
  const config = await queryOne<{ ycloud_api_key: string | null }>(
    'SELECT ycloud_api_key FROM clinic_api_config WHERE clinic_id = $1', [clinicId]
  )
  if (!config?.ycloud_api_key) return
  await fetch('https://api.ycloud.com/v2/whatsapp/messages', {
    method: 'POST',
    headers: { 'X-API-Key': config.ycloud_api_key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.YCLOUD_WA_NUMBER ?? undefined,
      to: phone,
      type: 'text',
      text: { body: message },
    }),
  })
}
