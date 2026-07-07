-- supabase/migrations/010_treatments_and_appointments.sql
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
