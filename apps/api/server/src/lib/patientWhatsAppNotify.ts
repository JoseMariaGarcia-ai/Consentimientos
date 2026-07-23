import { queryOne } from './db'
import { chargeCredit } from './creditService'
import { getYCloudKey, sendWhatsAppTemplate, ensureClinicConversation, type TemplateVariable } from './whatsappSend'

// Mismo coste estimado por conversación que ya se usa en routes/whatsapp.ts
// para el agente de IA — ver la nota ahí sobre por qué es una estimación
// provisional mientras no se conecte el webhook de estado de YCloud.
const YCLOUD_ESTIMATED_CONVERSATION_COST_CENTS = 6

// Nombres de plantilla configurables por variable de entorno (por si el
// nombre finalmente aprobado en YCloud difiere del propuesto por defecto),
// mismo patrón que YCLOUD_CONTACT_TEMPLATE_NAME en routes/whatsapp.ts.
// Las 5 deben crearse a mano en YCloud antes de que esto pueda funcionar de
// verdad — ver el análisis de plantillas entregado junto con esta función.
const TPL_BIENVENIDA      = process.env.YCLOUD_TPL_BIENVENIDA?.trim()      || 'consentspro_bienvenida_portal'
const TPL_CONSENTIMIENTO  = process.env.YCLOUD_TPL_CONSENTIMIENTO?.trim()  || 'consentspro_consentimiento_generado'
const TPL_CITA            = process.env.YCLOUD_TPL_CITA?.trim()            || 'consentspro_cita'
const TPL_RECORDATORIO    = process.env.YCLOUD_TPL_RECORDATORIO?.trim()    || 'consentspro_recordatorio_cita'
const TPL_DOCUMENTO       = process.env.YCLOUD_TPL_DOCUMENTO?.trim()       || 'consentspro_documento_disponible'
const TPL_LANG            = process.env.YCLOUD_TPL_LANG?.trim()            || 'es'

const WHATSAPP_ELIGIBLE_PLANS = new Set(['ia', 'ia-plus', 'redes'])

// Solo se manda por WhatsApp si la clínica tiene un plan IA o superior Y ha
// activado explícitamente el interruptor de notificaciones por WhatsApp
// (opt-in — cada plantilla enviada tiene un coste real, ver
// wa_patient_notifications_enabled en la migración 085).
async function isEligible(clinicId: string): Promise<boolean> {
  const row = await queryOne<{ plan: string | null; wa_patient_notifications_enabled: boolean | null }>(
    `SELECT c.plan, cc.wa_patient_notifications_enabled
     FROM clinics c
     LEFT JOIN clinic_api_config cc ON cc.clinic_id = c.id
     WHERE c.id = $1`,
    [clinicId]
  )
  if (!row?.plan || !WHATSAPP_ELIGIBLE_PLANS.has(row.plan)) return false
  return !!row.wa_patient_notifications_enabled
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 9) return null
  // Los números guardados en patients.phone no siempre incluyen prefijo de
  // país — YCloud lo necesita en formato internacional. Se asume España
  // (34) cuando el número tiene 9 dígitos, igual que ya asume el resto de
  // la integración de WhatsApp para los enlaces directos de clínica.
  return digits.length === 9 ? `34${digits}` : digits
}

interface NotifyResult { sent: boolean; reason?: string }

// Punto único de entrada: envía UNA plantilla concreta al paciente por
// WhatsApp, si la clínica es elegible — nunca lanza (el email es siempre
// el canal principal y ya se ha enviado antes de llamar aquí; un fallo de
// WhatsApp no debe afectar a esa entrega ya realizada).
async function notify(
  clinicId: string, patientId: string | null, phone: string | null, patientName: string | null,
  templateName: string, variables: TemplateVariable[], savedBody: string
): Promise<NotifyResult> {
  try {
    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) return { sent: false, reason: 'sin teléfono' }
    if (!(await isEligible(clinicId))) return { sent: false, reason: 'clínica no elegible' }
    const apiKey = await getYCloudKey(clinicId)
    if (!apiKey) return { sent: false, reason: 'YCloud no configurado' }

    const conversationId = await ensureClinicConversation(clinicId, normalizedPhone, patientId, patientName)
    // Las 5 plantillas de aviso al paciente se crean con whatsappTemplates.ts
    // usando parámetros posicionales ({{1}}, {{2}}...) — ver la nota en ese
    // fichero sobre por qué no se pudieron crear con parámetros nombrados.
    const { status, failureReason } = await sendWhatsAppTemplate(
      apiKey, clinicId, conversationId, normalizedPhone, templateName, TPL_LANG, variables, savedBody, 'clinica', 'positional'
    )
    if (status === 'sent') {
      await chargeCredit(clinicId, 'ycloud', YCLOUD_ESTIMATED_CONVERSATION_COST_CENTS, null).catch(() => {})
      return { sent: true }
    }
    console.error(`[patientWhatsAppNotify] fallo enviando plantilla "${templateName}" a ${normalizedPhone}:`, failureReason)
    return { sent: false, reason: failureReason ?? 'fallo desconocido' }
  } catch (err: any) {
    console.error(`[patientWhatsAppNotify] excepción enviando plantilla "${templateName}":`, err.message)
    return { sent: false, reason: err.message }
  }
}

