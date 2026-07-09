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

async function getClinic(userId: string) {
  const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  if (!me?.clinic_id) return null
  return queryOne<{ id: string; name: string; email: string | null; stripe_customer_id: string | null }>(
    'SELECT id, name, email, stripe_customer_id FROM clinics WHERE id = $1', [me.clinic_id]
  )
}

async function getOrCreateStripeCustomer(clinic: { id: string; name: string; email: string | null; stripe_customer_id: string | null }) {
  if (clinic.stripe_customer_id) {
    // The stored ID can go stale (deleted in Stripe, or created under a
    // different key — e.g. live vs. test mode each have their own customer
    // namespace), in which case Stripe rejects it. Fall back to creating a
    // fresh customer instead of failing the whole checkout.
    try {
      const existing = await getStripe().customers.retrieve(clinic.stripe_customer_id)
      if (!existing.deleted) return existing.id
    } catch {
      // stale ID — fall through and create a new one below
    }
  }
  const customer = await getStripe().customers.create({
    name: clinic.name,
    email: clinic.email ?? undefined,
    metadata: { clinic_id: clinic.id },
  })
  await query('UPDATE clinics SET stripe_customer_id = $1 WHERE id = $2', [customer.id, clinic.id])
  return customer.id
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

    const stripeCustomerId = await getOrCreateStripeCustomer(clinic)
    const amount = priceFor(planId, cycle as BillingCycle)

    const session = await getStripe().checkout.sessions.create({
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

// POST /api/billing/portal — sesión del Stripe Customer Portal para gestionar/cancelar
router.post('/portal', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const clinic = await getClinic(userId)
    if (!clinic?.stripe_customer_id) return res.status(400).json({ error: 'Esta clínica todavía no tiene una suscripción' })

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: clinic.stripe_customer_id,
      return_url: `${APP_URL}/recharge`,
    })
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

    return res.json({ received: true })
  } catch (err: any) {
    console.error('[billing/webhook]', err)
    return res.status(500).json({ error: err.message })
  }
})
