-- supabase/migrations/001_init.sql
-- MIGRATION TO RAILWAY: This same schema is used in Railway PostgreSQL
-- Only change DATABASE_URL in .env. Prisma works the same.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS clinics (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  logo_url   TEXT,
  address    TEXT,
  tax_id     TEXT UNIQUE,
  phone      TEXT,
  email      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doctors (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID REFERENCES clinics(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  specialty      TEXT,
  license_number TEXT UNIQUE,
  email          TEXT UNIQUE,
  role           TEXT DEFAULT 'doctor',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  date_of_birth DATE,
  id_document   TEXT,
  id_doc_type   TEXT DEFAULT 'DNI',
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  allergies     TEXT,
  medications   TEXT,
  blood_type    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_templates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID REFERENCES clinics(id) ON DELETE CASCADE,
  treatment_type    TEXT NOT NULL,
  version           INT DEFAULT 1,
  is_active         BOOLEAN DEFAULT TRUE,
  content_json      JSONB NOT NULL DEFAULT '{}',
  legal_clauses_json JSONB NOT NULL DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consent_records (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id        UUID REFERENCES patients(id),
  doctor_id         UUID REFERENCES doctors(id),
  template_id       UUID REFERENCES consent_templates(id),
  language          TEXT NOT NULL DEFAULT 'es-ES',
  jurisdiction      TEXT,
  status            TEXT DEFAULT 'pending',
  signature_data_url TEXT,
  biometric_json    JSONB,
  document_hash     TEXT,
  consent_uuid      UUID UNIQUE DEFAULT uuid_generate_v4(),
  client_timestamp  TIMESTAMPTZ,
  server_timestamp  TIMESTAMPTZ,
  ip_address        TEXT,
  user_agent        TEXT,
  pdf_url           TEXT,
  signed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consent_id UUID UNIQUE REFERENCES consent_records(id),
  log_json   JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic   ON patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_name     ON patients USING gin(to_tsvector('spanish', full_name));
CREATE INDEX IF NOT EXISTS idx_consents_patient  ON consent_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_consents_status   ON consent_records(status);
CREATE INDEX IF NOT EXISTS idx_templates_clinic  ON consent_templates(clinic_id);

ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors          ENABLE ROW LEVEL SECURITY;
