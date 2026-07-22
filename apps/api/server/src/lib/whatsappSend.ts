import { query, queryOne } from './db'

// Primitivas de envío por YCloud, compartidas entre las rutas del panel de
// WhatsApp (routes/whatsapp.ts) y los avisos automáticos al paciente que se
// mandan también por WhatsApp cuando la clínica tiene el plan y la opción
// activados (lib/patientWhatsAppNotify.ts) — antes vivían solo dentro de
// routes/whatsapp.ts, sin poder reutilizarse desde fuera de ese fichero.

export const YCLOUD_BASE = 'https://api.ycloud.com/v2'

// Ya no existe una clave de YCloud por clínica configurable (ver migración
// 063) — se usa siempre la clave única de sistema. Se mantiene la consulta
// a clinic_api_config.ycloud_api_key solo como compatibilidad hacia atrás,
// por si alguna clínica conservase un valor antiguo de cuando sí existía
// ese campo; en la práctica, hoy siempre cae en la clave compartida.
export async function getYCloudKey(clinicId: string): Promise<string | null> {
  const row = await queryOne<{ ycloud_api_key: string }>(
    'SELECT ycloud_api_key FROM clinic_api_config WHERE clinic_id = $1', [clinicId]
  )
  if (row?.ycloud_api_key) return row.ycloud_api_key
  return getSharedYCloudKey()
}

// Número único de YCloud compartido por todas las clínicas (Parte A).
export async function getSharedYCloudKey(): Promise<string | null> {
  const row = await queryOne<{ value: string }>("SELECT value FROM system_settings WHERE key = 'shared_ycloud_api_key'")
  return row?.value?.trim() ? row.value : null
}

// WhatsApp/Meta solo permite mensajes de texto libre dentro de las 24h
// siguientes al último mensaje ENTRANTE del cliente ("ventana de servicio").
// Fuera de esa ventana, cualquier mensaje de texto normal es rechazado o no
// se entrega — hay que usar una plantilla (HSM) previamente aprobada.
export async function hasOpenSessionWindow(phone: string): Promise<boolean> {
  const row = await queryOne<{ last_inbound: string | null }>(
    `SELECT MAX(wm.created_at) AS last_inbound
     FROM whatsapp_messages wm
     JOIN whatsapp_conversations wc ON wc.id = wm.conversation_id
     WHERE wc.phone = $1 AND wm.direction = 'inbound'`,
    [phone]
  )
  if (!row?.last_inbound) return false
  const elapsedMs = Date.now() - new Date(row.last_inbound).getTime()
  return elapsedMs < 24 * 60 * 60 * 1000
}

