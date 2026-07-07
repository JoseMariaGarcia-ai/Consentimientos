import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/r2'

const router = Router()
const MAX_CREATIVES = 5

interface MediaOwner { type: 'clinic' | 'lab'; id: string }

// A clinic linked to one or more lab partners has its welcome/patient media
// managed centrally by the first linked lab, instead of by the clinic itself.
async function resolveOwner(userId: string): Promise<MediaOwner> {
  const me = await queryOne<{ clinic_id: string | null; lab_partner_id: string | null }>(
    'SELECT clinic_id, lab_partner_id FROM app_users WHERE id = $1', [userId]
  )
  if (!me) throw new Error('Usuario no encontrado')
  if (me.lab_partner_id) return { type: 'lab', id: me.lab_partner_id }
  if (!me.clinic_id) throw new Error('Usuario sin clínica ni laboratorio asignado')
  const link = await queryOne<{ lab_partner_id: string }>(
    'SELECT lab_partner_id FROM clinic_lab_partners WHERE clinic_id = $1 ORDER BY assigned_at ASC LIMIT 1',
    [me.clinic_id]
  )
  return link ? { type: 'lab', id: link.lab_partner_id } : { type: 'clinic', id: me.clinic_id }
}

// Only the owning lab's own users (or a superadmin) may edit lab-managed
// media; only that clinic's own admin/superadmin may edit clinic-managed media.
async function canWrite(userId: string, owner: MediaOwner): Promise<boolean> {
  const me = await queryOne<{ role: string; lab_partner_id: string | null }>(
    'SELECT role, lab_partner_id FROM app_users WHERE id = $1', [userId]
  )
  if (!me) return false
  if (me.role === 'superadmin') return true
  if (owner.type === 'lab') return me.lab_partner_id === owner.id
  return me.role === 'admin'
}

function ownerColumn(owner: MediaOwner) {
  return owner.type === 'lab' ? 'lab_partner_id' : 'clinic_id'
}

