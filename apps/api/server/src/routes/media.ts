import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { uploadFile, deleteFile, getPresignedUrl } from '../lib/r2'

const router = Router()

async function getClinicId(userId: string): Promise<string> {
  const row = await queryOne<{ clinic_id: string }>('SELECT clinic_id FROM app_users WHERE id = $1', [userId])
  if (!row?.clinic_id) throw new Error('Clinic not found')
  return row.clinic_id
}

// GET /api/media — returns both media slots for this clinic
router.get('/', async (req, res) => {
  const { userId } = (req as any).user
  try {
    const clinicId = await getClinicId(userId)
    const rows = await query<any>('SELECT * FROM clinic_media WHERE clinic_id = $1', [clinicId])
    const result: Record<string, any> = {}
    for (const row of rows) {
      result[row.type] = {
        ...row,
        url: await getPresignedUrl(row.r2_key, 7200),
      }
    }
    return res.json(result)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/media/:type — upload welcome or patient media (replaces if exists)
router.post('/:type', async (req, res) => {
  const { userId } = (req as any).user
  const type = req.params.type as 'welcome' | 'patient'
  if (!['welcome', 'patient'].includes(type)) return res.status(400).json({ error: 'Invalid type' })

  const { fileBase64, fileName, contentType } = req.body
  if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 y fileName requeridos' })

  try {
    const clinicId = await getClinicId(userId)

    // Delete old file if exists
    const existing = await queryOne<any>('SELECT r2_key FROM clinic_media WHERE clinic_id=$1 AND type=$2', [clinicId, type])
    if (existing) await deleteFile(existing.r2_key).catch(() => {})

    const ext = fileName.split('.').pop() ?? 'bin'
    const key = `clinics/${clinicId}/media/${type}_${Date.now()}.${ext}`
    const buffer = Buffer.from(fileBase64, 'base64')
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')

    const row = await queryOne(
      `INSERT INTO clinic_media (clinic_id, type, r2_key, original_name, content_type)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (clinic_id, type) DO UPDATE
         SET r2_key=$3, original_name=$4, content_type=$5, created_at=NOW()
       RETURNING *`,
      [clinicId, type, key, fileName, contentType ?? 'image/jpeg']
    )
    const url = await getPresignedUrl(key, 7200)
    return res.status(201).json({ ...row, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// PUT /api/media/:type/config — save display trigger config (no file change)
router.put('/:type/config', async (req, res) => {
  const { userId } = (req as any).user
  const type = req.params.type
  const { show_trigger, show_interval_minutes } = req.body
  const validTriggers = ['session', 'consent', 'clinical', 'interval']
  if (show_trigger && !validTriggers.includes(show_trigger)) {
    return res.status(400).json({ error: 'show_trigger inválido' })
  }
  try {
    const clinicId = await getClinicId(userId)
    const row = await queryOne(
      `UPDATE clinic_media
         SET show_trigger = COALESCE($1, show_trigger),
             show_interval_minutes = COALESCE($2, show_interval_minutes)
       WHERE clinic_id = $3 AND type = $4
       RETURNING *`,
      [show_trigger ?? null, show_interval_minutes ?? null, clinicId, type]
    )
    if (!row) return res.status(404).json({ error: 'No hay archivo subido para este slot' })
    return res.json(row)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/media/:type
router.delete('/:type', async (req, res) => {
  const { userId } = (req as any).user
  const type = req.params.type
  try {
    const clinicId = await getClinicId(userId)
    const row = await queryOne<any>('SELECT r2_key FROM clinic_media WHERE clinic_id=$1 AND type=$2', [clinicId, type])
    if (row) await deleteFile(row.r2_key).catch(() => {})
    await query('DELETE FROM clinic_media WHERE clinic_id=$1 AND type=$2', [clinicId, type])
    return res.json({ deleted: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
