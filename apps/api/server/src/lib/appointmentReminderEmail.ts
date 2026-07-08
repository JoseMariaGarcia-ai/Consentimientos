import { loadAppointmentEmailData, buildAppointmentEmailHtml } from './appointmentConfirmationEmail'

interface AppointmentReminderData {
  appointmentId: string
  clinicId: string
}

export async function sendAppointmentReminderEmail({ appointmentId, clinicId }: AppointmentReminderData): Promise<boolean> {
  const loaded = await loadAppointmentEmailData(appointmentId, clinicId)
  if (!loaded) return false
  const { appt, firstName, clinicName, rows } = loaded

  const html = buildAppointmentEmailHtml({
    headerLabel: 'Recordatorio de cita',
    greeting: `Hola, ${firstName} 👋`,
    intro: `Te recordamos que <strong>mañana</strong> tienes una cita en <strong>${clinicName}</strong>. Estos son los detalles:`,
    clinicName,
    rows,
    directionsUrl: appt.clinic_directions_url,
  })

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: appt.patient_email,
    subject: `Recordatorio: tu cita es mañana — ${clinicName}`,
    html,
  })
  if (error) console.error(`[appointmentReminderEmail] send to ${appt.patient_email} failed:`, error)
  return true
}