async function getSettings(column: string, value: string, type: string) {
  let s = await queryOne<any>(
    `SELECT * FROM clinic_media_settings WHERE ${column}=$1 AND media_type=$2`,
    [value, type]
  )
  if (!s) {
    s = await queryOne(
      `INSERT INTO clinic_media_settings (${column}, media_type) VALUES ($1,$2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [value, type]
    )
    s = s ?? await queryOne(`SELECT * FROM clinic_media_settings WHERE ${column}=$1 AND media_type=$2`, [value, type])
  }
  return s
}

async function enrichFiles(files: any[]) {
  return Promise.all(files.map(async f => ({
    ...f,
    url: f.source_url ?? await getPresignedUrl(f.r2_key, 7200),
  })))
}

// GET /api/media — returns creatives + settings for both slots, resolved to
// whichever clinic or lab partner actually owns this user's media.
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const owner = await resolveOwner(userId)
    const column = ownerColumn(owner)
    let managedByLabName: string | null = null
    if (owner.type === 'lab') {
      const lab = await queryOne<{ name: string }>('SELECT name FROM lab_partners WHERE id = $1', [owner.id])
      managedByLabName = lab?.name ?? null
    }

    const result: Record<string, any> = {}
    for (const type of ['welcome', 'patient']) {
      const files = await query<any>(
        `SELECT * FROM clinic_media WHERE ${column}=$1 AND type=$2 ORDER BY order_index, created_at`,
        [owner.id, type]
      )
      const settings = await getSettings(column, owner.id, type)
      result[type] = { settings, files: await enrichFiles(files) }
    }
    return res.json({
      ...result,
      managedByLab: owner.type === 'lab' ? owner.id : null,
      managedByLabName,
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/media/impressions — log that a welcome/patient creative was
// actually shown to clinic staff, for the lab partner's stats dashboard.
// Registered before /:type so it isn't swallowed by that param route.
router.post('/impressions', async (req, res) => {
  const { userId } = (req as any).user
  const { type, creative_id } = req.body
  if (!['welcome', 'patient'].includes(type)) return res.status(400).json({ error: 'Invalid type' })
  try {
    const me = await queryOne<{ clinic_id: string | null }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
    if (!me?.clinic_id) return res.status(400).json({ error: 'Usuario sin clínica asignada' })

    let labPartnerId: string | null = null
    if (creative_id) {
      const creative = await queryOne<{ lab_partner_id: string | null }>(
        'SELECT lab_partner_id FROM clinic_media WHERE id = $1', [creative_id]
      )
      labPartnerId = creative?.lab_partner_id ?? null
    }

    await query(
      `INSERT INTO media_impressions (clinic_id, lab_partner_id, media_type, creative_id) VALUES ($1,$2,$3,$4)`,
      [me.clinic_id, labPartnerId, type, creative_id ?? null]
    )
    return res.status(201).json({ logged: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/media/:type — upload new creative (max 5)
router.post('/:type', async (req, res) => {
  const { userId } = (req as any).user
  const type = req.params.type as 'welcome' | 'patient'
  if (!['welcome', 'patient'].includes(type)) return res.status(400).json({ error: 'Invalid type' })

  const { fileBase64, fileName, contentType } = req.body
  if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 y fileName requeridos' })

  try {
    const owner = await resolveOwner(userId)
    if (!(await canWrite(userId, owner))) return res.status(403).json({ error: 'No tienes permiso para gestionar esta publicidad' })
    const column = ownerColumn(owner)

    const count = await queryOne<{ count: string }>(
      `SELECT COUNT(*) FROM clinic_media WHERE ${column}=$1 AND type=$2`,
      [owner.id, type]
    )
    if (parseInt(count?.count ?? '0') >= MAX_CREATIVES) {
      return res.status(400).json({ error: `Máximo ${MAX_CREATIVES} creatividades por slot` })
    }

    const maxIdx = await queryOne<{ max: number }>(
      `SELECT COALESCE(MAX(order_index),0) AS max FROM clinic_media WHERE ${column}=$1 AND type=$2`,
      [owner.id, type]
    )
    const orderIndex = (maxIdx?.max ?? 0) + 1

    const ext = fileName.split('.').pop() ?? 'bin'
    const key = `${owner.type}s/${owner.id}/media/${type}_${Date.now()}.${ext}`
    const buffer = Buffer.from(fileBase64, 'base64')
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')

    const row = await queryOne<any>(
      `INSERT INTO clinic_media (${column}, type, r2_key, original_name, content_type, order_index)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [owner.id, type, key, fileName, contentType ?? 'image/jpeg', orderIndex]
    )

    // If this is the first creative, auto-select it
    const settings = await getSettings(column, owner.id, type)
    if (!settings?.active_creative_id) {
      await query(
        `UPDATE clinic_media_settings SET active_creative_id=$1 WHERE ${column}=$2 AND media_type=$3`,
        [row!.id, owner.id, type]
      )
    }

    const url = await getPresignedUrl(key, 7200)
    return res.status(201).json({ ...row, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/media/:type/url — add a URL creative (no upload to R2)
router.post('/:type/url', async (req, res) => {
  const { userId } = (req as any).user
  const type = req.params.type as 'welcome' | 'patient'
  if (!['welcome', 'patient'].includes(type)) return res.status(400).json({ error: 'Invalid type' })

  const { source_url, label } = req.body
  if (!source_url) return res.status(400).json({ error: 'source_url requerida' })
  try {
    new URL(source_url) // validate
  } catch {
    return res.status(400).json({ error: 'URL no válida' })
  }

  try {
    const owner = await resolveOwner(userId)
    if (!(await canWrite(userId, owner))) return res.status(403).json({ error: 'No tienes permiso para gestionar esta publicidad' })
    const column = ownerColumn(owner)

    const count = await queryOne<{ count: string }>(`SELECT COUNT(*) FROM clinic_media WHERE ${column}=$1 AND type=$2`, [owner.id, type])
    if (parseInt(count?.count ?? '0') >= MAX_CREATIVES) {
      return res.status(400).json({ error: `Máximo ${MAX_CREATIVES} creatividades por slot` })
    }
    const maxIdx = await queryOne<{ max: number }>(`SELECT COALESCE(MAX(order_index),0) AS max FROM clinic_media WHERE ${column}=$1 AND type=$2`, [owner.id, type])
    const orderIndex = (maxIdx?.max ?? 0) + 1

    const row = await queryOne<any>(
      `INSERT INTO clinic_media (${column}, type, r2_key, source_url, original_name, content_type, order_index)
       VALUES ($1,$2,NULL,$3,$4,'video/url',$5) RETURNING *`,
      [owner.id, type, source_url, label ?? source_url, orderIndex]
    )

    const settings = await getSettings(column, owner.id, type)
    if (!settings?.active_creative_id) {
      await query(`UPDATE clinic_media_settings SET active_creative_id=$1 WHERE ${column}=$2 AND media_type=$3`, [row!.id, owner.id, type])
    }

    return res.status(201).json({ ...row, url: source_url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/media/:type/file/:fileId — delete single creative
router.delete('/:type/file/:fileId', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const owner = await resolveOwner(userId)
    if (!(await canWrite(userId, owner))) return res.status(403).json({ error: 'No tienes permiso para gestionar esta publicidad' })
    const column = ownerColumn(owner)

    const file = await queryOne<any>(
      `SELECT * FROM clinic_media WHERE id=$1 AND ${column}=$2`,
      [req.params.fileId, owner.id]
    )
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' })

    await deleteFile(file.r2_key).catch(() => {})
    await query('DELETE FROM clinic_media WHERE id=$1', [req.params.fileId])

    // If deleted was the active one, auto-select the first remaining
    const settings = await getSettings(column, owner.id, file.type)
    if (settings?.active_creative_id === req.params.fileId) {
      const first = await queryOne<any>(
        `SELECT id FROM clinic_media WHERE ${column}=$1 AND type=$2 ORDER BY order_index LIMIT 1`,
        [owner.id, file.type]
      )
      await query(
        `UPDATE clinic_media_settings SET active_creative_id=$1 WHERE ${column}=$2 AND media_type=$3`,
        [first?.id ?? null, owner.id, file.type]
      )
    }
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/media/:type/config — save display + trigger settings
router.put('/:type/config', async (req, res) => {
  const { userId } = (req as any).user
  const type = req.params.type
  const { show_trigger, show_interval_minutes, display_mode, active_creative_id, close_delay_seconds } = req.body
  try {
    const owner = await resolveOwner(userId)
    if (!(await canWrite(userId, owner))) return res.status(403).json({ error: 'No tienes permiso para gestionar esta publicidad' })
    const column = ownerColumn(owner)

    await getSettings(column, owner.id, type) // ensure row exists
    const row = await queryOne(
      `UPDATE clinic_media_settings SET
         show_trigger          = COALESCE($1, show_trigger),
         show_interval_minutes = COALESCE($2, show_interval_minutes),
         display_mode          = COALESCE($3, display_mode),
         active_creative_id    = COALESCE($4, active_creative_id),
         close_delay_seconds   = COALESCE($5, close_delay_seconds)
       WHERE ${column}=$6 AND media_type=$7 RETURNING *`,
      [
        show_trigger ?? null,
        show_interval_minutes ?? null,
        display_mode ?? null,
        active_creative_id ?? null,
        close_delay_seconds ?? null,
        owner.id,
        type,
      ]
    )
    return res.json(row)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
