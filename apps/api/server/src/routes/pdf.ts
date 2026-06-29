import { Router } from 'express'
import { uploadFile, getPresignedUrl } from '../lib/r2'

const router = Router()

// POST /api/pdf/upload — store signed consent PDF
router.post('/upload', async (req, res) => {
  try {
    const { consentId, pdfBase64 } = req.body
    if (!consentId || !pdfBase64) return res.status(400).json({ error: 'consentId y pdfBase64 requeridos' })
    const buffer = Buffer.from(pdfBase64, 'base64')
    const key = `consents/${consentId}/consent.pdf`
    await uploadFile(key, buffer, 'application/pdf')
    const url = await getPresignedUrl(key, 86400) // 24h
    return res.status(201).json({ key, url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/pdf/:consentId — get download URL for a consent PDF
router.get('/:consentId', async (req, res) => {
  try {
    const key = `consents/${req.params.consentId}/consent.pdf`
    const url = await getPresignedUrl(key, 86400)
    return res.json({ url })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
