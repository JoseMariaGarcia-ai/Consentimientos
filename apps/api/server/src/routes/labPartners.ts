import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

// List all lab partners with clinic count and campaign count
router.get('/', async (_req, res) => {
  try {
    const data = await query(
      `SELECT lp.*,
        (SELECT COUNT(*) FROM clinic_lab_partners clp WHERE clp.lab_partner_id = lp.id) AS clinic_count,
        (SELECT COUNT(*) FROM lab_ad_campaigns c WHERE c.lab_partner_id = lp.id) AS campaign_count
       FROM lab_partners lp ORDER BY lp.created_at DESC`
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Create lab partner
router.post('/', async (req, res) => {
  const b = req.body
  try {
    const data = await queryOne(
      `INSERT INTO lab_partners (name, email, phone, contact_person, logo_url, website, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [b.name, b.email, b.phone ?? null, b.contact_person ?? b.contactPerson ?? null, b.logo_url ?? b.logoUrl ?? null, b.website ?? null, b.notes ?? null]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Get one with assigned clinics and campaigns
router.get('/:id', async (req, res) => {
  try {
    const lab = await queryOne(`SELECT * FROM lab_partners WHERE id = $1`, [req.params.id])
    if (!lab) return res.status(404).json({ error: 'Laboratorio no encontrado' })
    const clinics = await query(
      `SELECT c.* FROM clinic_lab_partners clp JOIN clinics c ON c.id = clp.clinic_id WHERE clp.lab_partner_id = $1`,
      [req.params.id]
    )
    const campaigns = await query(`SELECT * FROM lab_ad_campaigns WHERE lab_partner_id = $1 ORDER BY created_at DESC`, [req.params.id])
    return res.json({ ...lab, clinics, campaigns })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Daily welcome/patient impression counts for the stats dashboard.
// Defaults to the current month when no from/to given.
router.get('/:id/media-stats', async (req, res) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string }
    const now = new Date()
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1)
    const toDate = to ? new Date(to) : now
    const toExclusive = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1)

    const rows = await query<{ day: string; media_type: string; count: string }>(
      `SELECT to_char(shown_at, 'YYYY-MM-DD') AS day, media_type, COUNT(*) AS count
       FROM media_impressions
       WHERE lab_partner_id = $1 AND shown_at >= $2 AND shown_at < $3
       GROUP BY day, media_type ORDER BY day`,
      [req.params.id, fromDate.toISOString(), toExclusive.toISOString()]
    )

    const byDay = new Map<string, { date: string; welcome: number; patient: number }>()
    for (const r of rows) {
      const entry = byDay.get(r.day) ?? { date: r.day, welcome: 0, patient: 0 }
      entry[r.media_type as 'welcome' | 'patient'] = parseInt(r.count, 10)
      byDay.set(r.day, entry)
    }
    const daily = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))
    const totals = daily.reduce(
      (acc, d) => ({ welcome: acc.welcome + d.welcome, patient: acc.patient + d.patient }),
      { welcome: 0, patient: 0 }
    )

    return res.json({
      daily,
      totals,
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Update
router.put('/:id', async (req, res) => {
  const b = req.body
  try {
    const data = await queryOne(
      `UPDATE lab_partners SET name=$1, email=$2, phone=$3, contact_person=$4, logo_url=$5, website=$6, notes=$7, is_active=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [b.name, b.email, b.phone ?? null, b.contact_person ?? b.contactPerson ?? null, b.logo_url ?? b.logoUrl ?? null, b.website ?? null, b.notes ?? null, b.is_active ?? true, req.params.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Soft delete
router.delete('/:id', async (req, res) => {
  try {
    await query('UPDATE lab_partners SET is_active=FALSE, updated_at=NOW() WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// List clinics assigned to lab
router.get('/:id/clinics', async (req, res) => {
  try {
    const data = await query(
      `SELECT c.*, clp.assigned_at FROM clinic_lab_partners clp JOIN clinics c ON c.id = clp.clinic_id WHERE clp.lab_partner_id = $1`,
      [req.params.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Assign clinic
router.post('/:id/clinics', async (req, res) => {
  const { clinic_id } = req.body
  try {
    const data = await queryOne(
      `INSERT INTO clinic_lab_partners (clinic_id, lab_partner_id) VALUES ($1,$2)
       ON CONFLICT (clinic_id, lab_partner_id) DO NOTHING RETURNING *`,
      [clinic_id, req.params.id]
    )
    return res.status(201).json(data ?? { assigned: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Unassign clinic
router.delete('/:id/clinics/:clinicId', async (req, res) => {
  try {
    await query('DELETE FROM clinic_lab_partners WHERE lab_partner_id = $1 AND clinic_id = $2', [req.params.id, req.params.clinicId])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// List campaigns
router.get('/:id/campaigns', async (req, res) => {
  try {
    const data = await query(`SELECT * FROM lab_ad_campaigns WHERE lab_partner_id = $1 ORDER BY created_at DESC`, [req.params.id])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Create campaign
router.post('/:id/campaigns', async (req, res) => {
  const b = req.body
  try {
    const data = await queryOne(
      `INSERT INTO lab_ad_campaigns (lab_partner_id, name, creative_type, creatives, rotation_mode, trigger_rule, trigger_interval_minutes, is_active, starts_at, ends_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.params.id,
        b.name,
        b.creative_type ?? b.creativeType ?? 'image',
        JSON.stringify(b.creatives ?? []),
        b.rotation_mode ?? b.rotationMode ?? 'random',
        b.trigger_rule ?? b.triggerRule ?? 'on_login',
        b.trigger_interval_minutes ?? b.triggerIntervalMinutes ?? null,
        b.is_active ?? true,
        b.starts_at ?? b.startsAt ?? null,
        b.ends_at ?? b.endsAt ?? null,
      ]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Update campaign
router.put('/:id/campaigns/:cid', async (req, res) => {
  const b = req.body
  try {
    const data = await queryOne(
      `UPDATE lab_ad_campaigns SET name=$1, creative_type=$2, creatives=$3, rotation_mode=$4, trigger_rule=$5, trigger_interval_minutes=$6, is_active=$7, starts_at=$8, ends_at=$9, updated_at=NOW()
       WHERE id=$10 AND lab_partner_id=$11 RETURNING *`,
      [
        b.name,
        b.creative_type ?? b.creativeType ?? 'image',
        JSON.stringify(b.creatives ?? []),
        b.rotation_mode ?? b.rotationMode ?? 'random',
        b.trigger_rule ?? b.triggerRule ?? 'on_login',
        b.trigger_interval_minutes ?? b.triggerIntervalMinutes ?? null,
        b.is_active ?? true,
        b.starts_at ?? b.startsAt ?? null,
        b.ends_at ?? b.endsAt ?? null,
        req.params.cid,
        req.params.id,
      ]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Delete campaign
router.delete('/:id/campaigns/:cid', async (req, res) => {
  try {
    await query('DELETE FROM lab_ad_campaigns WHERE id = $1 AND lab_partner_id = $2', [req.params.cid, req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
