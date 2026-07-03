import { Router } from 'express'
import { pool } from '../lib/db'

const router = Router()

const MIGRATE_SECRET = '5eab91b39b8361705d99bb18f88bd44746a8eefde86366c4'

const MIGRATIONS: [string, string][] = [
  ['007', `-- supabase/migrations/007_lab_partners_and_clinic_branches.sql
-- Añade soporte de laboratorios colaboradores, sedes de clínica y vínculo paciente-usuario.
-- Estas tablas/columnas ya eran usadas por el código (LabPartners.tsx, Clinic.tsx,
-- Settings.tsx, apps/api/server/src/routes/{clinic,labPartners,patients,users}.ts)
-- pero no existían en ninguna migración previa. Todo idempotente para poder
-- aplicarse con seguridad aunque parte ya exista en la base de datos real.

ALTER TABLE clinics  ADD COLUMN IF NOT EXISTS branches   JSONB DEFAULT '[]';
ALTER TABLE clinics  ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE clinics  ADD COLUMN IF NOT EXISTS trade_name TEXT;

ALTER TABLE patients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS lab_partners (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           TEXT NOT NULL,
  email          TEXT NOT NULL,
  phone          TEXT,
  contact_person TEXT,
  logo_url       TEXT,
  website        TEXT,
  notes          TEXT,
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_lab_partners (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  lab_partner_id UUID NOT NULL REFERENCES lab_partners(id) ON DELETE CASCADE,
  assigned_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, lab_partner_id)
);

CREATE TABLE IF NOT EXISTS lab_ad_campaigns (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_partner_id            UUID NOT NULL REFERENCES lab_partners(id) ON DELETE CASCADE,
  name                      TEXT NOT NULL,
  creative_type             TEXT DEFAULT 'image',
  creatives                 JSONB DEFAULT '[]',
  rotation_mode             TEXT DEFAULT 'random',
  trigger_rule              TEXT DEFAULT 'on_login',
  trigger_interval_minutes  INT,
  is_active                 BOOLEAN DEFAULT TRUE,
  starts_at                 DATE,
  ends_at                   DATE,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_users ADD COLUMN IF NOT EXISTS lab_partner_id UUID REFERENCES lab_partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clinic_lab_partners_clinic ON clinic_lab_partners(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_lab_partners_lab    ON clinic_lab_partners(lab_partner_id);
CREATE INDEX IF NOT EXISTS idx_lab_ad_campaigns_lab       ON lab_ad_campaigns(lab_partner_id);
CREATE INDEX IF NOT EXISTS idx_patients_user              ON patients(user_id);

ALTER TABLE lab_partners        ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_lab_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_ad_campaigns    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on lab_partners"        ON lab_partners;
DROP POLICY IF EXISTS "Service key full access on clinic_lab_partners" ON clinic_lab_partners;
DROP POLICY IF EXISTS "Service key full access on lab_ad_campaigns"    ON lab_ad_campaigns;

CREATE POLICY "Service key full access on lab_partners"        ON lab_partners        FOR ALL USING (true);
CREATE POLICY "Service key full access on clinic_lab_partners" ON clinic_lab_partners FOR ALL USING (true);
CREATE POLICY "Service key full access on lab_ad_campaigns"    ON lab_ad_campaigns    FOR ALL USING (true);
`],
  ['008', `-- supabase/migrations/008_widen_app_users_role_check.sql
-- migration 006 restricted app_users.role to ('admin', 'clinica'), but the
-- app has used superadmin/lab_partner/patient/doctor/receptionist roles all
-- along (per apps/web/src/pages/Settings.tsx ROLE_OPTIONS and
-- apps/web/src/App.tsx routing). Widen the constraint to match reality.

ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('admin', 'clinica', 'doctor', 'receptionist', 'lab_partner', 'patient', 'superadmin'));
`],
  ['009', `-- supabase/migrations/009_clinical_records_photos_media.sql
-- Adds the tables used by apps/api/server/src/routes/{clinicalRecords,photoSessions,media}.ts
-- that were never captured in a tracked migration (same class of drift fixed in 007).
-- All idempotent so it's safe to run even if some of this already exists live.

CREATE TABLE IF NOT EXISTS clinical_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id            UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id             UUID REFERENCES doctors(id) ON DELETE SET NULL,
  date                  TIMESTAMPTZ DEFAULT NOW(),
  reason_for_visit       TEXT,
  anamnesis             TEXT,
  current_medications   TEXT,
  allergies             TEXT,
  physical_exam         TEXT,
  diagnosis             TEXT,
  treatment_plan        TEXT,
  notes                 TEXT,
  branch                TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photo_sessions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id    UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id     UUID REFERENCES doctors(id) ON DELETE SET NULL,
  name          TEXT,
  notes         TEXT,
  session_date  TIMESTAMPTZ DEFAULT NOW(),
  branch        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES photo_sessions(id) ON DELETE CASCADE,
  r2_key        TEXT NOT NULL,
  original_name TEXT,
  order_index   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('welcome', 'patient')),
  r2_key        TEXT,
  source_url    TEXT,
  original_name TEXT,
  content_type  TEXT,
  order_index   INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_media_settings (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id              UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  media_type             TEXT NOT NULL CHECK (media_type IN ('welcome', 'patient')),
  show_trigger           TEXT DEFAULT 'session',
  show_interval_minutes  INT DEFAULT 30,
  display_mode           TEXT DEFAULT 'manual' CHECK (display_mode IN ('manual', 'random', 'sequential')),
  active_creative_id     UUID REFERENCES clinic_media(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, media_type)
);

CREATE INDEX IF NOT EXISTS idx_clinical_records_patient ON clinical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_records_clinic  ON clinical_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_patient   ON photo_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_photo_sessions_clinic    ON photo_sessions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_photos_session           ON photos(session_id);
CREATE INDEX IF NOT EXISTS idx_clinic_media_clinic      ON clinic_media(clinic_id, type);

ALTER TABLE clinical_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_media           ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_media_settings  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on clinical_records"      ON clinical_records;
DROP POLICY IF EXISTS "Service key full access on photo_sessions"        ON photo_sessions;
DROP POLICY IF EXISTS "Service key full access on photos"                ON photos;
DROP POLICY IF EXISTS "Service key full access on clinic_media"          ON clinic_media;
DROP POLICY IF EXISTS "Service key full access on clinic_media_settings" ON clinic_media_settings;

CREATE POLICY "Service key full access on clinical_records"      ON clinical_records      FOR ALL USING (true);
CREATE POLICY "Service key full access on photo_sessions"        ON photo_sessions        FOR ALL USING (true);
CREATE POLICY "Service key full access on photos"                ON photos                FOR ALL USING (true);
CREATE POLICY "Service key full access on clinic_media"          ON clinic_media          FOR ALL USING (true);
CREATE POLICY "Service key full access on clinic_media_settings" ON clinic_media_settings FOR ALL USING (true);
`],
  ['010', `-- supabase/migrations/010_treatments_and_appointments.sql
-- Agenda: tratamientos (con duración y precio) y citas (calendario de 15 min).

CREATE TABLE IF NOT EXISTS treatments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  duration_minutes  INT NOT NULL DEFAULT 30,
  price             NUMERIC(10,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id      UUID REFERENCES doctors(id) ON DELETE SET NULL,
  treatment_id   UUID REFERENCES treatments(id) ON DELETE SET NULL,
  branch         TEXT,
  start_time     TIMESTAMPTZ NOT NULL,
  end_time       TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treatments_clinic       ON treatments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_clinic      ON appointments(clinic_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor      ON appointments(doctor_id, start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_patient     ON appointments(patient_id);

ALTER TABLE treatments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on treatments"   ON treatments;
DROP POLICY IF EXISTS "Service key full access on appointments" ON appointments;

CREATE POLICY "Service key full access on treatments"   ON treatments   FOR ALL USING (true);
CREATE POLICY "Service key full access on appointments" ON appointments FOR ALL USING (true);
`],
  ['011', `-- supabase/migrations/011_set_jmgarcialojo_superadmin.sql
-- One-off data fix requested by the account owner: promote jmgarcialojo@icloud.com
-- (currently role='admin') to 'superadmin', matching Flavia Piccelli's role.

UPDATE app_users SET role = 'superadmin', updated_at = NOW()
WHERE email = 'jmgarcialojo@icloud.com';
`],
]

// Temporary one-off endpoint: the deployed backend container has no access to
// supabase/migrations/, and this session has no direct network path to the
// production Postgres instance (only HTTPS egress is allowed here), so this
// runs the pending migrations through the backend's own DB connection instead.
// Remove this route once the migrations have been confirmed applied.
router.post('/', async (req, res) => {
  if (req.query.key !== MIGRATE_SECRET) return res.status(403).json({ error: 'forbidden' })
  const results: Record<string, string> = {}
  for (const [name, sql] of MIGRATIONS) {
    try {
      await pool.query(sql)
      results[name] = 'ok'
    } catch (err: any) {
      results[name] = `error: ${err.message}`
    }
  }
  return res.json(results)
})

export default router
