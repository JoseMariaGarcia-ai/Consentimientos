import { query } from './db'
import { isWorkflowEnabled } from '../routes/workflows'
import { sendAppointmentReminderEmail } from './appointmentReminderEmail'

const CHECK_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

// Appointments starting 23-25h from now get exactly one reminder — the 2h
// window absorbs the gap between scheduler ticks without needing
// second-level precision. reminder_sent_at guards against double-sends.
async function runReminderSweep() {
  try {
    if (!(await isWorkflowEnabled('appointment_reminder'))) return

    const due = await query<{ id: string; clinic_id: string }>(
      `SELECT id, clinic_id FROM appointments
       WHERE status != 'cancelled'
         AND reminder_sent_at IS NULL
         AND start_time BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'`
    )

    for (const appt of due) {
      try {
        await sendAppointmentReminderEmail({ appointmentId: appt.id, clinicId: appt.clinic_id })
      } catch (err: any) {
        console.error(`[reminderScheduler] failed to send reminder for appointment ${appt.id}:`, err.message)
      } finally {
        // Mark as attempted regardless of outcome — retrying a failed send
        // every 30 minutes for the same appointment would spam on repeated
        // provider errors; a one-off failure here is not worth chasing.
        await query('UPDATE appointments SET reminder_sent_at = NOW() WHERE id = $1', [appt.id])
      }
    }
  } catch (err: any) {
    console.error('[reminderScheduler] sweep failed:', err.message)
  }
}

export function startReminderScheduler() {
  runReminderSweep()
  setInterval(runReminderSweep, CHECK_INTERVAL_MS)
}
