-- Estadísticas de publicidad más completas: distinguir si una impresión de
-- "patient" fue en pantalla (portal del paciente) o va incluida en un email
-- (bienvenida/consentimiento) — antes ambas sumaban al mismo contador sin
-- forma de diferenciarlas — y cuánto tiempo estuvo visible en pantalla
-- (nunca aplica a email: no hay tracking fiable de apertura, por eso se
-- etiqueta como "enviado" y no como "visto").
ALTER TABLE media_impressions ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'screen' CHECK (channel IN ('screen', 'email'));
ALTER TABLE media_impressions ADD COLUMN IF NOT EXISTS view_duration_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_media_impressions_lab_type_channel ON media_impressions(lab_partner_id, media_type, channel);
