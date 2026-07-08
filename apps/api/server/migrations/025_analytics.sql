-- Analítica de uso: sesiones de visita y vistas de página, tanto de la
-- landing pública como de la app autenticada. session_key es un UUID
-- generado en el navegador y persistido en localStorage (no cookies).
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key   TEXT UNIQUE NOT NULL,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id       UUID,
  clinic_id     UUID,
  role          TEXT,
  device_type   TEXT,
  browser       TEXT,
  os            TEXT,
  referrer      TEXT,
  landing_path  TEXT,
  user_agent    TEXT
);

CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key   TEXT NOT NULL,
  path          TEXT NOT NULL,
  title         TEXT,
  referrer      TEXT,
  duration_ms   INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_created_at ON analytics_pageviews(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_session    ON analytics_pageviews(session_key);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_last_seen   ON analytics_sessions(last_seen);

ALTER TABLE analytics_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS analytics_sessions_all  ON analytics_sessions;
DROP POLICY IF EXISTS analytics_pageviews_all ON analytics_pageviews;
CREATE POLICY analytics_sessions_all  ON analytics_sessions  FOR ALL USING (true);
CREATE POLICY analytics_pageviews_all ON analytics_pageviews FOR ALL USING (true);
