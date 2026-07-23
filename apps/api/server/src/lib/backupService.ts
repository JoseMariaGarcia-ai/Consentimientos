import { spawn } from 'child_process'
import { gzip as gzipCb } from 'zlib'
import { promisify } from 'util'
import { query, queryOne } from './db'
import { uploadFile, deleteFile, listFilesWithMetadata } from './r2'
import { encryptBackup } from './backupEncryption'
import { createJob, logStep, finishJobSuccess, finishJobFailed, type BackupJobKind } from './backupJobs'
import { notifyBackupFailed } from './backupAlerts'

const gzip = promisify(gzipCb)

const RETENTION_DAYS = 30

export function backupTimestamp(withMinutes = false): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const base = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}`
  return withMinutes ? `${base}-${pad(d.getUTCMinutes())}` : base
}

function runPgDump(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return reject(new Error('Falta DATABASE_URL'))
    const proc = spawn('pg_dump', [dbUrl, '--no-owner', '--no-acl', '-F', 'p'])
    const chunks: Buffer[] = []
    const errChunks: Buffer[] = []
    proc.stdout.on('data', c => chunks.push(c))
    proc.stderr.on('data', c => errChunks.push(c))
    proc.on('error', err => reject(new Error(`No se pudo ejecutar pg_dump: ${err.message}`)))
    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`pg_dump terminó con código ${code}: ${Buffer.concat(errChunks).toString('utf8').slice(0, 2000)}`))
      } else {
        resolve(Buffer.concat(chunks))
      }
    })
  })
}

// kind='pre_restore' reutiliza exactamente la misma lógica de pg_dump/subida
// para el backup de seguridad automático que se hace justo antes de una
// restauración (paso 4 del asistente), solo cambia el nombre del archivo.
async function executeFullBackup(jobId: string, kind: Extract<BackupJobKind, 'backup_full' | 'pre_restore'>): Promise<void> {
  try {
    await logStep(jobId, 'Iniciando pg_dump de la base de datos completa…', 10)
    const dump = await runPgDump()
    await logStep(jobId, `pg_dump completado (${dump.length} bytes). Comprimiendo…`, 40)
    const gzipped = await gzip(dump)
    await logStep(jobId, 'Cifrando el backup…', 60)
    const encrypted = encryptBackup(gzipped)
    const prefix = kind === 'pre_restore' ? 'pre-restore' : 'backup'
    const ts = kind === 'pre_restore' ? backupTimestamp(true) : backupTimestamp()
    const key = `backups/full/${prefix}-${ts}.sql.gz.enc`
    await logStep(jobId, `Subiendo a R2 (${key})…`, 85)
    await uploadFile(key, encrypted, 'application/octet-stream')
    await finishJobSuccess(jobId, { fileKey: key, fileSizeBytes: encrypted.length })
    await logStep(jobId, 'Backup completo finalizado correctamente.', 100)
  } catch (err: any) {
    await finishJobFailed(jobId, err.message)
    await notifyBackupFailed('completo', err.message)
  }
}

// Crea el job y espera a que termine — usado cuando el propio código del
// servidor necesita el resultado antes de continuar (p.ej. el backup de
// seguridad previo a una restauración, que debe haber acabado con éxito
// antes de tocar ningún dato).
export async function runFullBackup(createdBy: string | null = null, kind: Extract<BackupJobKind, 'backup_full' | 'pre_restore'> = 'backup_full'): Promise<string> {
  const jobId = await createJob(kind, { createdBy })
  await executeFullBackup(jobId, kind)
  return jobId
}

// Crea el job y lo ejecuta en segundo plano sin esperar — usado por el botón
// "Ejecutar backup ahora" del panel, que necesita el jobId al instante para
// empezar a hacer polling del progreso en tiempo real.
export async function startFullBackup(createdBy: string | null = null): Promise<string> {
  const jobId = await createJob('backup_full', { createdBy })
  executeFullBackup(jobId, 'backup_full').catch(err => console.error(`[backupService] fallo no controlado en el backup ${jobId}:`, err))
  return jobId
}

// Tablas clínicas curadas para el backup/restauración por clínica, en orden
// seguro de FKs (padres antes que hijos). No es el conjunto completo de
// tablas con clinic_id de la app (quedan fuera citas, presupuestos, facturas,
// historial de WhatsApp, créditos, etc.) — cubre el núcleo clínico que pide
// la especificación: pacientes, consentimientos, fotos e historia clínica.
export const CLINIC_SCOPED_TABLES = [
  { table: 'doctors', where: 'clinic_id = $1' },
  { table: 'consent_templates', where: 'clinic_id = $1' },
  { table: 'patients', where: 'clinic_id = $1' },
  { table: 'photo_sessions', where: 'clinic_id = $1' },
  { table: 'clinical_records', where: 'clinic_id = $1' },
  { table: 'consent_records', where: 'patient_id IN (SELECT id FROM patients WHERE clinic_id = $1)' },
  { table: 'photos', where: 'session_id IN (SELECT id FROM photo_sessions WHERE clinic_id = $1)' },
] as const

export interface ClinicBackupPayload {
  clinicId: string
  exportedAt: string
  tables: { table: string; rows: any[] }[]
}

async function executeClinicBackup(jobId: string, clinicId: string, kind: Extract<BackupJobKind, 'backup_clinic' | 'pre_restore'>): Promise<void> {
  try {
    const clinic = await queryOne<{ id: string }>('SELECT id FROM clinics WHERE id = $1', [clinicId])
    if (!clinic) throw new Error('La clínica no existe en el sistema actual')

    await logStep(jobId, 'Exportando datos de la clínica…', 10)
    const payload: ClinicBackupPayload = { clinicId, exportedAt: new Date().toISOString(), tables: [] }
    let i = 0
    for (const { table, where } of CLINIC_SCOPED_TABLES) {
      const rows = await query(`SELECT * FROM ${table} WHERE ${where}`, [clinicId])
      payload.tables.push({ table, rows })
      i++
      await logStep(jobId, `${table}: ${rows.length} filas exportadas.`, 10 + Math.round((i / CLINIC_SCOPED_TABLES.length) * 50))
    }

    await logStep(jobId, 'Comprimiendo…', 65)
    const gzipped = await gzip(Buffer.from(JSON.stringify(payload)))
    await logStep(jobId, 'Cifrando el backup…', 80)
    const encrypted = encryptBackup(gzipped)
    const prefix = kind === 'pre_restore' ? 'pre-restore' : 'backup'
    const ts = kind === 'pre_restore' ? backupTimestamp(true) : backupTimestamp().slice(0, 10)
    const key = `backups/clinics/${clinicId}/${prefix}-${ts}.sql.gz.enc`
    await logStep(jobId, `Subiendo a R2 (${key})…`, 90)
    await uploadFile(key, encrypted, 'application/octet-stream')
    await finishJobSuccess(jobId, { fileKey: key, fileSizeBytes: encrypted.length })
    await logStep(jobId, 'Backup de la clínica finalizado correctamente.', 100)
  } catch (err: any) {
    await finishJobFailed(jobId, err.message)
    await notifyBackupFailed(`de la clínica ${clinicId}`, err.message)
  }
}

export async function runClinicBackup(clinicId: string, createdBy: string | null = null, kind: Extract<BackupJobKind, 'backup_clinic' | 'pre_restore'> = 'backup_clinic'): Promise<string> {
  const jobId = await createJob(kind, { clinicId, createdBy })
  await executeClinicBackup(jobId, clinicId, kind)
  return jobId
}

export async function startClinicBackup(clinicId: string, createdBy: string | null = null): Promise<string> {
  const jobId = await createJob('backup_clinic', { clinicId, createdBy })
  executeClinicBackup(jobId, clinicId, 'backup_clinic').catch(err => console.error(`[backupService] fallo no controlado en el backup ${jobId}:`, err))
  return jobId
}

export async function runAllClinicBackups(): Promise<void> {
  const clinics = await query<{ id: string }>('SELECT id FROM clinics')
  for (const c of clinics) {
    await runClinicBackup(c.id, null)
  }
}

export async function pruneOldBackups(): Promise<{ deleted: number }> {
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  let deleted = 0
  for (const prefix of ['backups/full/', 'backups/clinics/']) {
    const files = await listFilesWithMetadata(prefix)
    for (const f of files) {
      const match = f.key.match(/backup-(\d{4})-(\d{2})-(\d{2})/)
      if (!match) continue
      const fileDate = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      if (fileDate < cutoff) {
        await deleteFile(f.key).catch(() => {})
        deleted++
      }
    }
  }
  return { deleted }
}
