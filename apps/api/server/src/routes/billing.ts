import { Router } from 'express'
import Stripe from 'stripe'
import { query, queryOne } from '../lib/db'
import { getStripe } from '../lib/stripe'
import { PLAN_NAMES, isValidPlan, isValidCycle, priceFor, BillingCycle } from '../lib/plans'
import { applyPlanToClinic } from '../lib/planPermissions'
import { requireSuperAdmin } from '../middleware/auth'

const router = Router()
export const webhookRouter = Router()

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

type ClinicRow = {
  id: string; name: string; email: string | null; stripe_customer_id: string | null
  legal_name: string | null; tax_id: string | null; address: string | null
}

const CLINIC_FIELDS = 'id, name, email, stripe_customer_id, legal_name, tax_id, address'

async function getClinic(userId: string): Promise<ClinicRow | null> {
  const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  if (!me?.clinic_id) return null
  return queryOne<ClinicRow>(`SELECT ${CLINIC_FIELDS} FROM clinics WHERE id = $1`, [me.clinic_id])
}

export async function getClinicById(clinicId: string): Promise<ClinicRow | null> {
  return queryOne<ClinicRow>(`SELECT ${CLINIC_FIELDS} FROM clinics WHERE id = $1`, [clinicId])
}

// Los datos fiscales de la clínica (NIF/CIF, razón social, dirección) ya se
// editan en Clínica > Datos fiscales — aquí solo se reflejan en Stripe para
// que salgan correctamente en sus facturas. Nunca deben poder tumbar el
// checkout: si Stripe rechaza el formato del NIF, se sigue sin él.
function stripeCustomerFields(clinic: ClinicRow): { name: string; email?: string; address?: { line1: string; country: string } } {
  return {
    name: clinic.legal_name || clinic.name,
    email: clinic.email ?? undefined,
    address: clinic.address ? { line1: clinic.address, country: 'ES' } : undefined,
  }
}

async function attachTaxId(stripeCustomerId: string, taxId: string | null) {
  if (!taxId) return
  try {
    await getStripe().customers.createTaxId(stripeCustomerId, { type: 'es_cif', value: taxId })
  } catch (err: any) {
    console.error(`[billing] no se pudo asociar el NIF/CIF a ${stripeCustomerId}:`, err.message)
  }
}

async function getOrCreateStripeCustomer(clinic: ClinicRow) {
  if (clinic.stripe_customer_id) {
    // The stored ID can go stale (deleted in Stripe, or created under a
    // different key — e.g. live vs. test mode each have their own customer
    // namespace), in which case Stripe rejects it. Fall back to creating a
    // fresh customer instead of failing the whole checkout.
    try {
      const existing = await getStripe().customers.retrieve(clinic.stripe_customer_id)
      if (!existing.deleted) {
        // Mantiene el nombre/dirección/NIF al día si la clínica los añade o
        // edita después de la primera compra — nunca bloquea el checkout.
        try { await getStripe().customers.update(existing.id, stripeCustomerFields(clinic)) } catch {}
        await attachTaxId(existing.id, clinic.tax_id)
        return existing.id
      }
    } catch {
      // stale ID — fall through and create a new one below
    }
  }
  const customer = await getStripe().customers.create({
    ...stripeCustomerFields(clinic),
    metadata: { clinic_id: clinic.id },
  })
  await attachTaxId(customer.id, clinic.tax_id)
  await query('UPDATE clinics SET stripe_customer_id = $1 WHERE id = $2', [customer.id, clinic.id])
  return customer.id
}

// Compartido entre POST /checkout (clínica autenticada) y el enlace de
// reactivación por email (routes/billingActions.ts).
export async function createCheckoutSession(clinic: ClinicRow, planId: string, cycle: BillingCycle) {
  const stripeCustomerId = await getOrCreateStripeCustomer(clinic)
  const amount = priceFor(planId, cycle)

  return getStripe().checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `ConsentsPro — ${PLAN_NAMES[planId]}` },
        unit_amount: Math.round(amount * 100),
        recurring: { interval: cycle === 'annual' ? 'year' : 'month' },
      },
      quantity: 1,
    }],
    success_url: `${APP_URL}/recharge?checkout=success`,
    cancel_url: `${APP_URL}/recharge?checkout=cancelled`,
    subscription_data: {
      metadata: { clinic_id: clinic.id, plan_id: planId, billing_cycle: cycle },
    },
  })
}

