import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()
export const webhookRouter = Router()

const YCLOUD_BASE = 'https://api.ycloud.com/v2'

async function getRequesterClinicId(req: any, targetClinicId?: string): Promise<{ clinicId: string | null; isSuperAdmin: boolean }> {
  const { userId } = req.user
  const me = await queryOne<{ clinic_id: string; role: string }>(
    'SELECT clinic_id, role FROM app_users WHERE id = $1', [userId]
  )
  if (!me) return { clinicId: null, isSuperAdmin: false }
  const isSuperAdmin = me.role === 'superadmin'
  if (isSuperAdmin && targetClinicId) return { clinicId: targetClinicId, isSuperAdmin }
  return { clinicId: me.clinic_id, isSuperAdmin }
}

async function getYCloudKey(clinicId: string): Promise<string | null> {
  const row = await queryOne<{ ycloud_api_key: string }>(
    'SELECT ycloud_api_key FROM clinic_api_config WHERE clinic_id = $1', [clinicId]
  )
  return row?.ycloud_api_key ?? null
}

// GET /api/whatsapp/clinics — clinics the requester can operate WhatsApp for
router.get('/clinics', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string; role: string }>('SELECT clinic_id, role FROM app_users WHERE id = $1', [userId])
    if (!me) return res.json([])
    if (me.role === 'superadmin') {
      const data = await query('SELECT id, name, trade_name FROM clinics ORDER BY name')
      return res.json(data)
    }
    if (!me.clinic_id) return res.json([])
    const data = await query('SELECT id, name, trade_name FROM clinics WHERE id = $1', [me.clinic_id])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/status?clinicId=xxx — whether YCloud is configured for this clinic
router.get('/status', async (req, res) => {
  try {
    const { clinicId } = await getRequesterClinicId(req, req.query.clinicId as string)
    if (!clinicId) return res.status(403).json({ error: 'Sin acceso' })
    const key = await getYCloudKey(clinicId)
    return res.json({ configured: !!key })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/conversations?clinicId=xxx
router.get('/conversations', async (req, res) => {
  try {
    const { clinicId } = await getRequesterClinicId(req, req.query.clinicId as string)
    if (!clinicId) return res.status(403).json({ error: 'Sin acceso' })
    const data = await query(
      `SELECT * FROM whatsapp_conversations WHERE clinic_id = $1 ORDER BY last_message_at DESC`,
      [clinicId]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/whatsapp/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const { clinicId } = await getRequesterClinicId(req, req.query.clinicId as string)
    if (!clinicId) return res.status(403).json({ error: 'Sin acceso' })
    const convo = await queryOne('SELECT id FROM whatsapp_conversations WHERE id = $1 AND clinic_id = $2', [req.params.id, clinicId])
    if (!convo) return res.status(404).json({ error: 'Conversación no encontrada' })
    const data = await query(
      `SELECT * FROM whatsapp_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    )
    await query('UPDATE whatsapp_conversations SET unread_count = 0 WHERE id = $1', [req.params.id])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/whatsapp/send — { clinicId, phone, body, contactName? }
router.post('/send', async (req, res) => {
  try {
    const { phone, body, contactName, targetClinicId } = req.body
    if (!phone || !body) return res.status(400).json({ error: 'phone y body requeridos' })

    const { clinicId } = await getRequesterClinicId(req, targetClinicId)
    if (!clinicId) return res.status(403).json({ error: 'Sin acceso' })

    const apiKey = await getYCloudKey(clinicId)
    if (!apiKey) return res.status(400).json({ error: 'YCloud no está configurado para esta clínica. Añade la API Key en Configuración → Claves.' })

    // Ensure conversation exists
    let convo = await queryOne<{ id: string }>(
      'SELECT id FROM whatsapp_conversations WHERE clinic_id = $1 AND phone = $2', [clinicId, phone]
    )
    if (!convo) {
      convo = await queryOne<{ id: string }>(
        `INSERT INTO whatsapp_conversations (clinic_id, phone, contact_name) VALUES ($1,$2,$3) RETURNING id`,
        [clinicId, phone, contactName ?? null]
      )
    }

    // Send via YCloud API
    let ycloudId: string | null = null
    let status = 'sent'
    try {
      const resp = await fetch(`${YCLOUD_BASE}/whatsapp/messages`, {
        method: 'POST',
        headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.YCLOUD_WA_NUMBER ?? undefined,
          to: phone,
          type: 'text',
          text: { body },
        }),
      })
      const json: any = await resp.json().catch(() => ({}))
      if (!resp.ok) {
        status = 'failed'
      } else {
        ycloudId = json?.id ?? null
      }
    } catch {
      status = 'failed'
    }

    const message = await queryOne(
      `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, ycloud_id)
       VALUES ($1,$2,'outbound',$3,$4,$5) RETURNING *`,
      [convo!.id, clinicId, body, status, ycloudId]
    )

    await query(
      `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1 WHERE id = $2`,
      [body.slice(0, 120), convo!.id]
    )

    if (status === 'failed') {
      return res.status(502).json({ error: 'Fallo al enviar el mensaje por YCloud', message })
    }
    return res.status(201).json(message)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/whatsapp-webhook/:clinicId — YCloud inbound webhook (public, no auth)
webhookRouter.post('/:clinicId', async (req, res) => {
  try {
    const clinicId = req.params.clinicId
    const payload = req.body
    const msg = payload?.whatsappInboundMessage ?? payload
    const phone = msg?.from
    const text = msg?.text?.body ?? msg?.body ?? ''
    if (!phone) return res.status(200).json({ ok: true })

    let convo = await queryOne<{ id: string }>(
      'SELECT id FROM whatsapp_conversations WHERE clinic_id = $1 AND phone = $2', [clinicId, phone]
    )
    if (!convo) {
      convo = await queryOne<{ id: string }>(
        `INSERT INTO whatsapp_conversations (clinic_id, phone) VALUES ($1,$2) RETURNING id`,
        [clinicId, phone]
      )
    }

    await query(
      `INSERT INTO whatsapp_messages (conversation_id, clinic_id, direction, body, status, ycloud_id)
       VALUES ($1,$2,'inbound',$3,'received',$4)`,
      [convo!.id, clinicId, text, msg?.id ?? null]
    )
    await query(
      `UPDATE whatsapp_conversations SET last_message_at = NOW(), last_message_preview = $1, unread_count = unread_count + 1 WHERE id = $2`,
      [text.slice(0, 120), convo!.id]
    )

    return res.status(200).json({ ok: true })
  } catch (err: any) { return res.status(200).json({ ok: true }) }
})

export default router
