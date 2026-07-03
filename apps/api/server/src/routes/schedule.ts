import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

async function getClinicId(userId: string): Promise<string> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  if (!row?.clinic_id) throw new Error('Clinic not found')
  return row.clinic_id
}

// GET /api/schedule/patterns — always returns all 7 weekdays (closed defaults for gaps)
router.get('/patterns', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const rows = await query<any>('SELECT * FROM schedule_patterns WHERE clinic_id = $1', [clinicId])
    const byWeekday = Object.fromEntries(rows.map((r: any) => [r.weekday, r]))
    const full = Array.from({ length: 7 }, (_, weekday) => byWeekday[weekday] ?? { weekday, is_open: false, time_ranges: [] })
    return res.json(full)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/schedule/patterns — bulk apply the same config to several weekdays at once
router.put('/patterns', async (req, res) => {
  const { userId } = (req as any).user
  const { weekdays, is_open, time_ranges } = req.body as { weekdays: number[]; is_open: boolean; time_ranges: any[] }
  if (!Array.isArray(weekdays) || weekdays.length === 0) return res.status(400).json({ error: 'weekdays requerido' })
  try {
    const clinicId = await getClinicId(userId)
    const results = []
    for (const weekday of weekdays) {
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) continue
      const data = await queryOne(
        `INSERT INTO schedule_patterns (clinic_id, weekday, is_open, time_ranges)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (clinic_id, weekday) DO UPDATE SET is_open=$3, time_ranges=$4, updated_at=NOW()
         RETURNING *`,
        [clinicId, weekday, !!is_open, JSON.stringify(time_ranges ?? [])]
      )
      results.push(data)
    }
    return res.json(results)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/schedule/patterns/:weekday — fine-tune a single weekday
router.put('/patterns/:weekday', async (req, res) => {
  const { userId } = (req as any).user
  const weekday = Number(req.params.weekday)
  const { is_open, time_ranges } = req.body
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return res.status(400).json({ error: 'weekday inválido' })
  try {
    const clinicId = await getClinicId(userId)
    const data = await queryOne(
      `INSERT INTO schedule_patterns (clinic_id, weekday, is_open, time_ranges)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (clinic_id, weekday) DO UPDATE SET is_open=$3, time_ranges=$4, updated_at=NOW()
       RETURNING *`,
      [clinicId, weekday, !!is_open, JSON.stringify(time_ranges ?? [])]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/schedule/exceptions?from=&to=
router.get('/exceptions', async (req, res) => {
  const { userId } = (req as any).user
  const { from, to } = req.query
  try {
    const clinicId = await getClinicId(userId)
    let sql = 'SELECT * FROM schedule_exceptions WHERE clinic_id = $1'
    const params: any[] = [clinicId]
    if (from) { params.push(from); sql += ` AND date >= $${params.length}` }
    if (to)   { params.push(to);   sql += ` AND date < $${params.length}` }
    sql += ' ORDER BY date ASC'
    const rows = await query(sql, params)
    return res.json(rows)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/schedule/exceptions — upsert one specific date (open special / closed override)
router.post('/exceptions', async (req, res) => {
  const { userId } = (req as any).user
  const { date, is_open, time_ranges, notes } = req.body
  if (!date) return res.status(400).json({ error: 'date requerida' })
  try {
    const clinicId = await getClinicId(userId)
    const data = await queryOne(
      `INSERT INTO schedule_exceptions (clinic_id, date, is_open, time_ranges, notes)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (clinic_id, date) DO UPDATE SET is_open=$3, time_ranges=$4, notes=$5
       RETURNING *`,
      [clinicId, date, !!is_open, JSON.stringify(time_ranges ?? []), notes ?? null]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/schedule/exceptions/:id — revert that date back to the weekly pattern
router.delete('/exceptions/:id', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const data = await queryOne(
      'DELETE FROM schedule_exceptions WHERE id=$1 AND clinic_id=$2 RETURNING id',
      [req.params.id, clinicId]
    )
    if (!data) return res.status(404).json({ error: 'No encontrado' })
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/schedule/availability?from=YYYY-MM-DD&to=YYYY-MM-DD
// Precomputed open/closed + hours per date in the range — single source of truth
// for both the month view highlighting and the day view slot restriction.
router.get('/availability', async (req, res) => {
  const { userId } = (req as any).user
  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'from y to requeridos' })
  try {
    const clinicId = await getClinicId(userId)
    const patterns = await query<any>('SELECT * FROM schedule_patterns WHERE clinic_id=$1', [clinicId])
    const patternByWeekday = Object.fromEntries(patterns.map((p: any) => [p.weekday, p]))
    const exceptions = await query<any>(
      `SELECT to_char(date, 'YYYY-MM-DD') AS date_key, is_open, time_ranges
       FROM schedule_exceptions WHERE clinic_id=$1 AND date >= $2 AND date < $3`,
      [clinicId, from, to]
    )
    const exceptionByDate = Object.fromEntries(exceptions.map((e: any) => [e.date_key, e]))

    const result: Record<string, { is_open: boolean; time_ranges: any[] }> = {}
    const start = new Date(`${from}T00:00:00`)
    const end = new Date(`${to}T00:00:00`)
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const exc = exceptionByDate[dateKey]
      if (exc) {
        result[dateKey] = { is_open: exc.is_open, time_ranges: exc.is_open ? exc.time_ranges : [] }
      } else {
        const pattern = patternByWeekday[d.getDay()]
        result[dateKey] = { is_open: !!pattern?.is_open, time_ranges: pattern?.is_open ? pattern.time_ranges : [] }
      }
    }
    return res.json(result)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
