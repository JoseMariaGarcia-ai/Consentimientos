-- supabase/migrations/009_clinical_records_photos_media.sql
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
