import { Router } from 'express'
import { queryOne } from '../lib/db'
import { startFullBackup, startClinicBackup } from '../lib/backupService'
import { startRestore } from '../lib/restoreService'
import { listRecentJobs, getJob, type BackupJobKind } from '../lib/backupJobs'
import { listFilesWithMetadata } from '../lib/r2'

const router = Router()

// Montado en index.ts bajo /api/admin/backup, protegido con
// authMiddleware + requireSuperAdmin (igual que /api/admin/provider-balances
// y /api/workflows) — sustituye a la cabecera fija X-Admin-Key del spec
// original: un secreto estático hardcodeado en el código sería un punto
// débil real, y el sistema ya tiene un control de rol robusto para esto.
const SINCE_DAYS = 30

router.post('/run', async (req, res) => {
  try {
    const userId = (req as any).user?.userId ?? null
    const { type, clinicId } = req.body as { type: 'full' | 'clinic'; clinicId?: string }
    if (type === 'clinic') {
      if (!clinicId) return res.status(400).json({ error: 'Falta clinicId' })
      const jobId = await startClinicBackup(clinicId, userId)
      return res.json({ jobId })
    }
    const jobId = await startFullBackup(userId)
    return res.json({ jobId })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/list', async (req, res) => {
  try {
    const clinicId = typeof req.query.clinicId === 'string' ? req.query.clinicId : null
    const kinds: BackupJobKind[] = clinicId ? ['backup_clinic'] : ['backup_full', 'backup_clinic']
    const jobs = await listRecentJobs(kinds, SINCE_DAYS, clinicId)

    // El bucket es la fuente de verdad de qué ficheros existen realmente
    // (con tamaño real); backup_jobs es la fuente de verdad de qué falló.
    // Se combinan por fecha para no depender solo de uno de los dos.
    const [fullFiles, clinicFiles] = await Promise.all([
      listFilesWithMetadata('backups/full/'),
      listFilesWithMetadata('backups/clinics/'),
    ])
    const filesByKey = new Map([...fullFiles, ...clinicFiles].map(f => [f.key, f]))

    return res.json({
      jobs: jobs.map(j => ({
        ...j,
        file_size_bytes: j.file_key ? (filesByKey.get(j.file_key)?.size ?? j.file_size_bytes) : j.file_size_bytes,
      })),
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.post('/restore', async (req, res) => {
  try {
    const userId = (req as any).user?.userId ?? null
    const { backup_file, restore_type, clinic_id, confirmacion } = req.body as {
      backup_file: string; restore_type: 'full' | 'clinic'; clinic_id?: string; confirmacion: string
    }
    if (confirmacion !== 'CONFIRMAR') {
      return res.status(400).json({ error: 'Debes escribir CONFIRMAR exactamente para iniciar la restauración' })
    }
    if (!backup_file || !restore_type) {
      return res.status(400).json({ error: 'Faltan backup_file o restore_type' })
    }
    if (restore_type === 'clinic') {
      if (!clinic_id) return res.status(400).json({ error: 'Falta clinic_id' })
      const clinic = await queryOne<{ id: string }>('SELECT id FROM clinics WHERE id = $1', [clinic_id])
      if (!clinic) return res.status(400).json({ error: 'La clínica no existe en el sistema actual. Usa restauración completa.' })
    }

    const jobId = await startRestore({
      sourceKey: backup_file,
      restoreType: restore_type,
      clinicId: clinic_id ?? null,
      createdBy: userId,
    })
    return res.json({ jobId })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

router.get('/status/:jobId', async (req, res) => {
  try {
    const job = await getJob(req.params.jobId)
    if (!job) return res.status(404).json({ error: 'No se encontró ese trabajo de backup/restauración' })
    return res.json(job)
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export default router
