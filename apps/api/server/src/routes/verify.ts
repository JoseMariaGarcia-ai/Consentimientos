import { Router } from 'express'
import { queryOne } from '../lib/db'

const router = Router()

router.get('/:uuid', async (req, res) => {
  try {
    const data = await queryOne(
      `SELECT cr.*, p.full_name AS patient_name, d.name AS doctor_name, t.treatment_type
       FROM consent_records cr
       LEFT JOIN patients p ON p.id = cr.patient_id
       LEFT JOIN doctors d ON d.id = cr.doctor_id
       LEFT JOIN consent_templates t ON t.id = cr.template_id
       WHERE cr.consent_uuid = $1`,
      [req.params.uuid]
    )
    if (!data) return res.status(404).json({ error: 'No encontrado' })
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