export async function notifyPatientWelcome(
  clinicId: string, patientId: string, phone: string | null, patientName: string, clinicName: string, portalLink: string
): Promise<NotifyResult> {
  return notify(clinicId, patientId, phone, patientName, TPL_BIENVENIDA,
    [
      { name: 'nombre', value: patientName },
      { name: 'clinica', value: clinicName },
      { name: 'enlace', value: portalLink },
    ],
    `Hola ${patientName}, ${clinicName} te ha dado acceso a tu portal personal en ConsentsPro. Consulta tus consentimientos, tu historia clínica y tus fotos de tratamiento aquí: ${portalLink}`
  )
}

export async function notifyPatientConsentGenerated(
  clinicId: string, patientId: string, phone: string | null, patientName: string, clinicName: string, treatmentType: string, portalLink: string
): Promise<NotifyResult> {
  return notify(clinicId, patientId, phone, patientName, TPL_CONSENTIMIENTO,
    [
      { name: 'nombre', value: patientName },
      { name: 'clinica', value: clinicName },
      { name: 'tratamiento', value: treatmentType },
      { name: 'enlace', value: portalLink },
    ],
    `Hola ${patientName}, ${clinicName} ha generado un consentimiento informado para tu tratamiento de ${treatmentType}. Consúltalo y descárgalo desde tu portal: ${portalLink}`
  )
}

export async function notifyPatientAppointment(
  clinicId: string, patientId: string, phone: string | null, patientName: string, clinicName: string,
  kind: 'created' | 'rescheduled', dateStr: string, timeStr: string
): Promise<NotifyResult> {
  const estado = kind === 'rescheduled' ? 'reprogramada' : 'confirmada'
  // consentspro_cita se creó con 4 variables (fecha y hora combinadas en
  // una sola) tras un rechazo de YCloud/Meta por exceso de variables para
  // el texto — ver la nota en whatsappTemplates.ts.
  return notify(clinicId, patientId, phone, patientName, TPL_CITA,
    [
      { name: 'nombre', value: patientName },
      { name: 'clinica', value: clinicName },
      { name: 'estado', value: estado },
      { name: 'fecha_hora', value: `${dateStr} a las ${timeStr}` },
    ],
    `Hola ${patientName}, tu cita en ${clinicName} ha sido ${estado} para el ${dateStr} a las ${timeStr}`
  )
}

export async function notifyPatientAppointmentReminder(
  clinicId: string, patientId: string, phone: string | null, patientName: string, clinicName: string, dateStr: string, timeStr: string
): Promise<NotifyResult> {
  return notify(clinicId, patientId, phone, patientName, TPL_RECORDATORIO,
    [
      { name: 'nombre', value: patientName },
      { name: 'fecha', value: dateStr },
      { name: 'hora', value: timeStr },
      { name: 'clinica', value: clinicName },
    ],
    `Hola ${patientName}, te recordamos que mañana ${dateStr} a las ${timeStr} tienes una cita en ${clinicName}`
  )
}

export async function notifyPatientDocumentAvailable(
  clinicId: string, patientId: string, phone: string | null, patientName: string, clinicName: string, documentLabel: 'presupuesto' | 'factura'
): Promise<NotifyResult> {
  return notify(clinicId, patientId, phone, patientName, TPL_DOCUMENTO,
    [
      { name: 'nombre', value: patientName },
      { name: 'clinica', value: clinicName },
      { name: 'documento', value: documentLabel },
    ],
    `Hola ${patientName}, ${clinicName} te ha enviado tu ${documentLabel}. Te llegará también por email; si tienes cualquier duda, contacta con la clínica`
  )
}
