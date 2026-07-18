import { Resend } from 'resend'

type Urgency = 'aviso' | 'critico'

// Avisa a los usuarios admin ('clinica') de la clínica titular del
// certificado — nunca al equipo de ConsentsPro, es una obligación fiscal de
// cada clínica, no de la plataforma.
//
// Devuelve si el envío se completó realmente — el llamador (el scheduler)
// solo debe marcar el aviso como enviado si esto es true. Si se marcara
// siempre, un fallo transitorio de Resend perdería para siempre el aviso de
// ese umbral (30/15/0 días), justo en un recordatorio de un plazo legal.
export async function notifyClinicCertificateExpiring(
  toEmails: string[], clinicName: string, daysLeft: number, validUntil: string, urgency: Urgency
): Promise<boolean> {
  if (toEmails.length === 0) return false
  const resend = new Resend(process.env.RESEND_API_KEY)
  const subject = urgency === 'critico'
    ? `⚠️ ConsentsPro: el certificado digital de ${clinicName} caduca hoy`
    : `ConsentsPro: el certificado digital de ${clinicName} caduca en ${daysLeft} días`
  const body = urgency === 'critico'
    ? `Tu certificado digital caduca <strong>hoy (${validUntil})</strong>. Sin un certificado vigente, ConsentsPro no podrá comunicar tus facturas a la AEAT en modalidad VERI*FACTU.`
    : `Tu certificado digital caduca el <strong>${validUntil}</strong> (en ${daysLeft} días). Sustitúyelo desde Facturación &gt; Certificado Digital antes de esa fecha para no interrumpir la comunicación de tus facturas a la AEAT.`
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'onboarding@resend.dev',
    to: toEmails,
    subject,
    html: `<!DOCTYPE html>
<html lang="es"><body style="font-family:sans-serif;padding:24px;color:#0f172a">
  <h2 style="color:${urgency === 'critico' ? '#b91c1c' : '#b45309'}">Certificado digital próximo a caducar</h2>
  <p>${body}</p>
  <p style="color:#64748b;font-size:13px">Este aviso es automático — no se necesita respuesta.</p>
</body></html>`,
  })
  if (error) {
    console.error('[certificateExpiryEmail] fallo enviando aviso de caducidad:', error)
    return false
  }
  return true
}
