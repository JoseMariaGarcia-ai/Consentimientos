import { spawn } from 'child_process'
import { gunzip as gunzipCb } from 'zlib'
import { promisify } from 'util'
import { withTransaction, queryOne, query } from './db'
import { downloadFile } from './r2'
import { decryptBackup } from './backupEncryption'
import { createJob, logStep, finishJobSuccess, finishJobFailed, getJob } from './backupJobs'
import { notifyBackupFailed } from './backupAlerts'
import { runFullBackup, runClinicBackup, CLINIC_SCOPED_TABLES, type ClinicBackupPayload } from './backupService'

const gunzip = promisify(gunzipCb)

export interface StartRestoreOpts {
  sourceKey: string
  restoreType: 'full' | 'clinic'
  clinicId?: string | null
  createdBy: string | null
}

// Descarga + descifra + descomprime un .sql.gz.enc de R2, ya sea el backup
// que el usuario eligió restaurar o el de seguridad previo para el rollback.
async function fetchAndDecrypt(key: string): Promise<Buffer> {
  const { buffer } = await downloadFile(key)
  const gzipped = decryptBackup(buffer)
  return gunzip(gzipped)
}

function runPsqlRestore(sql: Buffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) return reject(new Error('Falta DATABASE_URL'))
    const proc = spawn('psql', [dbUrl, '-v', 'ON_ERROR_STOP=1'])
    const errChunks: Buffer[] = []
    proc.stderr.on('data', c => errChunks.push(c))
    proc.on('error', err => reject(new Error(`No se pudo ejecutar psql: ${err.message}`)))
    proc.on('close', code => {
      if (code !== 0) {
        reject(new Error(`psql terminó con código ${code}: ${Buffer.concat(errChunks).toString('utf8').slice(0, 2000)}`))
      } else {
        resolve()
      }
    })
    proc.stdin.write(sql)
    proc.stdin.end()
  })
}

async function doFullRestore(jobId: string, sourceKey: string) {
  await logStep(jobId, `Descargando y descifrando ${sourceKey}…`, 30)
  const sql = await fetchAndDecrypt(sourceKey)
  await logStep(jobId, 'Aplicando la restauración completa con psql…', 50)
  await runPsqlRestore(sql)
  await logStep(jobId, 'Restauración completa aplicada.', 90)
}

// Borrado en orden inverso a CLINIC_SCOPED_TABLES (hijos antes que padres)
// para no violar las FKs; las mismas cláusulas WHERE que se usan para
// exportar sirven para acotar el borrado a la clínica.
async function deleteClinicData(client: { query: (sql: string, params?: any[]) => Promise<any> }, clinicId: string) {
  for (const { table, where } of [...CLINIC_SCOPED_TABLES].reverse()) {
    await client.query(`DELETE FROM ${table} WHERE ${where}`, [clinicId])
  }
}

function buildInsert(table: string, row: Record<string, any>): { sql: string; values: any[] } {
  const columns = Object.keys(row)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  return {
    sql: `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
    values: columns.map(c => row[c]),
  }
}

async function doClinicRestore(jobId: string, clinicId: string, sourceKey: string) {
  await logStep(jobId, `Descargando y descifrando ${sourceKey}…`, 30)
  const json = await fetchAndDecrypt(sourceKey)
  const payload: ClinicBackupPayload = JSON.parse(json.toString('utf8'))
  if (payload.clinicId !== clinicId) {
    throw new Error('El backup elegido no corresponde a la clínica indicada')
  }

  const clinic = await queryOne<{ id: string }>('SELECT id FROM clinics WHERE id = $1', [clinicId])
  if (!clinic) throw new Error('La clínica no existe en el sistema actual. Usa restauración completa.')

  await logStep(jobId, 'Borrando los datos actuales de la clínica…', 40)
  await withTransaction(async client => {
    await deleteClinicData(client, clinicId)

    await logStep(jobId, 'Insertando los datos del backup…', 55)
    let i = 0
    for (const { table, rows } of payload.tables) {
      for (const row of rows) {
        const { sql, values } = buildInsert(table, row)
        await client.query(sql, values)
      }
      i++
      await logStep(jobId, `${table}: ${rows.length} filas restauradas.`, 55 + Math.round((i / payload.tables.length) * 35))
    }
  })
  await logStep(jobId, 'Restauración de la clínica aplicada.', 90)
}

async function attemptRollback(jobId: string, opts: StartRestoreOpts, preRestoreJobId: string) {
  await logStep(jobId, 'Intentando restaurar automáticamente el backup de seguridad previo…')
  const preJob = await getJob(preRestoreJobId)
  if (!preJob?.file_key) {
    await logStep(jobId, 'No se pudo completar el rollback automático: no hay backup de seguridad disponible.')
    return
  }
  try {
    if (opts.restoreType === 'full') {
      await doFullRestore(jobId, preJob.file_key)
    } else {
      await doClinicRestore(jobId, opts.clinicId!, preJob.file_key)
    }
    await logStep(jobId, 'Rollback al backup de seguridad previo completado correctamente.')
  } catch (rollbackErr: any) {
    await logStep(jobId, `No se pudo completar el rollback automático: ${rollbackErr.message}`)
  }
}

async function executeRestore(jobId: string, opts: StartRestoreOpts) {
  try {
    await logStep(jobId, 'Haciendo backup de seguridad del estado actual antes de restaurar…', 5)
    const preRestoreJobId = opts.restoreType === 'full'
      ? await runFullBackup(opts.createdBy, 'pre_restore')
      : await runClinicBackup(opts.clinicId!, opts.createdBy, 'pre_restore')

    await query('UPDATE backup_jobs SET pre_restore_job_id = $2 WHERE id = $1', [jobId, preRestoreJobId])

    const preJob = await getJob(preRestoreJobId)
    if (preJob?.status !== 'success') {
      throw new Error('No se pudo completar el backup de seguridad previo; restauración cancelada por seguridad.')
    }
    await logStep(jobId, 'Backup de seguridad completado. Iniciando restauración…', 20)

    if (opts.restoreType === 'full') {
      await doFullRestore(jobId, opts.sourceKey)
    } else {
      await doClinicRestore(jobId, opts.clinicId!, opts.sourceKey)
    }

    await finishJobSuccess(jobId)
    await logStep(jobId, '✅ Restauración completada correctamente.', 100)
  } catch (err: any) {
    await finishJobFailed(jobId, err.message)
    await logStep(jobId, `❌ Error en la restauración: ${err.message}`)
    await notifyBackupFailed('restauración', err.message)

    const job = await getJob(jobId)
    if (job?.pre_restore_job_id) {
      await attemptRollback(jobId, opts, job.pre_restore_job_id)
    }
  }
}

export async function startRestore(opts: StartRestoreOpts): Promise<string> {
  const jobId = await createJob('restore', {
    clinicId: opts.clinicId ?? null,
    createdBy: opts.createdBy,
    restoreSourceKey: opts.sourceKey,
  })
  executeRestore(jobId, opts).catch(err => {
    console.error(`[restoreService] fallo no controlado en la restauración ${jobId}:`, err)
  })
  return jobId
}
