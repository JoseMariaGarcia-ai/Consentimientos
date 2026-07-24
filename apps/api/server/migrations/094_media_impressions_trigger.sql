-- La pantalla de bienvenida puede dispararse en varios contextos distintos
-- (al entrar en sesión, cada cierto intervalo, al firmar un consentimiento,
-- al crear una historia clínica — ver WelcomeMediaModal.tsx/show_trigger),
-- pero hasta ahora todas sumaban al mismo contador sin poder diferenciarlas.
-- Solo aplica a media_type='welcome'; el contenido para paciente no tiene
-- este concepto (se muestra siempre al abrir el portal, o por email).
ALTER TABLE media_impressions ADD COLUMN IF NOT EXISTS trigger TEXT
  CHECK (trigger IS NULL OR trigger IN ('session', 'interval', 'consent', 'clinical'));

CREATE INDEX IF NOT EXISTS idx_media_impressions_lab_trigger ON media_impressions(lab_partner_id, trigger);
