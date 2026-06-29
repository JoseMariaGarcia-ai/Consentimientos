import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/r2'

const router = Router()
const MAX_CREATIVES = 5

async function getClinicId(userId: string): Promise<string> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  if (!row?.clinic_id) throw new Error('Clinic not found')
  return row.clinic_id
}

async function getSettings(clinicId: string, type: string) {
  let s = await queryOne<any>(
    'SELECT * FROM clinic_media_settings WHERE clinic_id=$1 AND media_type=$2',
    [clinicId, type]
  )
  if (!s) {
    s = await queryOne(
      `INSERT INTO clinic_media_settings (clinic_id, media_type) VALUES ($1,$2)
       ON CONFLICT DO NOTHING RETURNING *`,
      [clinicId, type]
    )
    s = s ?? await queryOne('SELECT * FROM clinic_media_settings WHERE clinic_id=$1 AND media_type=$2', [clinicId, type])
  }
  return s
}

async function enrichFiles(files: any[]) {
  return Promise.all(files.map(async f => ({
    ...f,
    url: f.source_url ?? await getPresignedUrl(f.r2_key, 7200),
  })))
}

// GET /api/media — returns creatives + settings for both slots
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const result: Record<string, any> = {}
    for (const type of ['welcome', 'patient']) {
      const files = await query<any>(
        'SELECT * FROM clinic_media WHERE clinic_id=$1 AND type=$2 ORDER BY order_index, created_at',
        [clinicId, type]
      )
      const settings = await getSettings(clinicId, type)
      result[type] = {
        settings,
        files: await enrichFiles(files),
      }
    }
    return res.json(result)
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
    const clinicId = await getClinicId(userId)
    const count = await queryOne<{ count: string }>(
      'SELECT COUNT(*) FROM clinic_media WHERE clinic_id=$1 AND type=$2',
      [clinicId, type]
    )
    if (parseInt(count?.count ?? '0') >= MAX_CREATIVES) {
      return res.status(400).json({ error: `Máximo ${MAX_CREATIVES} creatividades por slot` })
    }

    const maxIdx = await queryOne<{ max: number }>(
      'SELECT COALESCE(MAX(order_index),0) AS max FROM clinic_media WHERE clinic_id=$1 AND type=$2',
      [clinicId, type]
    )
    const orderIndex = (maxIdx?.max ?? 0) + 1

    const ext = fileName.split('.').pop() ?? 'bin'
    const key = `clinics/${clinicId}/media/${type}_${Date.now()}.${ext}`
    const buffer = Buffer.from(fileBase64, 'base64')
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')

    const row = await queryOne<any>(
      `INSERT INTO clinic_media (clinic_id, type, r2_key, original_name, content_type, order_index)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [clinicId, type, key, fileName, contentType ?? 'image/jpeg', orderIndex]
    )

    // If this is the first creative, auto-select it
    const settings = await getSettings(clinicId, type)
    if (!settings?.active_creative_id) {
      await query(
        'UPDATE clinic_media_settings SET active_creative_id=$1 WHERE clinic_id=$2 AND media_type=$3',
        [row!.id, clinicId, type]
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
    const clinicId = await getClinicId(userId)
    const count = await queryOne<{ count: string }>('SELECT COUNT(*) FROM clinic_media WHERE clinic_id=$1 AND type=$2', [clinicId, type])
    if (parseInt(count?.count ?? '0') >= MAX_CREATIVES) {
      return res.status(400).json({ error: `Máximo ${MAX_CREATIVES} creatividades por slot` })
    }
    const maxIdx = await queryOne<{ max: number }>('SELECT COALESCE(MAX(order_index),0) AS max FROM clinic_media WHERE clinic_id=$1 AND type=$2', [clinicId, type])
    const orderIndex = (maxIdx?.max ?? 0) + 1

    const row = await queryOne<any>(
      `INSERT INTO clinic_media (clinic_id, type, r2_key, source_url, original_name, content_type, order_index)
       VALUES ($1,$2,NULL,$3,$4,'video/url',$5) RETURNING *`,
      [clinicId, type, source_url, label ?? source_url, orderIndex]
    )

    const settings = await getSettings(clinicId, type)
    if (!settings?.active_creative_id) {
      await query('UPDATE clinic_media_settings SET active_creative_id=$1 WHERE clinic_id=$2 AND media_type=$3', [row!.id, clinicId, type])
    }

    return res.status(201).json({ ...row, url: source_url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/media/:type/file/:fileId — delete single creative
router.delete('/:type/file/:fileId', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const file = await queryOne<any>(
      'SELECT * FROM clinic_media WHERE id=$1 AND clinic_id=$2',
      [req.params.fileId, clinicId]
    )
    if (!file) return res.status(404).json({ error: 'Archivo no encontrado' })

    await deleteFile(file.r2_key).catch(() => {})
    await query('DELETE FROM clinic_media WHERE id=$1', [req.params.fileId])

    // If deleted was the active one, auto-select the first remaining
    const settings = await getSettings(clinicId, file.type)
    if (settings?.active_creative_id === req.params.fileId) {
      const first = await queryOne<any>(
        'SELECT id FROM clinic_media WHERE clinic_id=$1 AND type=$2 ORDER BY order_index LIMIT 1',
        [clinicId, file.type]
      )
      await query(
        'UPDATE clinic_media_settings SET active_creative_id=$1 WHERE clinic_id=$2 AND media_type=$3',
        [first?.id ?? null, clinicId, file.type]
      )
    }
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/media/:type/config — save display + trigger settings
router.put('/:type/config', async (req, res) => {
  const { userId } = (req as any).user
  const type = req.params.type
  const { show_trigger, show_interval_minutes, display_mode, active_creative_id } = req.body
  try {
    const clinicId = await getClinicId(userId)
    await getSettings(clinicId, type) // ensure row exists
    const row = await queryOne(
      `UPDATE clinic_media_settings SET
         show_trigger          = COALESCE($1, show_trigger),
         show_interval_minutes = COALESCE($2, show_interval_minutes),
         display_mode          = COALESCE($3, display_mode),
         active_creative_id    = COALESCE($4, active_creative_id)
       WHERE clinic_id=$5 AND media_type=$6 RETURNING *`,
      [
        show_trigger ?? null,
        show_interval_minutes ?? null,
        display_mode ?? null,
        active_creative_id ?? null,
        clinicId,
        type,
      ]
    )
    return res.json(row)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
