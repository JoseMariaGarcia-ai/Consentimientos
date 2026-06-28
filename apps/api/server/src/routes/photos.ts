import { Router } from 'express'
import crypto from 'crypto'

const router = Router()

router.delete('/:publicId(*)', async (req, res) => {
  const publicId = req.params.publicId
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: 'Cloudinary not configured' })
  }

  try {
    const timestamp = Math.round(Date.now() / 1000)
    const signature = crypto
      .createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
      .digest('hex')

    const form = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: apiKey,
      signature,
    })

    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
    const data = await r.json()
    return res.json(data)
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
