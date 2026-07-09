import { queryOne } from './db'
import { PLAN_NAMES, priceFor } from './plans'
import { getOrCreateActionToken } from './billingActionTokens'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'
// Los enlaces de acción (cancelar, portal, reactivar) apuntan al propio
// backend, no al frontend — son dominios distintos en Railway. API_URL se
// puede fijar a mano; si no, se usa el dominio público que Railway inyecta
// automáticamente para el servicio.
const API_URL = process.env.API_URL
  ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : APP_URL)

const fmtDate = (d: Date) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
const fmtEUR = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)

const HEADER = `
        <tr>
          <td style="background:#1a2744;padding:32px 40px;text-align:center">
            <div style="font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#f59e0b;text-decoration:underline;text-underline-offset:3px">Pro</span>
            </div>
            <div style="font-size:12px;color:#93afd4;margin-top:6px;letter-spacing:0.3px">
              Plataforma de Consentimientos Informados
            </div>
          </td>
        </tr>`

const FOOTER = `
        <tr><td style="padding:0 40px"><div style="height:1px;background:#e2e8f0"></div></td></tr>
        <tr>
          <td style="padding:24px 40px;text-align:center">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8">
              ¿Dudas? Escríbenos a soporte@consentspro.com
            </p>
            <p style="margin:0;font-size:11px;color:#cbd5e1">
              ConsentsPro · Conforme a Ley 41/2002 · RGPD · eIDAS
            </p>
          </td>
        </tr>`

function wrap(bodyRows: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        ${HEADER}
        ${bodyRows}
        ${FOOTER}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(label: string, href: string, color = '#2563eb') {
  return `
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${href}"
                     style="display:inline-block;padding:14px 36px;background:${color};color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;letter-spacing:0.2px">
                    ${label}
                  </a>
                </td>
              </tr>
            </table>`
}

interface SubRow {
  id: string
  clinic_id: string
  clinic_name: string
  clinic_email: string | null
  plan_id: string
  billing_cycle: 'monthly' | 'annual'
  current_period_end: string | null
}

async function loadSub(subscriptionId: string): Promise<SubRow | null> {
  return queryOne<SubRow>(
    `SELECT s.id, s.clinic_id, c.name AS clinic_name, c.email AS clinic_email, s.plan_id, s.billing_cycle, s.current_period_end
     FROM subscriptions s JOIN clinics c ON c.id = s.clinic_id
     WHERE s.id = $1`,
    [subscriptionId]
  )
}

async function send(to: string, subject: string, html: string, tag: string) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from: process.env.RESEND_FROM ?? 'onboarding@resend.dev', to, subject, html })
  if (error) console.error(`[${tag}] send to ${to} failed:`, error)
}

// Aviso 2 días antes de la renovación automática, con enlace para cancelar
// (cancel_at_period_end — conserva el acceso hasta la fecha ya pagada).
export async function sendSubscriptionReminderEmail(subscriptionId: string) {
  const sub = await loadSub(subscriptionId)
  if (!sub?.clinic_email || !sub.current_period_end) return
  const planName = PLAN_NAMES[sub.plan_id] ?? sub.plan_id
  const amount = priceFor(sub.plan_id, sub.billing_cycle)
  const date = fmtDate(new Date(sub.current_period_end))
  const token = await getOrCreateActionToken(sub.id, sub.clinic_id, 'cancel')
  const cancelLink = `${API_URL}/api/billing-action/cancel?token=${token}`

  const html = wrap(`
        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Hola, ${sub.clinic_name} 👋</p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6">
              Te escribimos para informarte de que tu suscripción al <strong>${planName}</strong> de ConsentsPro se renovará automáticamente el <strong>${date}</strong> por un importe de <strong>${fmtEUR(amount)}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6">
              No es necesario que hagas nada si deseas continuar disfrutando del servicio: el cobro se procesará automáticamente en tu método de pago registrado.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6">
              Si prefieres no renovar, puedes cancelar tu suscripción antes de esa fecha. Seguirás teniendo acceso completo hasta el ${date} y no se te realizará ningún cargo adicional.
            </p>
            ${button('Cancelar mi suscripción', cancelLink, '#64748b')}
            <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6">
              Gracias por confiar en ConsentsPro.
            </p>
          </td>
        </tr>`)

  await send(sub.clinic_email, `Tu ${planName} se renovará el ${date}`, html, 'subscriptionReminderEmail')
}