// POST /api/billing/checkout — { planId, cycle } -> { url }
router.post('/checkout', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const { planId, cycle } = req.body as { planId?: string; cycle?: string }

    if (!planId || !isValidPlan(planId)) return res.status(400).json({ error: 'Plan no válido' })
    if (!cycle || !isValidCycle(cycle)) return res.status(400).json({ error: 'Ciclo de facturación no válido' })

    const clinic = await getClinic(userId)
    if (!clinic) return res.status(403).json({ error: 'Sin clínica asociada' })

    const session = await createCheckoutSession(clinic, planId, cycle as BillingCycle)
    return res.json({ url: session.url })
  } catch (err: any) {
    console.error('[billing/checkout]', err)
    return res.status(500).json({ error: err.message })
  }
})

// GET /api/billing/status — la suscripción activa (o más reciente) de la clínica del usuario
router.get('/status', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const clinic = await getClinic(userId)
    if (!clinic) return res.status(403).json({ error: 'Sin clínica asociada' })

    const sub = await queryOne(
      `SELECT plan_id, billing_cycle, status, current_period_end, cancel_at_period_end
       FROM subscriptions WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [clinic.id]
    )
    return res.json(sub ?? null)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Compartido entre POST /portal y el enlace "Actualizar método de pago" del
// email de fallo de cobro (routes/billingActions.ts).
export async function createPortalSession(clinic: ClinicRow) {
  if (!clinic.stripe_customer_id) return null
  return getStripe().billingPortal.sessions.create({
    customer: clinic.stripe_customer_id,
    return_url: `${APP_URL}/recharge`,
  })
}

// POST /api/billing/portal — sesión del Stripe Customer Portal para gestionar/cancelar
router.post('/portal', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const clinic = await getClinic(userId)
    if (!clinic) return res.status(403).json({ error: 'Sin clínica asociada' })

    const portalSession = await createPortalSession(clinic)
    if (!portalSession) return res.status(400).json({ error: 'Esta clínica todavía no tiene una suscripción' })
    return res.json({ url: portalSession.url })
  } catch (err: any) {
    console.error('[billing/portal]', err)
    return res.status(500).json({ error: err.message })
  }
})

// GET /api/billing/subscriptions — superadmin only. Todas las suscripciones
// de todas las clínicas, para el panel Configuración > Suscripciones.
router.get('/subscriptions', requireSuperAdmin, async (_req, res) => {
  try {
    const rows = await query<{
      id: string
      clinic_id: string
      clinic_name: string
      plan_id: string
      billing_cycle: BillingCycle
      status: string
      current_period_end: string | null
      cancel_at_period_end: boolean
      created_at: string
    }>(
      `SELECT s.id, s.clinic_id, c.name AS clinic_name, s.plan_id, s.billing_cycle, s.status,
              s.current_period_end, s.cancel_at_period_end, s.created_at
       FROM subscriptions s
       JOIN clinics c ON c.id = s.clinic_id
       ORDER BY s.created_at DESC`
    )
    const data = rows.map(r => ({
      id: r.id,
      clinic_id: r.clinic_id,
      clinic_name: r.clinic_name,
      plan_id: r.plan_id,
      plan_name: PLAN_NAMES[r.plan_id] ?? r.plan_id,
      billing_cycle: r.billing_cycle,
      amount: priceFor(r.plan_id, r.billing_cycle),
      status: r.status,
      activated_at: r.created_at,
      expires_at: r.current_period_end,
      cancel_at_period_end: r.cancel_at_period_end,
    }))
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router

// POST /api/billing/webhook — público, montado con express.raw antes del parser JSON global (ver index.ts)
webhookRouter.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature']
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) return res.status(400).send('Webhook no configurado')

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, secret)
  } catch (err: any) {
    console.error('[billing/webhook] firma inválida', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    const already = await queryOne('SELECT id FROM stripe_webhook_events WHERE id = $1', [event.id])
    if (already) return res.json({ received: true, duplicate: true })
    await query('INSERT INTO stripe_webhook_events (id, type) VALUES ($1, $2)', [event.id, event.type])

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const sub = event.data.object as Stripe.Subscription
      const clinicId = sub.metadata?.clinic_id
      const planId = sub.metadata?.plan_id
      const billingCycle = sub.metadata?.billing_cycle ?? 'monthly'
      if (clinicId && planId) {
        const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status
        const periodEndSeconds = sub.items.data[0]?.current_period_end
        const currentPeriodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000) : null
        await query(
          `INSERT INTO subscriptions (clinic_id, plan_id, billing_cycle, stripe_customer_id, stripe_subscription_id, status, current_period_end, cancel_at_period_end)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (stripe_subscription_id) DO UPDATE SET
             plan_id = EXCLUDED.plan_id,
             billing_cycle = EXCLUDED.billing_cycle,
             status = EXCLUDED.status,
             current_period_end = EXCLUDED.current_period_end,
             cancel_at_period_end = EXCLUDED.cancel_at_period_end,
             updated_at = NOW()`,
          [clinicId, planId, billingCycle, sub.customer as string, sub.id, status, currentPeriodEnd, sub.cancel_at_period_end ?? false]
        )

        // El plan activo de la clínica (que rige el acceso a módulos vía
        // plan_permissions) solo se actualiza mientras la suscripción está
        // en un estado de pago válido. Al cancelarse no se degrada
        // automáticamente el acceso — eso queda a criterio de un superadmin
        // desde Configuración > Usuarios, para evitar bloquear una clínica
        // por un fallo puntual del webhook.
        if (status === 'active' || status === 'trialing') {
          await applyPlanToClinic(clinicId, planId)
        }
      }
    }

    // Cobros de renovación (no el cobro inicial al contratar, que ya se
    // confirma con la propia redirección de éxito del Checkout).
    if (event.type === 'invoice.payment_succeeded' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const subDetails = invoice.parent?.subscription_details?.subscription
      const stripeSubId = typeof subDetails === 'string' ? subDetails : subDetails?.id
      if (stripeSubId && invoice.billing_reason === 'subscription_cycle') {
        const row = await queryOne<{ id: string; payment_failed_at: string | null; payment_failed_notified_at: string | null }>(
          'SELECT id, payment_failed_at, payment_failed_notified_at FROM subscriptions WHERE stripe_subscription_id = $1',
          [stripeSubId]
        )
        if (row) {
          if (event.type === 'invoice.payment_succeeded') {
            if (row.payment_failed_at) {
              await query('UPDATE subscriptions SET payment_failed_at = NULL, payment_failed_notified_at = NULL WHERE id = $1', [row.id])
            }
            const { sendSubscriptionRenewedEmail } = await import('../lib/subscriptionEmails')
            await sendSubscriptionRenewedEmail(row.id, (invoice.amount_paid ?? 0) / 100)
          } else {
            if (!row.payment_failed_at) {
              await query('UPDATE subscriptions SET payment_failed_at = NOW() WHERE id = $1', [row.id])
            }
            if (!row.payment_failed_notified_at) {
              await query('UPDATE subscriptions SET payment_failed_notified_at = NOW() WHERE id = $1', [row.id])
              const { sendSubscriptionPaymentFailedEmail } = await import('../lib/subscriptionEmails')
              await sendSubscriptionPaymentFailedEmail(row.id)
            }
          }
        }
      }
    }

    return res.json({ received: true })
  } catch (err: any) {
    console.error('[billing/webhook]', err)
    return res.status(500).json({ error: err.message })
  }
})
