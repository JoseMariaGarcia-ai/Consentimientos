-- Firma en tablet/móvil de la clínica: la tablet se empareja una vez (QR) y
-- queda como "estación de firma" fija; el ordenador le manda consentimientos
-- para firmar allí (doctor + paciente) sin necesidad de login por email en
-- un dispositivo compartido.

-- doctor_signature_data_url/doctor_signed_at ya se usaban en signature.ts y
-- consentPdf.tsx pero nunca se añadieron a consent_records (solo existían en
-- toxin_records, una tabla distinta) — sin esto, firmar como médico fallaba.
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS doctor_signature_data_url TEXT;
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS doctor_signed_at TIMESTAMPTZ;

-- Tablets/móviles emparejados con una clínica para firmar en modo kiosko.
CREATE TABLE IF NOT EXISTS signing_devices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id          UUID NOT NULL,
  name               TEXT NOT NULL DEFAULT 'Tablet de firma',
  device_token_hash  TEXT NOT NULL UNIQUE,
  created_by         UUID,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at       TIMESTAMPTZ,
  revoked_at         TIMESTAMPTZ
);

-- Código de emparejamiento de un solo uso (QR), caduca a los pocos minutos.
CREATE TABLE IF NOT EXISTS signing_device_pairing_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID NOT NULL,
  device_name TEXT NOT NULL DEFAULT 'Tablet de firma',
  code_hash   TEXT NOT NULL UNIQUE,
  created_by  UUID,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cola: qué consentimiento se ha enviado a firmar a qué tablet.
CREATE TABLE IF NOT EXISTS consent_signing_handoffs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL,
  consent_id    UUID NOT NULL REFERENCES consent_records(id) ON DELETE CASCADE,
  device_id     UUID REFERENCES signing_devices(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','claimed','completed','cancelled')),
  created_by    UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_signing_devices_clinic       ON signing_devices(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pairing_codes_clinic         ON signing_device_pairing_codes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_clinic_status       ON consent_signing_handoffs(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_handoffs_consent             ON consent_signing_handoffs(consent_id);

ALTER TABLE signing_devices              ENABLE ROW LEVEL SECURITY;
ALTER TABLE signing_device_pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_signing_handoffs     ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS signing_devices_all              ON signing_devices;
DROP POLICY IF EXISTS signing_device_pairing_codes_all  ON signing_device_pairing_codes;
DROP POLICY IF EXISTS consent_signing_handoffs_all      ON consent_signing_handoffs;
CREATE POLICY signing_devices_all             ON signing_devices             FOR ALL USING (true);
CREATE POLICY signing_device_pairing_codes_all ON signing_device_pairing_codes FOR ALL USING (true);
CREATE POLICY consent_signing_handoffs_all    ON consent_signing_handoffs    FOR ALL USING (true);
