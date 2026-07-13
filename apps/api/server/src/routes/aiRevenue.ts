import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { manualAdjustment } from '../lib/creditService'

const router = Router()

// GET /api/admin/ai-revenue — listado general (solo superadmin)
router.get('/', async (req, res) => {
  const { date_from, date_to, sort } = req.query
  try {
    let sql = `
      SELECT
        c.id AS clinic_id, c.name, c.trade_name,
        COALESCE(a.balance_cents, 0) AS balance_cents,
        COALESCE(a.auto_recharge, false) AS auto_recharge,
        (SELECT COALESCE(SUM(amount_cents), 0) FROM credit_transactions t
          WHERE t.clinic_id = c.id AND t.transaction_type IN ('recarga', 'recarga_automatica')
          ${date_from ? 'AND t.created_at >= $1' : ''} ${date_to ? `AND t.created_at < $${date_from ? 2 : 1}::date + INTERVAL '1 day'` : ''}
        ) AS total_recharged_cents,
        (SELECT MAX(created_at) FROM credit_transactions t
          WHERE t.clinic_id = c.id AND t.transaction_type IN ('recarga', 'recarga_automatica')
        ) AS last_recharge_at
      FROM clinics c
      LEFT JOIN clinic_credit_accounts a ON a.clinic_id = c.id
    `
    const params: any[] = []
    if (date_from) params.push(date_from)
    if (date_to) params.push(date_to)
    sql += sort === 'balance_asc' ? ' ORDER BY balance_cents ASC' : ' ORDER BY balance_cents DESC'

    const rows = await query(sql, params)
    return res.json(rows)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/admin/ai-revenue/integrity-alarms — alarmas de integridad sin resolver
router.get('/integrity-alarms', async (_req, res) => {
  try {
    const rows = await query(
      `SELECT al.*, c.name AS clinic_name FROM credit_integrity_alarms al
       JOIN clinics c ON c.id = al.clinic_id
       WHERE al.resolved_at IS NULL ORDER BY al.detected_at DESC`
    )
    return res.json(rows)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/admin/ai-revenue/integrity-alarms/:id/resolve — marca revisada
// (no toca el saldo — la corrección, si procede, se hace con un ajuste
// manual aparte, siempre con motivo, nunca automáticamente).
router.post('/integrity-alarms/:id/resolve', async (req, res) => {
  const { userId } = (req as any).user
  const { notes } = req.body
  if (!notes?.trim()) return res.status(400).json({ error: 'El motivo de la resolución es obligatorio' })
  try {
    const updated = await queryOne(
      `UPDATE credit_integrity_alarms SET resolved_at = NOW(), resolved_by = $1, resolution_notes = $2
       WHERE id = $3 AND resolved_at IS NULL RETURNING *`,
      [userId, notes.trim(), req.params.id]
    )
    if (!updated) return res.status(404).json({ error: 'Alarma no encontrada o ya resuelta' })
    return res.json(updated)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/admin/ai-revenue/:clinicId/adjust — ajuste manual de saldo
router.post('/:clinicId/adjust', async (req, res) => {
  const { userId } = (req as any).user
  const { amountCents, notes } = req.body
  try {
    const newBalance = await manualAdjustment(req.params.clinicId, Number(amountCents), notes, userId)
    return res.json({ balanceCents: newBalance })
  } catch (err: any) { return res.status(400).json({ error: err.message }) }
})

// GET /api/admin/ai-revenue/:clinicId — detalle con desglose por servicio
router.get('/:clinicId', async (req, res) => {
  const { clinicId } = req.params
  try {
    const clinic = await queryOne('SELECT id, name, trade_name FROM clinics WHERE id = $1', [clinicId])
    if (!clinic) return res.status(404).json({ error: 'Clínica no encontrada' })
    const account = await queryOne('SELECT * FROM clinic_credit_accounts WHERE clinic_id = $1', [clinicId])

    const byService = await query(
      `SELECT
         service,
         COALESCE(SUM(real_cost_cents), 0) AS real_cost_cents,
         COALESCE(SUM(-amount_cents), 0) AS charged_cents
       FROM credit_transactions
       WHERE clinic_id = $1 AND transaction_type = 'consumo' AND service IS NOT NULL
       GROUP BY service`,
      [clinicId]
    )

    const monthToDate = await queryOne<{ real_cost_cents: string; charged_cents: string }>(
      `SELECT COALESCE(SUM(real_cost_cents), 0) AS real_cost_cents, COALESCE(SUM(-amount_cents), 0) AS charged_cents
       FROM credit_transactions
       WHERE clinic_id = $1 AND transaction_type = 'consumo' AND created_at >= date_trunc('month', NOW())`,
      [clinicId]
    )

    const historicTotals = await queryOne<{ real_cost_cents: string; charged_cents: string }>(
      `SELECT COALESCE(SUM(real_cost_cents), 0) AS real_cost_cents, COALESCE(SUM(-amount_cents), 0) AS charged_cents
       FROM credit_transactions WHERE clinic_id = $1 AND transaction_type = 'consumo'`,
      [clinicId]
    )

    // Evolución mensual por servicio (últimos 12 meses)
    const monthlyEvolution = await query(
      `SELECT date_trunc('month', created_at) AS month, service,
              COALESCE(SUM(real_cost_cents), 0) AS real_cost_cents,
              COALESCE(SUM(-amount_cents), 0) AS charged_cents
       FROM credit_transactions
       WHERE clinic_id = $1 AND transaction_type = 'consumo' AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY 1, 2 ORDER BY 1 ASC`,
      [clinicId]
    )

    const transactions = await query(
      'SELECT * FROM credit_transactions WHERE clinic_id = $1 ORDER BY created_at DESC LIMIT 500',
      [clinicId]
    )

    return res.json({
      clinic, account, byService,
      monthToDate: {
        realCostCents: Number(monthToDate?.real_cost_cents ?? 0),
        chargedCents: Number(monthToDate?.charged_cents ?? 0),
        profitCents: Number(monthToDate?.charged_cents ?? 0) - Number(monthToDate?.real_cost_cents ?? 0),
      },
      historicTotals: {
        realCostCents: Number(historicTotals?.real_cost_cents ?? 0),
        chargedCents: Number(historicTotals?.charged_cents ?? 0),
        profitCents: Number(historicTotals?.charged_cents ?? 0) - Number(historicTotals?.real_cost_cents ?? 0),
      },
      monthlyEvolution,
      transactions,
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
