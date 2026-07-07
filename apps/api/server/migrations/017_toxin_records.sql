-- supabase/migrations/017_toxin_records.sql
-- Control de trazabilidad de toxina botulínica: lote, caducidad, fabricante,
-- zonas tratadas y unidades aplicadas por sesión. clinic_id garantiza el
-- aislamiento — cada clínica ve únicamente sus propios registros.

CREATE TABLE IF NOT EXISTS toxin_records (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id        UUID REFERENCES doctors(id) ON DELETE SET NULL,
  application_date TIMESTAMPTZ NOT NULL,
  brand_name       TEXT NOT NULL,
  lot_number       TEXT NOT NULL,
  expiry_date      DATE NOT NULL,
  manufacturer     TEXT NOT NULL,
  treated_zones    JSONB NOT NULL DEFAULT '[]', -- [{"zone":"Frente","units":20}, ...]
  total_units      INT NOT NULL DEFAULT 0,
  notes            TEXT,
  created_by       UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_toxin_clinic  ON toxin_records(clinic_id);
CREATE INDEX IF NOT EXISTS idx_toxin_patient ON toxin_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_toxin_doctor  ON toxin_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_toxin_lot     ON toxin_records(lot_number);
CREATE INDEX IF NOT EXISTS idx_toxin_date    ON toxin_records(application_date);

ALTER TABLE toxin_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on toxin_records" ON toxin_records;
CREATE POLICY "Service key full access on toxin_records" ON toxin_records FOR ALL USING (true);
