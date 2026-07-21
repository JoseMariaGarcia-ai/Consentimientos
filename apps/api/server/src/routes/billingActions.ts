import { Router } from 'express'
import express from 'express'
import { query, queryOne } from '../lib/db'
import { getStripe } from '../lib/stripe'
import { resolveActionToken } from '../lib/billingActionTokens'
import { getClinicById, createPortalSession, createCheckoutSession } from './billing'
import type { BillingCycle } from '../lib/plans'

// Rutas públicas (sin sesión) para los botones de un clic de los emails de
// facturación: confirmar cancelación, abrir el Portal de Cliente de Stripe,
// o reactivar una suscripción desactivada por impago.
export const publicRouter = Router()

function page(title: string, message: string, form?: { token: string; action: string; confirmLabel: string }) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · ConsentsPro</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;min-height:100vh;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#1a2744;padding:28px 40px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">
              Consents<span style="color:#f59e0b;text-decoration:underline;text-underline-offset:3px">Pro</span>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px;text-align:center">
            <p style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a">${title}</p>
            <p style="margin:0 0 ${form ? '28px' : '0'};font-size:15px;color:#64748b;line-height:1.6">${message}</p>
            ${form ? `
            <form method="POST" action="${form.action}">
              <input type="hidden" name="token" value="${form.token}" />
              <button type="submit" style="display:inline-block;padding:14px 36px;background:#dc2626;color:#ffffff;font-size:15px;font-weight:700;border:none;border-radius:10px;letter-spacing:0.2px;cursor:pointer">
                ${form.confirmLabel}
              </button>
            </form>` : ''}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

const INVALID_TOKEN_PAGE = page('Enlace no válido', 'Este enlace ha caducado o ya no es válido. Si necesitas ayuda, escríbenos a soporte@consentspro.com.')

// GET → pantalla de confirmación (sin efectos, evita cancelaciones
// accidentales por escáneres de email que abren enlaces automáticamente).
publicRouter.get('/cancel', async (req, res) => {
  try {
    const token = req.query.token as string | undefined
    const resolved = token ? await resolveActionToken(token, 'cancel') : null
    if (!resolved) return res.status(400).send(INVALID_TOKEN_PAGE)

    const sub = await queryOne<{ status: string; cancel_at_period_end: boolean; current_period_end: string | null }>(
      'SELECT status, cancel_at_period_end, current_period_end FROM subscriptions WHERE id = $1', [resolved.subscription_id]
    )
    if (!sub) return res.status(404).send(INVALID_TOKEN_PAGE)
    if (sub.cancel_at_period_end || sub.status === 'canceled') {
      return res.send(page('Ya está cancelada', 'Esta suscripción ya está programada para no renovarse.'))
    }

    const dateStr = sub.current_period_end
      ? new Date(sub.current_period_end).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Madrid' })
      : 'la fecha de renovación'

    return res.send(page(
      '¿Cancelar tu suscripción?',
      `Seguirás teniendo acceso completo hasta el ${dateStr} — ya está pagado. A partir de esa fecha no se realizará ningún cargo más.`,
      { token: token!, action: '/api/billing-action/cancel', confirmLabel: 'Sí, cancelar mi suscripción' }
    ))
  } catch (err: any) {
    console.error('[billingAction/cancel:get]', err)
    return res.status(500).send(page('Ha ocurrido un error', 'Inténtalo de nuevo más tarde.'))
  }
})

// POST → cancela de verdad (cancel_at_period_end=true), solo tras el clic explícito de confirmación.
publicRouter.post('/cancel', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const token = req.body.token as string | undefined
    const resolved = token ? await resolveActionToken(token, 'cancel') : null
    if (!resolved) return res.status(400).send(INVALID_TOKEN_PAGE)

    const sub = await queryOne<{ stripe_subscription_id: string }>(
      'SELECT stripe_subscription_id FROM subscriptions WHERE id = $1', [resolved.subscription_id]
    )
    if (!sub) return res.status(404).send(INVALID_TOKEN_PAGE)

    await getStripe().subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true })
    await query('UPDATE subscriptions SET cancel_at_period_end = true WHERE id = $1', [resolved.subscription_id])

    return res.send(page('Suscripción cancelada', 'No se te volverá a cobrar. Seguirás teniendo acceso hasta el final del periodo ya pagado.'))
  } catch (err: any) {
    console.error('[billingAction/cancel:post]', err)
    return res.status(500).send(page('Ha ocurrido un error', 'No se ha podido cancelar la suscripción. Inténtalo de nuevo más tarde o escríbenos a soporte@consentspro.com.'))
  }
})

// GET → abre el Portal de Cliente de Stripe (sesión fresca en cada clic,
// para que el enlace del email no caduque aunque se abra días después).
publicRouter.get('/portal', async (req, res) => {
  try {
    const token = req.query.token as string | undefined
    const resolved = token ? await resolveActionToken(token, 'portal') : null
    if (!resolved) return res.status(400).send(INVALID_TOKEN_PAGE)

    const clinic = await getClinicById(resolved.clinic_id)
    if (!clinic) return res.status(404).send(INVALID_TOKEN_PAGE)

    const session = await createPortalSession(clinic)
    if (!session) return res.status(400).send(page('No disponible', 'Esta clínica todavía no tiene un método de pago registrado.'))

    return res.redirect(session.url)
  } catch (err: any) {
    console.error('[billingAction/portal]', err)
    return res.status(500).send(page('Ha ocurrido un error', 'Inténtalo de nuevo más tarde.'))
  }
})

// GET → crea una nueva sesión de Checkout para el mismo plan que tenía la
// clínica antes de la desactivación, y redirige directamente al pago.
publicRouter.get('/reactivate', async (req, res) => {
  try {
    const token = req.query.token as string | undefined
    const resolved = token ? await resolveActionToken(token, 'reactivate') : null
    if (!resolved) return res.status(400).send(INVALID_TOKEN_PAGE)

    const clinic = await getClinicById(resolved.clinic_id)
    const sub = await queryOne<{ plan_id: string; billing_cycle: BillingCycle }>(
      'SELECT plan_id, billing_cycle FROM subscriptions WHERE id = $1', [resolved.subscription_id]
    )
    if (!clinic || !sub) return res.status(404).send(INVALID_TOKEN_PAGE)

    const session = await createCheckoutSession(clinic, sub.plan_id, sub.billing_cycle)
    if (!session.url) return res.status(500).send(page('Ha ocurrido un error', 'Inténtalo de nuevo más tarde.'))
    return res.redirect(session.url)
  } catch (err: any) {
    console.error('[billingAction/reactivate]', err)
    return res.status(500).send(page('Ha ocurrido un error', 'Inténtalo de nuevo más tarde o escríbenos a soporte@consentspro.com.'))
  }
})
