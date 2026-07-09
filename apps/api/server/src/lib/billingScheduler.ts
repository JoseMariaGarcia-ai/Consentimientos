import { query } from './db'
import { deactivateClinic } from './planPermissions'
import { sendSubscriptionReminderEmail, sendSubscriptionDeactivatedEmail } from './subscriptionEmails'

const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutos
const DEACTIVATION_GRACE_DAYS = 5

// Suscripciones que se renuevan dentro de 47-49h: una única ventana de 2h,
// igual que appointment reminders, para que no se dupare aunque el barrido
// no caiga justo en el minuto exacto.
async function runRenewalReminderSweep() {
  try {
    const due = await query<{ id: string }>(
      `SELECT id FROM subscriptions
       WHERE status IN ('active', 'trialing')
         AND cancel_at_period_end = false
         AND renewal_reminder_sent_at IS NULL
         AND current_period_end BETWEEN NOW() + INTERVAL '47 hours' AND NOW() + INTERVAL '49 hours'`
    )
    for (const sub of due) {
      try {
        await sendSubscriptionReminderEmail(sub.id)
      } catch (err: any) {
        console.error(`[billingScheduler] failed renewal reminder for subscription ${sub.id}:`, err.message)
      } finally {
        await query('UPDATE subscriptions SET renewal_reminder_sent_at = NOW() WHERE id = $1', [sub.id])
      }
    }
  } catch (err: any) {
    console.error('[billingScheduler] renewal reminder sweep failed:', err.message)
  }
}

// Pasados 5 días desde el primer fallo de cobro sin regularizar, se
// desactiva el acceso de la clínica y se le avisa por email.
async function runDeactivationSweep() {
  try {
    const due = await query<{ id: string; clinic_id: string }>(
      `SELECT id, clinic_id FROM subscriptions
       WHERE payment_failed_at IS NOT NULL
         AND deactivated_at IS NULL
         AND status NOT IN ('active', 'trialing', 'canceled')
         AND payment_failed_at < NOW() - INTERVAL '${DEACTIVATION_GRACE_DAYS} days'`
    )
    for (const sub of due) {
      try {
        await deactivateClinic(sub.clinic_id)
        await sendSubscriptionDeactivatedEmail(sub.id)
      } catch (err: any) {
        console.error(`[billingScheduler] failed deactivation for subscription ${sub.id}:`, err.message)
      } finally {
        await query('UPDATE subscriptions SET deactivated_at = NOW() WHERE id = $1', [sub.id])
      }
    }
  } catch (err: any) {
    console.error('[billingScheduler] deactivation sweep failed:', err.message)
  }
}

async function runSweep() {
  await runRenewalReminderSweep()
  await runDeactivationSweep()
}

export function startBillingScheduler() {
  runSweep()
  setInterval(runSweep, CHECK_INTERVAL_MS)
}
