-- Backups y restauraciones (sección Configuración > Backups). Un backup
-- FALLIDO no siempre produce un archivo en R2 (puede fallar antes de subir
-- nada), así que el estado "Fallido"/"Correcto" necesita su propia tabla,
-- no basta con listar lo que hay en el bucket. La misma tabla sirve para
-- las restauraciones (con su barra de progreso y log en tiempo real,
-- consultados por polling desde el asistente de 4 pasos).
CREATE TABLE IF NOT EXISTS backup_jobs (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind                  TEXT NOT NULL CHECK (kind IN ('backup_full', 'backup_clinic', 'restore', 'pre_restore')),
  clinic_id             UUID REFERENCES clinics(id) ON DELETE SET NULL,
  status                TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'failed')),
  file_key              TEXT,
  file_size_bytes       BIGINT,
  -- Solo para kind='restore': de qué archivo se restauró y qué backup de
  -- seguridad previo (pre_restore) se generó justo antes, por si hiciera
  -- falta revertir automáticamente ante un fallo a mitad de restauración.
  restore_source_key    TEXT,
  pre_restore_job_id    UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  error_message         TEXT,
  log                   JSONB NOT NULL DEFAULT '[]',
  progress              INT NOT NULL DEFAULT 0,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at           TIMESTAMPTZ,
  created_by            UUID REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_backup_jobs_kind_started ON backup_jobs(kind, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_jobs_clinic ON backup_jobs(clinic_id, started_at DESC);
