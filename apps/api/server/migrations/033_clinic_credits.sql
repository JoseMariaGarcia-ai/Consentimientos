-- Igual que 031/032: la tabla clinic_credits del sistema de créditos
-- (commit "feat: sistema de créditos con alertas, recarga y submenús en
-- ajustes") se creó a mano en Railway y nunca se versionó como migración.
-- Sin esta tabla, deductCredit() lanza "relation clinic_credits does not
-- exist" en cualquier base de datos nueva, bloqueando por completo la
-- creación de consentimientos, historias clínicas y sesiones de fotos.

CREATE TABLE IF NOT EXISTS clinic_credits (
  clinic_id                  UUID PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  consents_available         INTEGER NOT NULL DEFAULT 10,
  clinical_records_available INTEGER NOT NULL DEFAULT 10,
  photo_sessions_available   INTEGER NOT NULL DEFAULT 10,
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- Clínicas ya existentes en una base de datos nueva arrancan también con
-- 10 créditos de cada tipo, igual que se hizo a mano en su momento en Railway.
INSERT INTO clinic_credits (clinic_id)
SELECT id FROM clinics
ON CONFLICT (clinic_id) DO NOTHING;
