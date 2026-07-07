-- supabase/migrations/018_toxin_extra.sql
-- Ampliación del control de toxina: viales abiertos, firma del médico en el
-- propio registro, y vínculo opcional con el consentimiento informado del
-- paciente (consent_records, no "consents" — esa tabla no existe en este
-- esquema; el nombre real ya se usaba en 001_init.sql / consents.ts).

ALTER TABLE toxin_records
  ADD COLUMN IF NOT EXISTS vials_opened     INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS consent_id       UUID REFERENCES consent_records(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS doctor_signature TEXT,
  ADD COLUMN IF NOT EXISTS doctor_signed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_toxin_consent ON toxin_records(consent_id);
