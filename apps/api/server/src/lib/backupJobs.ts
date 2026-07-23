import { query, queryOne } from './db'

export type BackupJobKind = 'backup_full' | 'backup_clinic' | 'restore' | 'pre_restore'
export type BackupJobStatus = 'running' | 'success' | 'failed'

export interface BackupJob {
  id: string
  kind: BackupJobKind
  clinic_id: string | null
  status: BackupJobStatus
  file_key: string | null
  file_size_bytes: number | null
  restore_source_key: string | null
  pre_restore_job_id: string | null
  error_message: string | null
  log: { ts: string; message: string }[]
  progress: number
  started_at: string
  finished_at: string | null
  created_by: string | null
}

export async function createJob(
  kind: BackupJobKind, opts: { clinicId?: string | null; createdBy?: string | null; restoreSourceKey?: string | null } = {}
): Promise<string> {
  const row = await queryOne<{ id: string }>(
    `INSERT INTO backup_jobs (kind, clinic_id, created_by, restore_source_key) VALUES ($1,$2,$3,$4) RETURNING id`,
    [kind, opts.clinicId ?? null, opts.createdBy ?? null, opts.restoreSourceKey ?? null]
  )
  return row!.id
}

export async function logStep(jobId: string, message: string, progress?: number) {
  console.log(`[backup:${jobId}] ${message}`)
  await query(
    `UPDATE backup_jobs SET log = log || jsonb_build_object('ts', NOW()::text, 'message', $2::text)${progress != null ? ', progress = $3' : ''} WHERE id = $1`,
    progress != null ? [jobId, message, progress] : [jobId, message]
  )
}

export async function finishJobSuccess(jobId: string, opts: { fileKey?: string; fileSizeBytes?: number } = {}) {
  await query(
    `UPDATE backup_jobs SET status = 'success', progress = 100, finished_at = NOW(), file_key = COALESCE($2, file_key), file_size_bytes = COALESCE($3, file_size_bytes) WHERE id = $1`,
    [jobId, opts.fileKey ?? null, opts.fileSizeBytes ?? null]
  )
}

export async function finishJobFailed(jobId: string, errorMessage: string) {
  await query(
    `UPDATE backup_jobs SET status = 'failed', finished_at = NOW(), error_message = $2 WHERE id = $1`,
    [jobId, errorMessage]
  )
}

export async function getJob(jobId: string): Promise<BackupJob | null> {
  return queryOne<BackupJob>('SELECT * FROM backup_jobs WHERE id = $1', [jobId])
}

export async function listRecentJobs(kinds: BackupJobKind[], sinceDays: number, clinicId?: string | null): Promise<BackupJob[]> {
  if (clinicId) {
    return query<BackupJob>(
      `SELECT * FROM backup_jobs WHERE kind = ANY($1) AND clinic_id = $2 AND started_at > NOW() - ($3 || ' days')::interval ORDER BY started_at DESC`,
      [kinds, clinicId, String(sinceDays)]
    )
  }
  return query<BackupJob>(
    `SELECT * FROM backup_jobs WHERE kind = ANY($1) AND started_at > NOW() - ($2 || ' days')::interval ORDER BY started_at DESC`,
    [kinds, String(sinceDays)]
  )
}
