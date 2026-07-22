import { YCLOUD_BASE } from './whatsappSend'

// Definición de las 5 plantillas necesarias para que los avisos automáticos
// al paciente (bienvenida, consentimiento, cita, recordatorio, documento)
// puedan mandarse también por WhatsApp — ver lib/patientWhatsAppNotify.ts,
// que ya asume estos nombres por defecto (configurables por variable de
// entorno si YCloud terminase aprobando alguna con un nombre distinto).
//
// Formato de creación INFERIDO del propio WhatsApp Cloud API (que YCloud
// dice replicar) para plantillas con variables NOMBRADAS —
// body_text_named_params es el formato documentado por Meta para el
// "example" de una plantilla con {{nombre}} en vez de {{1}}. No verificado
// contra tráfico real de creación de plantillas de YCloud todavía (solo el
// envío de mensajes de plantilla ya aprobadas está confirmado en
// producción) — revisar la respuesta real del primer intento.
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
    bodyText: 'Hola {{nombre}}, {{clinica}} te ha dado acceso a tu portal personal en ConsentsPro. Consulta tus consentimientos, tu historia clínica y tus fotos de tratamiento aquí: {{enlace}}',
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
    bodyText: 'Hola {{nombre}}, {{clinica}} ha generado un consentimiento informado para tu tratamiento de {{tratamiento}}. Consúltalo y descárgalo desde tu portal: {{enlace}}',
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
    bodyText: 'Hola {{nombre}}, tu cita en {{clinica}} ha sido {{estado}} para el {{fecha}} a las {{hora}}',
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
    bodyText: 'Hola {{nombre}}, te recordamos que mañana {{fecha}} a las {{hora}} tienes una cita en {{clinica}}',
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
    bodyText: 'Hola {{nombre}}, {{clinica}} te ha enviado tu {{documento}}. Te llegará también por email; si tienes cualquier duda, contacta con la clínica',
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
  const body = {
    name: def.name,
    category: def.category,
    language: def.language,
    components: [
      {
        type: 'BODY',
        text: def.bodyText,
        example: {
          body_text_named_params: def.variables.map(v => ({ param_name: v.name, example: v.example })),
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
