-- clinic_api_config ya existe en producción (creada fuera del historial de
-- migraciones); CREATE TABLE IF NOT EXISTS aquí es solo una salvaguarda para
-- entornos donde no exista todavía, con el mismo esquema que espera clinicConfig.ts.
CREATE TABLE IF NOT EXISTS clinic_api_config (
  clinic_id           UUID PRIMARY KEY,
  ycloud_api_key      TEXT,
  anthropic_api_key   TEXT,
  retell_api_key      TEXT,
  knowledge_base      TEXT,
  prompt              TEXT,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- API key de Make.com (automatizaciones) para enlazar leads de la clínica.
ALTER TABLE clinic_api_config ADD COLUMN IF NOT EXISTS make_api_key TEXT;

ALTER TABLE clinic_api_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinic_api_config_all ON clinic_api_config;
CREATE POLICY clinic_api_config_all ON clinic_api_config FOR ALL USING (true);
