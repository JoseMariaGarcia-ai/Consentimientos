import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

// El catálogo de laboratorios es una entidad de plataforma, no de una
// clínica — a diferencia de /api/users o /api/plan-permissions (donde
// "admin" gestiona SU clínica), aquí solo superadmin tiene autoridad, igual
// que en /api/workflows y /api/analytics.
function isPlatformAdmin(role: string) {
  return role === 'superadmin'
}

async function getRequester(req: any): Promise<{ role: string; labPartnerId: string | null } | null> {
  const { userId } = req.user
  const me = await queryOne<{ role: string; lab_partner_id: string | null }>(
    'SELECT role, lab_partner_id FROM app_users WHERE id = $1', [userId]
  )
  if (!me) return null
  return { role: me.role, labPartnerId: me.lab_partner_id }
}

// El catálogo de laboratorios (y a qué clínicas están asignados) es un dato
// compartido de toda la plataforma, no de una clínica concreta — crear,
// editar o borrar laboratorios, o (des)asignarlos a clínicas, es exclusivo
// de admin/superadmin.
async function requirePlatformAdmin(req: any, res: any, next: any) {
  const me = await getRequester(req)
  if (!me || !isPlatformAdmin(me.role)) return res.status(403).json({ error: 'Sin acceso' })
  next()
}

// Gestionar las campañas o el perfil de UN laboratorio concreto: admin/
// superadmin, o el propio usuario lab_partner sobre su propio lab_partner_id
// — antes cualquier usuario autenticado podía tocar los de otro laboratorio
// con solo cambiar el :id de la URL.
async function requireLabAccess(req: any, res: any, next: any) {
  const me = await getRequester(req)
  if (!me) return res.status(403).json({ error: 'Sin acceso' })
  if (isPlatformAdmin(me.role) || (me.role === 'lab_partner' && me.labPartnerId === req.params.id)) return next()
  return res.status(403).json({ error: 'Sin acceso' })
}

