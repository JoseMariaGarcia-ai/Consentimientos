import { YCLOUD_BASE } from './whatsappSend'

// Definición de las 5 plantillas necesarias para que los avisos automáticos
// al paciente (bienvenida, consentimiento, cita, recordatorio, documento)
// puedan mandarse también por WhatsApp — ver lib/patientWhatsAppNotify.ts,
// que ya asume estos nombres por defecto (configurables por variable de
// entorno si YCloud terminase aprobando alguna con un nombre distinto).
//
// Verificado contra un intento real de creación (22 julio 2026): el
// formato de variables NOMBRADAS (body_text_named_params) que sí funciona
// para ENVIAR mensajes con una plantilla ya aprobada (contacto_consentspro,
// creada a mano en el panel de YCloud) es rechazado por esta cuenta al
// CREAR una plantilla por API — YCloud/Meta responde 400 "component of
// type BODY is missing expected field(s) (example.body_text)", es decir,
// espera el formato POSICIONAL clásico. Por eso estas 5 plantillas usan
// {{1}}, {{2}}... y example.body_text (array de arrays), y se envían con
// sendWhatsAppTemplate(..., 'positional') en vez de con parameter_name.
// `variables` conserva el campo `name` solo para legibilidad/documentación
// del orden — no se manda a la API.
export interface TemplateVarDef { name: string; example: string }
export interface TemplateDef {
  name: string
  category: 'UTILITY'
  language: string
  bodyText: string
  variables: TemplateVarDef[]
}

export const PATIENT_NOTIFICATION_TEMPLATES: TemplateDef[] = [
  {
    name: 'consentspro_bienvenida_portal',
    category: 'UTILITY',
    language: 'es',
    bodyText: 'Hola {{1}}, {{2}} te ha dado acceso a tu portal personal en ConsentsPro. Consulta tus consentimientos, tu historia clínica y tus fotos de tratamiento aquí: {{3}}.',
    variables: [
      { name: 'nombre', example: 'María' },
      { name: 'clinica', example: 'Clínica Vitalis' },
      { name: 'enlace', example: 'https://www.consentspro.com/patient/portal' },
    ],
  },
  {
    name: 'consentspro_consentimiento_generado',
    category: 'UTILITY',
    language: 'es',
    bodyText: 'Hola {{1}}, {{2}} ha generado un consentimiento informado para tu tratamiento de {{3}}. Consúltalo y descárgalo desde tu portal: {{4}}.',
    variables: [
      { name: 'nombre', example: 'María' },
      { name: 'clinica', example: 'Clínica Vitalis' },
      { name: 'tratamiento', example: 'Aumento de labios' },
      { name: 'enlace', example: 'https://www.consentspro.com/patient/portal' },
    ],
  },
  {
    name: 'consentspro_cita',
    category: 'UTILITY',
    language: 'es',
    bodyText: 'Hola {{1}}, tu cita en {{2}} ha sido {{3}} para el {{4}} a las {{5}}.',
    variables: [
      { name: 'nombre', example: 'María' },
      { name: 'clinica', example: 'Clínica Vitalis' },
      { name: 'estado', example: 'confirmada' },
      { name: 'fecha', example: 'lunes, 28 de julio de 2026' },
      { name: 'hora', example: '10:30' },
    ],
  },
  {
    name: 'consentspro_recordatorio_cita',
    category: 'UTILITY',
    language: 'es',
    bodyText: 'Hola {{1}}, te recordamos que mañana {{2}} a las {{3}} tienes una cita en {{4}}.',
    variables: [
      { name: 'nombre', example: 'María' },
      { name: 'fecha', example: 'martes, 29 de julio de 2026' },
      { name: 'hora', example: '10:30' },
      { name: 'clinica', example: 'Clínica Vitalis' },
    ],
  },
  {
    name: 'consentspro_documento_disponible',
    category: 'UTILITY',
    language: 'es',
    bodyText: 'Hola {{1}}, {{2}} te ha enviado tu {{3}}. Te llegará también por email; si tienes cualquier duda, contacta con la clínica',
    variables: [
      { name: 'nombre', example: 'María' },
      { name: 'clinica', example: 'Clínica Vitalis' },
      { name: 'documento', example: 'presupuesto' },
    ],
  },
]

export interface TemplateCreationResult {
  name: string
  ok: boolean
  httpStatus: number | null
  response: any
  errorMessage: string | null
}

export async function createTemplateViaYCloud(apiKey: string, def: TemplateDef): Promise<TemplateCreationResult> {
  // Confirmado con un intento real: a diferencia del envío de mensajes (que
  // no lo necesita), crear una plantilla exige indicar explícitamente el
  // wabaId (identificador de la cuenta de WhatsApp Business) — sin él,
  // YCloud responde 403 WHATSAPP_BUSINESS_ACCOUNT_UNAVAILABLE ("hasn't
  // bound WABA null"). Se toma de una variable de entorno porque no hay
  // forma de deducirlo desde la propia API Key.
  const wabaId = process.env.YCLOUD_WABA_ID?.trim()
  if (!wabaId) {
    return {
      name: def.name, ok: false, httpStatus: null, response: null,
      errorMessage: 'Falta configurar YCLOUD_WABA_ID en las variables de entorno del backend (ver panel de YCloud → datos de la cuenta de WhatsApp Business)',
    }
  }
  const body = {
    wabaId,
    name: def.name,
    category: def.category,
    language: def.language,
    components: [
      {
        type: 'BODY',
        text: def.bodyText,
        example: {
          body_text: [def.variables.map(v => v.example)],
        },
      },
    ],
  }
  try {
    const resp = await fetch(`${YCLOUD_BASE}/whatsapp/templates`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json: any = await resp.json().catch(() => ({}))
    return {
      name: def.name,
      ok: resp.ok,
      httpStatus: resp.status,
      response: json,
      errorMessage: resp.ok ? null : (json?.message ?? json?.error?.message ?? `HTTP ${resp.status}`),
    }
  } catch (err: any) {
    return { name: def.name, ok: false, httpStatus: null, response: null, errorMessage: err.message }
  }
}
