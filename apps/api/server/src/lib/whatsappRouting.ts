import { query, queryOne } from './db'

export const CASE_A_QUESTION = '¡Hola! Para ayudarte mejor, ¿en qué clínica tienes tu cita o sobre cuál quieres información?'

export interface RoutedClinic { id: string; name: string; trade_name: string | null }

// Enlace directo por clínica — evita la ambigüedad desde el origen (A.5).
// El número usado es el número compartido de YCloud (una única cuenta para
// todas las clínicas), configurado en YCLOUD_WA_NUMBER.
export function generateDirectLink(whatsappCode: string): string {
  const number = (process.env.YCLOUD_WA_NUMBER ?? '').replace(/[^\d]/g, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(`CLINICA_${whatsappCode}`)}`
}

const DIRECT_LINK_RE = /CLINICA_([A-Z0-9]{4,10})/i

export function detectDirectLinkCode(text: string): string | null {
  const m = text.match(DIRECT_LINK_RE)
  return m ? m[1].toUpperCase() : null
}

// Coincidencia por nombre en texto libre — heurística deliberadamente
// simple (substring, sin distinguir mayúsculas/tildes) para resolver el
// Caso A (número nuevo) y la reformulación del Caso C (>90 días). Si el
// texto menciona más de una clínica candidata, se considera que sigue
// siendo ambiguo — nunca se adivina.
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function matchClinicByName<T extends { name: string; trade_name: string | null }>(text: string, candidates: T[]): T | null {
  const normalizedText = normalize(text)
  const matches = candidates.filter(c => {
    const name = normalize(c.trade_name ?? c.name)
    return name.length > 2 && normalizedText.includes(name)
  })
  return matches.length === 1 ? matches[0] : null
}

function matchProvinceByName(text: string, provinces: string[]): string | null {
  const normalizedText = normalize(text)
  const matches = provinces.filter(p => normalizedText.includes(normalize(p)))
  return matches.length === 1 ? matches[0] : null
}

// Si el número que escribe ya es un paciente dado de alta en alguna
// clínica, esa es la señal más fiable de todas — más que cualquier
// conversación previa de WhatsApp (que puede no existir todavía) o que
// preguntar la provincia. Se compara solo por dígitos (los teléfonos se
// guardan con formatos distintos: "+34 676944173", "34676944173"...), con
// una segunda pasada por los últimos 9 dígitos por si a algún registro
// antiguo le falta el prefijo de país. Si el número coincide con pacientes
// de MÁS de una clínica distinta, no se resuelve solo — se trata como si
// no hubiera coincidencia, nunca se adivina cuál de las dos es.
export interface PatientMatch { clinicId: string; patientId: string; fullName: string | null }

export async function matchRegisteredPatientClinic(phone: string): Promise<PatientMatch | null> {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 9) return null
  const last9 = digits.slice(-9)
  const rows = await query<{ id: string; clinic_id: string; full_name: string | null }>(
    `SELECT id, clinic_id, full_name FROM patients
     WHERE clinic_id IS NOT NULL
       AND RIGHT(regexp_replace(phone, '\\D', '', 'g'), 9) = $1`,
    [last9]
  )
  const distinctClinics = new Set(rows.map(r => r.clinic_id))
  if (distinctClinics.size !== 1) return null
  return { clinicId: rows[0].clinic_id, patientId: rows[0].id, fullName: rows[0].full_name }
}

// WhatsApp/YCloud limita las listas interactivas a 10 filas en total
// (sumando todas las secciones), título de fila ≤24 caracteres y
// descripción ≤72. Si algún día hay más de 10 provincias o más de 10
// clínicas en una misma provincia, esto se queda corto y hay que rediseñar
// (paginación o agrupar por comunidad autónoma) — de momento, con ese
// volumen, se cae automáticamente al flujo de texto libre de siempre en
// vez de mostrar una lista truncada o rota.
const MAX_LIST_ROWS = 10
const MAX_ROW_TITLE = 24
const MAX_ROW_DESCRIPTION = 72

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}

export interface InteractiveListRow { id: string; title: string; description?: string }
export interface InteractiveListPayload {
  bodyText: string
  buttonText: string
  sections: { title?: string; rows: InteractiveListRow[] }[]
}

export interface RouteResult {
  clinicId: string | null
  conversationId: string | null
  source: 'link_directo' | 'pregunta_ambigua' | 'recencia_automatica' | 'lista_interactiva' | 'paciente_registrado' | null
  // Aclaración a enviar tal cual, SIN pasar por el agente de IA — como
  // mucho una de las dos, nunca las dos a la vez.
  clarificationMessage: string | null
  clarificationInteractive: InteractiveListPayload | null
}

function noRoute(clarificationMessage: string | null, clarificationInteractive: InteractiveListPayload | null = null): RouteResult {
  return { clinicId: null, conversationId: null, source: null, clarificationMessage, clarificationInteractive }
}

async function getRoutingState(phone: string): Promise<{ stage: string; province: string | null } | null> {
  // Un estado de más de 1 hora se considera abandonado — se ignora y se
  // trata como si el paciente empezara de cero, en vez de forzarle a
  // continuar una selección de provincia que ya ni recuerda haber empezado.
  const row = await queryOne<{ stage: string; province: string | null }>(
    `SELECT stage, province FROM whatsapp_routing_state WHERE phone = $1 AND updated_at > NOW() - INTERVAL '1 hour'`,
    [phone]
  )
  return row ?? null
}

async function setRoutingState(phone: string, stage: 'awaiting_province' | 'awaiting_clinic', province: string | null): Promise<void> {
  await query(
    `INSERT INTO whatsapp_routing_state (phone, stage, province, updated_at) VALUES ($1,$2,$3,NOW())
     ON CONFLICT (phone) DO UPDATE SET stage = $2, province = $3, updated_at = NOW()`,
    [phone, stage, province]
  )
}

async function clearRoutingState(phone: string): Promise<void> {
  await query('DELETE FROM whatsapp_routing_state WHERE phone = $1', [phone])
}

function buildProvinceListPayload(provinces: string[]): InteractiveListPayload {
  return {
    bodyText: '¡Hola! Para ayudarte mejor, ¿en qué provincia está tu clínica?',
    buttonText: 'Ver provincias',
    sections: [{ rows: provinces.slice(0, MAX_LIST_ROWS).map(p => ({ id: `province:${p}`, title: truncate(p, MAX_ROW_TITLE) })) }],
  }
}

function buildClinicListPayload(province: string, clinics: { id: string; name: string; trade_name: string | null; city: string | null }[]): InteractiveListPayload {
  return {
    bodyText: `Clínicas en ${province}. Elige la tuya:`,
    buttonText: 'Ver clínicas',
    sections: [{
      rows: clinics.slice(0, MAX_LIST_ROWS).map(c => ({
        id: `clinic:${c.id}`,
        title: truncate(c.trade_name ?? c.name, MAX_ROW_TITLE),
        description: c.city ? truncate(c.city, MAX_ROW_DESCRIPTION) : undefined,
      })),
    }],
  }
}

async function clinicsInProvince(province: string): Promise<{ id: string; name: string; trade_name: string | null; city: string | null }[]> {
  return query('SELECT id, name, trade_name, city FROM clinics WHERE province = $1 ORDER BY trade_name, name', [province])
}

// REGLA DE ORO: nunca se genera una respuesta de IA sin haber determinado
// con certeza (o preguntado si hay ambigüedad) a qué clinic_id pertenece
// la conversación. Esta función es el único punto que decide eso — el
// webhook compartido SIEMPRE debe pasar por aquí antes de cargar cualquier
// prompt/base de conocimiento.
//
// interactiveReplyId: si el mensaje entrante es la respuesta a una lista
// interactiva ("province:Cádiz" / "clinic:<uuid>"), en vez de texto libre.
export async function resolveIncomingConversation(phone: string, text: string, interactiveReplyId?: string | null): Promise<RouteResult> {
  // 0. Continuación de una selección de provincia/clínica ya en curso.
  const pending = await getRoutingState(phone)
  if (pending) {
    if (pending.stage === 'awaiting_province') {
      const chosenProvince = interactiveReplyId?.startsWith('province:')
        ? interactiveReplyId.slice('province:'.length)
        : matchProvinceByName(text, await distinctProvinces())
      if (chosenProvince) return resolveProvinceChoice(phone, chosenProvince)
      // No se reconoció la respuesta — se repite la lista en vez de dejar la conversación colgada.
      const provinces = await distinctProvinces()
      if (provinces.length > 0 && provinces.length <= MAX_LIST_ROWS) {
        return noRoute(null, buildProvinceListPayload(provinces))
      }
      await clearRoutingState(phone)
      return noRoute(CASE_A_QUESTION)
    }
    if (pending.stage === 'awaiting_clinic' && pending.province) {
      const candidates = await clinicsInProvince(pending.province)
      let chosen = interactiveReplyId?.startsWith('clinic:')
        ? candidates.find(c => c.id === interactiveReplyId!.slice('clinic:'.length)) ?? null
        : null
      if (!chosen) chosen = matchClinicByName(text, candidates)
      if (chosen) {
        await clearRoutingState(phone)
        const conversationId = await ensureConversation(chosen.id, phone, 'lista_interactiva')
        return { clinicId: chosen.id, conversationId, source: 'lista_interactiva', clarificationMessage: null, clarificationInteractive: null }
      }
      if (candidates.length > 0 && candidates.length <= MAX_LIST_ROWS) {
        return noRoute(null, buildClinicListPayload(pending.province, candidates))
      }
      await clearRoutingState(phone)
      return noRoute(CASE_A_QUESTION)
    }
  }

  // 1. Link directo — señal más fuerte e inequívoca posible.
  const code = detectDirectLinkCode(text)
  if (code) {
    const clinic = await queryOne<{ id: string }>('SELECT id FROM clinics WHERE whatsapp_code = $1', [code])
    if (clinic) {
      const conversationId = await ensureConversation(clinic.id, phone, 'link_directo')
      return { clinicId: clinic.id, conversationId, source: 'link_directo', clarificationMessage: null, clarificationInteractive: null }
    }
  }

  // 1.5. ¿Es ya un paciente registrado en alguna clínica? Señal más fiable
  // que el historial de conversaciones (que puede no existir todavía si es
  // la primera vez que escribe por WhatsApp) — se comprueba antes. Se
  // guarda también su nombre en la conversación, para que el panel
  // muestre "Nombre del paciente" con el teléfono debajo, no solo el
  // número en crudo.
  const patientMatch = await matchRegisteredPatientClinic(phone)
  if (patientMatch) {
    const conversationId = await ensureConversation(patientMatch.clinicId, phone, 'paciente_registrado', {
      id: patientMatch.patientId, name: patientMatch.fullName,
    })
    return { clinicId: patientMatch.clinicId, conversationId, source: 'paciente_registrado', clarificationMessage: null, clarificationInteractive: null }
  }

  // 2. Historial de conversaciones existentes para este número, en CUALQUIER clínica.
  const history = await query<{ clinic_id: string; last_message_at: string }>(
    // clinic_id IS NOT NULL: las conversaciones de administrador (superadmin
    // escribiendo como ConsentsPro, sin clínica) nunca deben entrar en el
    // enrutamiento de pacientes — eso ya se filtra antes en el webhook, pero
    // se repite aquí como defensa en profundidad.
    "SELECT clinic_id, MAX(last_message_at) AS last_message_at FROM whatsapp_conversations WHERE phone = $1 AND clinic_id IS NOT NULL GROUP BY clinic_id",
    [phone]
  )

  if (history.length === 0) {
    // Caso A: número totalmente nuevo. Se intenta resolver por si el texto
    // ya menciona el nombre de una clínica (respuesta a una pregunta
    // anterior, o el paciente ya lo escribió por iniciativa propia).
    const clinics = await query<RoutedClinic>('SELECT id, name, trade_name FROM clinics')
    const match = matchClinicByName(text, clinics)
    if (match) {
      const conversationId = await ensureConversation(match.id, phone, 'pregunta_ambigua')
      return { clinicId: match.id, conversationId, source: 'pregunta_ambigua', clarificationMessage: null, clarificationInteractive: null }
    }
    // Sin coincidencia de nombre: se ofrece elegir por provincia con una
    // lista interactiva (mucho más fiable que pedir que escriba el nombre
    // exacto — "la clínica de Jerez" no tiene por qué coincidir con el
    // nombre comercial registrado). Si no hay suficientes clínicas con
    // provincia configurada, o hay demasiadas provincias para una lista,
    // se cae al texto libre de siempre.
    const provinces = await distinctProvinces()
    if (provinces.length === 1) return resolveProvinceChoice(phone, provinces[0])
    if (provinces.length >= 2 && provinces.length <= MAX_LIST_ROWS) {
      return noRoute(null, buildProvinceListPayload(provinces))
    }
    return noRoute(CASE_A_QUESTION)
  }

  if (history.length === 1) {
    // Caso B: una única clínica en el historial — se enruta sin preguntar.
    const clinicId = history[0].clinic_id
    const conversationId = await ensureConversation(clinicId, phone, null)
    return { clinicId, conversationId, source: null, clarificationMessage: null, clarificationInteractive: null }
  }

  // Caso C: ambigüedad — más de una clínica tiene conversación con este número.
  const windowDaysRow = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'wa_ambiguity_window_days'")
  const windowDays = Number(windowDaysRow?.value ?? 90)
  const sorted = [...history].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
  const mostRecent = sorted[0]
  const daysSince = (Date.now() - new Date(mostRecent.last_message_at).getTime()) / (24 * 3600 * 1000)

  if (daysSince <= windowDays) {
    // Por defecto: enrutar a la clínica más reciente.
    const conversationId = await ensureConversation(mostRecent.clinic_id, phone, 'recencia_automatica')
    return { clinicId: mostRecent.clinic_id, conversationId, source: 'recencia_automatica', clarificationMessage: null, clarificationInteractive: null }
  }

  // Han pasado más de windowDays: reformular la pregunta salvo que el
  // propio texto entrante ya mencione cuál de las candidatas es.
  const candidateIds = history.map(h => h.clinic_id)
  const candidates = await query<RoutedClinic>(
    `SELECT id, name, trade_name FROM clinics WHERE id = ANY($1::uuid[])`, [candidateIds]
  )
  const match = matchClinicByName(text, candidates)
  if (match) {
    const conversationId = await ensureConversation(match.id, phone, 'pregunta_ambigua')
    return { clinicId: match.id, conversationId, source: 'pregunta_ambigua', clarificationMessage: null, clarificationInteractive: null }
  }
  const names = candidates.map(c => c.trade_name ?? c.name)
  return noRoute(`¡Hola de nuevo! Para no confundir tu consulta, ¿nos escribes por ${names.join(' o por ')}?`)
}

async function distinctProvinces(): Promise<string[]> {
  const rows = await query<{ province: string }>(
    `SELECT DISTINCT province FROM clinics WHERE province IS NOT NULL AND province <> '' ORDER BY province`
  )
  return rows.map(r => r.province)
}

// Provincia ya elegida (por lista o por texto): si solo hay una clínica ahí,
// se resuelve directamente sin preguntar más; si hay varias, se listan.
async function resolveProvinceChoice(phone: string, province: string): Promise<RouteResult> {
  const candidates = await clinicsInProvince(province)
  if (candidates.length === 0) {
    await clearRoutingState(phone)
    return noRoute(CASE_A_QUESTION)
  }
  if (candidates.length === 1) {
    await clearRoutingState(phone)
    const conversationId = await ensureConversation(candidates[0].id, phone, 'lista_interactiva')
    return { clinicId: candidates[0].id, conversationId, source: 'lista_interactiva', clarificationMessage: null, clarificationInteractive: null }
  }
  if (candidates.length > MAX_LIST_ROWS) {
    // Demasiadas clínicas en esta provincia para una lista — se pide el
    // nombre por texto, ya acotado a esta provincia.
    await setRoutingState(phone, 'awaiting_clinic', province)
    return noRoute(`Hay varias clínicas en ${province}. ¿Cómo se llama la tuya?`)
  }
  await setRoutingState(phone, 'awaiting_clinic', province)
  return noRoute(null, buildClinicListPayload(province, candidates))
}

async function ensureConversation(
  clinicId: string, phone: string, source: RouteResult['source'],
  patient?: { id: string; name: string | null }
): Promise<string> {
  const existing = await queryOne<{ id: string; contact_name: string | null; patient_id: string | null }>(
    'SELECT id, contact_name, patient_id FROM whatsapp_conversations WHERE clinic_id = $1 AND phone = $2', [clinicId, phone]
  )
  if (existing) {
    // Una conversación creada antes de saber que este número era paciente
    // (o antes de que existiera esta función) se completa a posteriori, sin
    // pisar un contact_name puesto a mano por la clínica.
    if (patient && !existing.patient_id) {
      await query(
        'UPDATE whatsapp_conversations SET patient_id = $1, contact_name = COALESCE(contact_name, $2) WHERE id = $3',
        [patient.id, patient.name, existing.id]
      )
    }
    return existing.id
  }
  const created = await queryOne<{ id: string }>(
    `INSERT INTO whatsapp_conversations (clinic_id, phone, source, status, patient_id, contact_name) VALUES ($1,$2,$3,'activa',$4,$5) RETURNING id`,
    [clinicId, phone, source, patient?.id ?? null, patient?.name ?? null]
  )
  return created!.id
}
