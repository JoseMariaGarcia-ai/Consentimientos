import { Router } from 'express'
import { uploadFile, deleteFile, listFiles, getPresignedUrl } from '../lib/r2'

const router = Router()

// GET /api/photos/:patientId — list photos with presigned URLs
router.get('/:patientId', async (req, res) => {
  try {
    const prefix = `patients/${req.params.patientId}/photos/`
    const keys = await listFiles(prefix)
    const photos = await Promise.all(keys.map(async key => ({
      key,
      url: await getPresignedUrl(key),
    })))
    return res.json(photos)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/photos/:patientId — upload photo (base64 or multipart)
router.post('/:patientId', async (req, res) => {
  try {
    const { fileBase64, fileName, contentType } = req.body
    if (!fileBase64 || !fileName) return res.status(400).json({ error: 'fileBase64 y fileName requeridos' })
    const buffer = Buffer.from(fileBase64, 'base64')
    const key = `patients/${req.params.patientId}/photos/${Date.now()}_${fileName}`
    await uploadFile(key, buffer, contentType ?? 'image/jpeg')
    const url = await getPresignedUrl(key)
    return res.status(201).json({ key, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// DELETE /api/photos/file/:key(*) — delete by key
router.delete('/file/:key(*)', async (req, res) => {
  try {
    await deleteFile(req.params.key)
    return res.json({ ok: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
