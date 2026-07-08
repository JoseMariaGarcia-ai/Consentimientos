-- Workflows: automatizaciones globales activables/desactivables por un
-- superadmin. Cada fila es una automatización identificada por "key" (el
-- código que la implementa la consulta por ese key). Activa por defecto
-- al crearse.

CREATE TABLE IF NOT EXISTS workflows (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL UNIQUE,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on workflows" ON workflows;
CREATE POLICY "Service key full access on workflows" ON workflows FOR ALL USING (true);

INSERT INTO workflows (key, enabled) VALUES
  ('appointment_confirmation', true)
ON CONFLICT (key) DO NOTHING;
