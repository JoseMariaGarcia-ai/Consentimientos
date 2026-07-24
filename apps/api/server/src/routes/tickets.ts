import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { sendTicketConfirmationEmail, sendTicketResolvedEmail } from '../lib/ticketEmail'

const router = Router()

async function me(req: any) {
  const { userId } = req.user
  return queryOne<{ clinic_id: string | null; role: string }>(
    'SELECT clinic_id, role FROM app_users WHERE id = $1', [userId]
  )
}

// GET /api/tickets — superadmin sees every clinic's tickets; everyone else
// only sees their own clinic's.
router.get('/', async (req, res) => {
  try {
    const current = await me(req)
    if (!current) return res.status(403).json({ error: 'Usuario no encontrado' })

    const isSuperAdmin = current.role === 'superadmin'
    if (!isSuperAdmin && !current.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })

    const sql = `
      SELECT t.*, row_to_json(u) AS reporter, c.name AS clinic_name, c.trade_name AS clinic_trade_name
      FROM support_tickets t
      LEFT JOIN app_users u ON u.id = t.created_by
      JOIN clinics c ON c.id = t.clinic_id
      ${isSuperAdmin ? '' : 'WHERE t.clinic_id = $1'}
      ORDER BY t.created_at DESC
    `
    const data = await query(sql, isSuperAdmin ? [] : [current.clinic_id])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/tickets/open-count — lightweight count for the sidebar badge.
router.get('/open-count', async (req, res) => {
  try {
    const current = await me(req)
    if (!current) return res.status(403).json({ error: 'Usuario no encontrado' })
    const isSuperAdmin = current.role === 'superadmin'
    if (!isSuperAdmin && !current.clinic_id) return res.json({ count: 0 })

    const row = await queryOne<{ count: string }>(
      isSuperAdmin
        ? `SELECT COUNT(*) AS count FROM support_tickets WHERE status = 'open'`
        : `SELECT COUNT(*) AS count FROM support_tickets WHERE status = 'open' AND clinic_id = $1`,
      isSuperAdmin ? [] : [current.clinic_id]
    )
    return res.json({ count: parseInt(row?.count ?? '0') })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/tickets — any clinic-staff user reports an incident for their own clinic.
router.post('/', async (req, res) => {
  const { subject, description } = req.body
  if (!subject || !description) return res.status(400).json({ error: 'subject y description son obligatorios' })
  try {
    const current = await me(req)
    if (!current?.clinic_id) return res.status(403).json({ error: 'Usuario sin clínica asignada' })

    const { userId } = (req as any).user
    const data = await queryOne(
      `INSERT INTO support_tickets (clinic_id, created_by, subject, description) VALUES ($1,$2,$3,$4) RETURNING *`,
      [current.clinic_id, userId, subject, description]
    )

    sendTicketConfirmationEmail({ ticketId: (data as any).id, clinicId: current.clinic_id })
      .catch(err => console.error('[ticketEmail] confirmation send failed:', err.message))

    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/tickets/:id — superadmin only: toggle resolved / reopen y/o
// anotar notas internas (qué se ha hecho, qué ha sucedido). status es
// opcional para poder guardar solo las notas sin tocar el estado.
router.put('/:id', async (req, res) => {
  const { status, notes } = req.body
  if (status !== undefined && !['open', 'resolved'].includes(status)) {
    return res.status(400).json({ error: 'status inválido' })
  }
  try {
    const current = await me(req)
    if (current?.role !== 'superadmin') return res.status(403).json({ error: 'Solo superadmin' })
    const { userId } = (req as any).user

    const existing = await queryOne<{ status: string }>('SELECT status FROM support_tickets WHERE id = $1', [req.params.id])
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' })

    const nextStatus = status ?? existing.status
    const becameResolved = nextStatus === 'resolved' && existing.status !== 'resolved'

    // resolved_at/resolved_by solo se tocan al transicionar de estado (no al
    // reguardar notas sobre un ticket que ya estaba resuelto).
    const data = becameResolved
      ? await queryOne<any>(
          `UPDATE support_tickets SET status=$1, resolved_at=$2, resolved_by=$3, notes=COALESCE($4, notes) WHERE id=$5 RETURNING *`,
          [nextStatus, new Date().toISOString(), userId, notes ?? null, req.params.id]
        )
      : nextStatus === 'open'
      ? await queryOne<any>(
          `UPDATE support_tickets SET status=$1, resolved_at=NULL, resolved_by=NULL, notes=COALESCE($2, notes) WHERE id=$3 RETURNING *`,
          [nextStatus, notes ?? null, req.params.id]
        )
      : await queryOne<any>(
          `UPDATE support_tickets SET status=$1, notes=COALESCE($2, notes) WHERE id=$3 RETURNING *`,
          [nextStatus, notes ?? null, req.params.id]
        )
    if (!data) return res.status(404).json({ error: 'Ticket no encontrado' })

    if (becameResolved) {
      sendTicketResolvedEmail({ ticketId: data.id }).catch(err => console.error('[ticketEmail] resolved send failed:', err.message))
    }

    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
