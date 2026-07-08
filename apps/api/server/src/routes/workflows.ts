import { Router } from 'express'
import { query, queryOne } from '../lib/db'

const router = Router()

// Whether a given workflow is currently enabled — defaults to true if no
// row exists yet, so a newly-added workflow key is active until someone
// explicitly turns it off (matches "siempre activo al crearse").
export async function isWorkflowEnabled(key: string): Promise<boolean> {
  const row = await queryOne<{ enabled: boolean }>('SELECT enabled FROM workflows WHERE key = $1', [key])
  return row ? row.enabled : true
}

router.get('/', async (_req, res) => {
  try {
    const data = await query('SELECT * FROM workflows ORDER BY created_at ASC')
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.put('/:key', async (req, res) => {
  const { enabled } = req.body
  try {
    const data = await queryOne(
      `INSERT INTO workflows (key, enabled) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET enabled = $2, updated_at = NOW() RETURNING *`,
      [req.params.key, !!enabled]
    )
    return res.json(data)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