// List all lab partners with clinic count and campaign count
router.get('/', requirePlatformAdmin, async (_req, res) => {
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
router.post('/', requirePlatformAdmin, async (req, res) => {
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

// GET /api/lab-partners/campaigns/active — vista de la CLÍNICA: solo las
// campañas activas del ÚNICO laboratorio al que esta clínica está
// vinculada, nunca las de otro laboratorio — misma garantía de aislamiento
// que ya usa /api/media (resolveOwner) para bienvenida/contenido paciente.
// Registrada antes de /:id para que no quede capturada por esa ruta.
router.get('/campaigns/active', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.json([])
    const link = await queryOne<{ lab_partner_id: string }>(
      'SELECT lab_partner_id FROM clinic_lab_partners WHERE clinic_id = $1 ORDER BY assigned_at ASC LIMIT 1',
      [me.clinic_id]
    )
    if (!link) return res.json([])
    const campaigns = await query(
      `SELECT id, name, creative_type, creatives, rotation_mode, trigger_rule, trigger_interval_minutes
       FROM lab_ad_campaigns
       WHERE lab_partner_id = $1 AND is_active = true
         AND (starts_at IS NULL OR starts_at <= NOW())
         AND (ends_at IS NULL OR ends_at >= NOW())
       ORDER BY created_at ASC`,
      [link.lab_partner_id]
    )
    return res.json(campaigns)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/lab-partners/campaigns/:id/impression — la clínica confirma que
// mostró una campaña, para las estadísticas del laboratorio. Verifica que
// la campaña pertenezca de verdad al laboratorio vinculado a ESTA clínica
// antes de registrar nada — la misma garantía de aislamiento que el GET.
router.post('/campaigns/:id/impression', async (req, res) => {
  try {
    const { userId } = (req as any).user
    const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(400).json({ error: 'Usuario sin clínica asignada' })
    const campaign = await queryOne<{ lab_partner_id: string }>('SELECT lab_partner_id FROM lab_ad_campaigns WHERE id = $1', [req.params.id])
    if (!campaign) return res.status(404).json({ error: 'Campaña no encontrada' })
    const link = await queryOne<{ lab_partner_id: string }>(
      'SELECT lab_partner_id FROM clinic_lab_partners WHERE clinic_id = $1 AND lab_partner_id = $2',
      [me.clinic_id, campaign.lab_partner_id]
    )
    if (!link) return res.status(403).json({ error: 'Esta campaña no pertenece al laboratorio de tu clínica' })
    await query(
      `INSERT INTO media_impressions (clinic_id, lab_partner_id, media_type, campaign_id) VALUES ($1,$2,'campaign',$3)`,
      [me.clinic_id, campaign.lab_partner_id, req.params.id]
    )
    return res.status(201).json({ logged: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Get one with assigned clinics and campaigns
router.get('/:id', requireLabAccess, async (req, res) => {
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

// Estadísticas de publicidad para el panel del laboratorio: bienvenida y
// contenido para paciente (en pantalla vs. enviado por email), tiempo medio
// de visualización en pantalla, y desglose por clínica vinculada. Las
// campañas (lab_ad_campaigns) quedan fuera deliberadamente — se gestionan
// aparte y no forman parte de estas estadísticas. Por defecto, mes en curso.
function seriesKey(mediaType: string, channel: string): 'welcome_screen' | 'patient_screen' | 'patient_email' | null {
  if (mediaType === 'welcome' && channel === 'screen') return 'welcome_screen'
  if (mediaType === 'patient' && channel === 'screen') return 'patient_screen'
  if (mediaType === 'patient' && channel === 'email') return 'patient_email'
  return null
}

router.get('/:id/media-stats', requireLabAccess, async (req, res) => {
  try {
    const { from, to } = req.query as { from?: string; to?: string }
    const now = new Date()
    const fromDate = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1)
    const toDate = to ? new Date(to) : now
    const toExclusive = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate() + 1)
    const params = [req.params.id, fromDate.toISOString(), toExclusive.toISOString()]

    const dailyRows = await query<{ day: string; media_type: string; channel: string; count: string }>(
      `SELECT to_char(shown_at, 'YYYY-MM-DD') AS day, media_type, channel, COUNT(*) AS count
       FROM media_impressions
       WHERE lab_partner_id = $1 AND media_type IN ('welcome','patient') AND shown_at >= $2 AND shown_at < $3
       GROUP BY day, media_type, channel ORDER BY day`,
      params
    )
    const byDay = new Map<string, { date: string; welcome_screen: number; patient_screen: number; patient_email: number }>()
    for (const r of dailyRows) {
      const key = seriesKey(r.media_type, r.channel)
      if (!key) continue
      const entry = byDay.get(r.day) ?? { date: r.day, welcome_screen: 0, patient_screen: 0, patient_email: 0 }
      entry[key] = parseInt(r.count, 10)
      byDay.set(r.day, entry)
    }
    const daily = [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date))
    const totals = daily.reduce(
      (acc, d) => ({
        welcome_screen: acc.welcome_screen + d.welcome_screen,
        patient_screen: acc.patient_screen + d.patient_screen,
        patient_email: acc.patient_email + d.patient_email,
      }),
      { welcome_screen: 0, patient_screen: 0, patient_email: 0 }
    )

    const durationRows = await query<{ media_type: string; avg_seconds: string | null; measured: string }>(
      `SELECT media_type, AVG(view_duration_seconds) AS avg_seconds, COUNT(*) FILTER (WHERE view_duration_seconds IS NOT NULL) AS measured
       FROM media_impressions
       WHERE lab_partner_id = $1 AND channel = 'screen' AND media_type IN ('welcome','patient') AND shown_at >= $2 AND shown_at < $3
       GROUP BY media_type`,
      params
    )
    let avgViewSecondsWelcome: number | null = null
    let avgViewSecondsPatient: number | null = null
    for (const r of durationRows) {
      if (parseInt(r.measured, 10) === 0) continue
      const avg = Math.round(parseFloat(r.avg_seconds ?? '0'))
      if (r.media_type === 'welcome') avgViewSecondsWelcome = avg
      if (r.media_type === 'patient') avgViewSecondsPatient = avg
    }

    // Desglose de la pantalla de bienvenida por contexto: al entrar en
    // sesión, cada cierto intervalo, al firmar un consentimiento o al crear
    // una historia clínica (ver show_trigger en clinic_media_settings).
    const triggerRows = await query<{ trigger: string | null; count: string }>(
      `SELECT trigger, COUNT(*) AS count
       FROM media_impressions
       WHERE lab_partner_id = $1 AND media_type = 'welcome' AND shown_at >= $2 AND shown_at < $3
       GROUP BY trigger`,
      params
    )
    const welcomeByTrigger = { session: 0, interval: 0, consent: 0, clinical: 0 }
    for (const r of triggerRows) {
      const count = parseInt(r.count, 10)
      if (r.trigger && r.trigger in welcomeByTrigger) (welcomeByTrigger as any)[r.trigger] = count
    }

    const clinicRows = await query<{ clinic_id: string; clinic_name: string; province: string | null; media_type: string; channel: string; count: string }>(
      `SELECT c.id AS clinic_id, COALESCE(c.trade_name, c.name) AS clinic_name, c.province, mi.media_type, mi.channel, COUNT(*) AS count
       FROM media_impressions mi
       JOIN clinics c ON c.id = mi.clinic_id
       WHERE mi.lab_partner_id = $1 AND mi.media_type IN ('welcome','patient') AND mi.shown_at >= $2 AND mi.shown_at < $3
       GROUP BY c.id, clinic_name, c.province, mi.media_type, mi.channel
       ORDER BY clinic_name`,
      params
    )
    const byClinicMap = new Map<string, { clinic_id: string; clinic_name: string; province: string | null; welcome_screen: number; patient_screen: number; patient_email: number; total: number; avg_view_seconds_welcome: number | null; avg_view_seconds_patient: number | null }>()
    for (const r of clinicRows) {
      const key = seriesKey(r.media_type, r.channel)
      if (!key) continue
      const entry = byClinicMap.get(r.clinic_id) ?? { clinic_id: r.clinic_id, clinic_name: r.clinic_name, province: r.province, welcome_screen: 0, patient_screen: 0, patient_email: 0, total: 0, avg_view_seconds_welcome: null, avg_view_seconds_patient: null }
      const count = parseInt(r.count, 10)
      entry[key] = count
      entry.total += count
      byClinicMap.set(r.clinic_id, entry)
    }

    const clinicDurationRows = await query<{ clinic_id: string; media_type: string; avg_seconds: string | null; measured: string }>(
      `SELECT mi.clinic_id, mi.media_type, AVG(mi.view_duration_seconds) AS avg_seconds, COUNT(*) FILTER (WHERE mi.view_duration_seconds IS NOT NULL) AS measured
       FROM media_impressions mi
       WHERE mi.lab_partner_id = $1 AND mi.channel = 'screen' AND mi.media_type IN ('welcome','patient') AND mi.shown_at >= $2 AND mi.shown_at < $3
       GROUP BY mi.clinic_id, mi.media_type`,
      params
    )
    for (const r of clinicDurationRows) {
      if (parseInt(r.measured, 10) === 0) continue
      const entry = byClinicMap.get(r.clinic_id)
      if (!entry) continue
      const avg = Math.round(parseFloat(r.avg_seconds ?? '0'))
      if (r.media_type === 'welcome') entry.avg_view_seconds_welcome = avg
      if (r.media_type === 'patient') entry.avg_view_seconds_patient = avg
    }

    const byClinic = [...byClinicMap.values()].sort((a, b) => b.total - a.total)

    // Provincia se deriva del desglose por clínica ya calculado (cada clínica
    // solo tiene una provincia) en vez de otra consulta — las clínicas sin
    // provincia configurada en Clínica > Configuración se agrupan aparte.
    const byProvinceMap = new Map<string, { province: string | null; welcome_screen: number; patient_screen: number; patient_email: number; total: number }>()
    for (const c of byClinic) {
      const key = c.province ?? '__unset__'
      const entry = byProvinceMap.get(key) ?? { province: c.province, welcome_screen: 0, patient_screen: 0, patient_email: 0, total: 0 }
      entry.welcome_screen += c.welcome_screen
      entry.patient_screen += c.patient_screen
      entry.patient_email += c.patient_email
      entry.total += c.total
      byProvinceMap.set(key, entry)
    }
    const byProvince = [...byProvinceMap.values()].sort((a, b) => b.total - a.total)

    return res.json({
      daily,
      totals: { ...totals, avg_view_seconds_welcome: avgViewSecondsWelcome, avg_view_seconds_patient: avgViewSecondsPatient },
      byClinic,
      byProvince,
      welcomeByTrigger,
      from: fromDate.toISOString().slice(0, 10),
      to: toDate.toISOString().slice(0, 10),
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Update
router.put('/:id', requirePlatformAdmin, async (req, res) => {
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
router.delete('/:id', requirePlatformAdmin, async (req, res) => {
  try {
    await query('UPDATE lab_partners SET is_active=FALSE, updated_at=NOW() WHERE id = $1', [req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// List clinics assigned to lab
router.get('/:id/clinics', requirePlatformAdmin, async (req, res) => {
  try {
    const data = await query(
      `SELECT c.*, clp.assigned_at FROM clinic_lab_partners clp JOIN clinics c ON c.id = clp.clinic_id WHERE clp.lab_partner_id = $1`,
      [req.params.id]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Assign clinic
router.post('/:id/clinics', requirePlatformAdmin, async (req, res) => {
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
router.delete('/:id/clinics/:clinicId', requirePlatformAdmin, async (req, res) => {
  try {
    await query('DELETE FROM clinic_lab_partners WHERE lab_partner_id = $1 AND clinic_id = $2', [req.params.id, req.params.clinicId])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// List campaigns
router.get('/:id/campaigns', requireLabAccess, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM lab_ad_campaigns WHERE lab_partner_id = $1 ORDER BY created_at DESC`, [req.params.id])
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Create campaign
router.post('/:id/campaigns', requireLabAccess, async (req, res) => {
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
        (b.starts_at ?? b.startsAt) || null,
        (b.ends_at ?? b.endsAt) || null,
      ]
    )
    return res.status(201).json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Update campaign
router.put('/:id/campaigns/:cid', requireLabAccess, async (req, res) => {
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
        (b.starts_at ?? b.startsAt) || null,
        (b.ends_at ?? b.endsAt) || null,
        req.params.cid,
        req.params.id,
      ]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// Delete campaign
router.delete('/:id/campaigns/:cid', requireLabAccess, async (req, res) => {
  try {
    await query('DELETE FROM lab_ad_campaigns WHERE id = $1 AND lab_partner_id = $2', [req.params.cid, req.params.id])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
