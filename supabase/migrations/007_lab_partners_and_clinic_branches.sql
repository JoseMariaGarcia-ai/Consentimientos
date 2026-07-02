-- supabase/migrations/007_lab_partners_and_clinic_branches.sql
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