// Envío efectivo a YCloud + persistencia — compartido entre el envío manual
// (POST /send) y la respuesta automática del agente de IA.
export async function sendViaYCloud(
  apiKey: string, clinicId: string | null, conversationId: string, phone: string, body: string,
  sender: 'clinica' | 'ia' | 'admin' = 'clinica'
) {
  let ycloudId: string | null = null
  let status = 'sent'
  let failureReason: string | null = null
  // Si falta esta variable de entorno, JSON.stringify elimina la clave
  // "from" por completo (undefined no se serializa) y YCloud responde con
  // un genérico "one or more of the parameters is missing" — se comprueba
  // aparte para que el motivo real quede claro sin tener que adivinarlo.
  if (!process.env.YCLOUD_WA_NUMBER?.trim()) {
    console.error('[whatsapp] falta la variable de entorno YCLOUD_WA_NUMBER — no se puede enviar ningún mensaje saliente')
    const message = await queryOne(
      `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, sender)
       VALUES ($1,$2,'outbound',$3,'failed',$4) RETURNING *`,
      [conversationId, clinicId, body, sender]
    )
    return { message, status: 'failed', failureReason: 'Falta configurar YCLOUD_WA_NUMBER en las variables de entorno del backend' }
  }
  try {
    const resp = await fetch(`${YCLOUD_BASE}/whatsapp/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.YCLOUD_WA_NUMBER, to: phone, type: 'text', text: { body } }),
    })
    const json: any = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      status = 'failed'
      failureReason = json?.message ?? json?.error?.message ?? `HTTP ${resp.status}`
      console.error(`[whatsapp] YCloud rechazó el envío a ${phone} (HTTP ${resp.status}):`, JSON.stringify(json))
    } else {
      ycloudId = json?.id ?? null
    }
  } catch (err: any) {
    status = 'failed'
    failureReason = err.message
    console.error(`[whatsapp] fallo de red enviando a ${phone}:`, err.message)
  }
  const message = await queryOne(
    `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, ycloud_id, sender)
     VALUES ($1,$2,'outbound',$3,$4,$5,$6) RETURNING *`,
    [conversationId, clinicId, body, status, ycloudId, sender]
  )
  await query(
    `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1 WHERE id = $2`,
    [body.slice(0, 120), conversationId]
  )
  return { message, status, failureReason }
}

export interface TemplateVariable { name: string; value: string }

// Envío GENÉRICO de mensaje de PLANTILLA (HSM) — única vía válida para
// escribir a un número fuera de la ventana de 24h, o para los avisos
// automáticos al paciente (que casi nunca tienen ventana abierta, al ser
// la clínica quien inicia el contacto). Formato asumido de WhatsApp Cloud
// API con variables nombradas, que YCloud replica (confirmado con la
// plantilla contacto_consentspro ya en uso). La plantilla debe existir y
// estar APROBADA en YCloud antes de usarse, o YCloud devolverá error.
//
// savedBody es el texto legible que queda guardado en el panel — WhatsApp
// no expone el render final de la plantilla ya rellena, así que se
// reconstruye aquí mismo con las variables ya sustituidas.
export async function sendWhatsAppTemplate(
  apiKey: string, clinicId: string | null, conversationId: string, phone: string,
  templateName: string, lang: string, variables: TemplateVariable[], savedBody: string,
  sender: 'clinica' | 'ia' | 'admin' = 'clinica'
) {
  let ycloudId: string | null = null
  let status = 'sent'
  let failureReason: string | null = null
  if (!process.env.YCLOUD_WA_NUMBER?.trim()) {
    console.error('[whatsapp] falta la variable de entorno YCLOUD_WA_NUMBER — no se puede enviar la plantilla')
    const message = await queryOne(
      `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, sender)
       VALUES ($1,$2,'outbound',$3,'failed',$4) RETURNING *`,
      [conversationId, clinicId, savedBody, sender]
    )
    return { message, status: 'failed', failureReason: 'Falta configurar YCLOUD_WA_NUMBER en las variables de entorno del backend' }
  }
  try {
    const resp = await fetch(`${YCLOUD_BASE}/whatsapp/messages`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.YCLOUD_WA_NUMBER,
        to: phone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: lang },
          components: [{
            type: 'body',
            parameters: variables.map(v => ({ type: 'text', parameter_name: v.name, text: v.value })),
          }],
        },
      }),
    })
    const json: any = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      status = 'failed'
      failureReason = json?.message ?? json?.error?.message ?? `HTTP ${resp.status}`
      console.error(`[whatsapp] YCloud rechazó el envío de la plantilla "${templateName}" a ${phone} (HTTP ${resp.status}):`, JSON.stringify(json))
    } else {
      ycloudId = json?.id ?? null
    }
  } catch (err: any) {
    status = 'failed'
    failureReason = err.message
    console.error(`[whatsapp] fallo de red enviando plantilla "${templateName}" a ${phone}:`, err.message)
  }
  const message = await queryOne(
    `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, ycloud_id, sender)
     VALUES ($1,$2,'outbound',$3,$4,$5,$6) RETURNING *`,
    [conversationId, clinicId, savedBody, status, ycloudId, sender]
  )
  await query(
    `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1 WHERE id = $2`,
    [savedBody.slice(0, 120), conversationId]
  )
  return { message, status, failureReason }
}

// Busca (o crea) la conversación de esta clínica con este número — mismo
// patrón que ya usaba POST /send inline, ahora reutilizable también desde
// los avisos automáticos al paciente.
export async function ensureClinicConversation(
  clinicId: string, phone: string, patientId?: string | null, contactName?: string | null
): Promise<string> {
  const existing = await queryOne<{ id: string; patient_id: string | null; contact_name: string | null }>(
    'SELECT id, patient_id, contact_name FROM whatsapp_conversations WHERE clinic_id = $1 AND phone = $2', [clinicId, phone]
  )
  if (existing) {
    if (patientId && !existing.patient_id) {
      await query(
        'UPDATE whatsapp_conversations SET patient_id = $1, contact_name = COALESCE(contact_name, $2) WHERE id = $3',
        [patientId, contactName ?? null, existing.id]
      )
    }
    return existing.id
  }
  const created = await queryOne<{ id: string }>(
    `INSERT INTO whatsapp_conversations (clinic_id, phone, patient_id, contact_name, source) VALUES ($1,$2,$3,$4,'mensaje_saliente_clinica') RETURNING id`,
    [clinicId, phone, patientId ?? null, contactName ?? null]
  )
  return created!.id
}