// Confirmación tras un cobro de renovación exitoso (invoice.payment_succeeded).
export async function sendSubscriptionRenewedEmail(subscriptionId: string, amount: number) {
  const sub = await loadSub(subscriptionId)
  if (!sub?.clinic_email) return
  const planName = PLAN_NAMES[sub.plan_id] ?? sub.plan_id
  const nextDate = sub.current_period_end ? fmtDate(new Date(sub.current_period_end)) : null

  const html = wrap(`
        <tr><td style="background:#10b981;height:5px;font-size:0">&nbsp;</td></tr>
        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">¡Gracias, ${sub.clinic_name}! ✅</p>
            <p style="margin:0 0 24px;font-size:15px;color:#64748b;line-height:1.6">
              Te confirmamos que tu suscripción al <strong>${planName}</strong> se ha renovado correctamente. Se ha realizado un cargo de <strong>${fmtEUR(amount)}</strong> en tu método de pago habitual.
            </p>
            ${nextDate ? `<p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6">Tu próxima renovación será el <strong>${nextDate}</strong>. Seguirás disfrutando de todas las funciones de tu plan sin interrupción.</p>` : ''}
            ${button('Ver mi cuenta', `${APP_URL}/recharge`)}
            <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6">
              Gracias por seguir confiando en ConsentsPro.
            </p>
          </td>
        </tr>`)

  await send(sub.clinic_email, 'Tu suscripción a ConsentsPro se ha renovado correctamente', html, 'subscriptionRenewedEmail')
}

// Aviso de fallo de cobro (invoice.payment_failed), con enlace directo al
// Portal de Cliente de Stripe para actualizar el método de pago.
export async function sendSubscriptionPaymentFailedEmail(subscriptionId: string) {
  const sub = await loadSub(subscriptionId)
  if (!sub?.clinic_email) return
  const planName = PLAN_NAMES[sub.plan_id] ?? sub.plan_id
  const amount = priceFor(sub.plan_id, sub.billing_cycle)
  const token = await getOrCreateActionToken(sub.id, sub.clinic_id, 'portal')
  const portalLink = `${API_URL}/api/billing-action/portal?token=${token}`

  const html = wrap(`
        <tr><td style="background:#f59e0b;height:5px;font-size:0">&nbsp;</td></tr>
        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Hola, ${sub.clinic_name}</p>
            <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.6">
              Hemos intentado procesar el cobro de la renovación de tu <strong>${planName}</strong> (<strong>${fmtEUR(amount)}</strong>) y no ha sido posible completarlo. Esto puede deberse a fondos insuficientes, una tarjeta caducada o datos de pago desactualizados.
            </p>
            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:0 0 24px">
              <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6">
                Vamos a volver a intentar el cobro automáticamente en los próximos días. Dispones de un plazo de <strong>5 días</strong> desde hoy para actualizar tu método de pago antes de que tu cuenta quede inactiva.
              </p>
            </div>
            ${button('Actualizar método de pago', portalLink, '#f59e0b')}
            <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6">
              Si necesitas ayuda, escríbenos a soporte@consentspro.com
            </p>
          </td>
        </tr>`)

  await send(sub.clinic_email, 'No hemos podido procesar el cobro de tu suscripción', html, 'subscriptionPaymentFailedEmail')
}

// Aviso de desactivación tras 5 días sin regularizar el impago, con enlace
// para reactivar (crea una nueva sesión de Checkout para el mismo plan).
export async function sendSubscriptionDeactivatedEmail(subscriptionId: string) {
  const sub = await loadSub(subscriptionId)
  if (!sub?.clinic_email) return
  const planName = PLAN_NAMES[sub.plan_id] ?? sub.plan_id
  const token = await getOrCreateActionToken(sub.id, sub.clinic_id, 'reactivate')
  const reactivateLink = `${API_URL}/api/billing-action/reactivate?token=${token}`

  const html = wrap(`
        <tr><td style="background:#dc2626;height:5px;font-size:0">&nbsp;</td></tr>
        <tr>
          <td style="padding:40px 40px 8px">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Hola, ${sub.clinic_name}</p>
            <p style="margin:0 0 20px;font-size:15px;color:#64748b;line-height:1.6">
              Han transcurrido 5 días desde el último intento de cobro de tu suscripción al <strong>${planName}</strong> sin que hayamos podido completarlo, por lo que tu cuenta ha quedado <strong>inactiva</strong> y se ha restringido el acceso a la plataforma.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6">
              Tranquilo: tus datos, consentimientos y configuración siguen guardados de forma segura. Puedes reactivar tu cuenta en cualquier momento completando el pago pendiente.
            </p>
            ${button('Reactivar mi cuenta', reactivateLink)}
            <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6">
              Si crees que se trata de un error o necesitas ayuda, escríbenos a soporte@consentspro.com
            </p>
          </td>
        </tr>`)

  await send(sub.clinic_email, 'Tu acceso a ConsentsPro ha sido desactivado', html, 'subscriptionDeactivatedEmail')
}
