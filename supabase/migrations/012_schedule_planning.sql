-- supabase/migrations/012_schedule_planning.sql
-- Planificación de agenda: patrón semanal recurrente + excepciones por día
-- concreto (abrir un día especial o cerrar uno normalmente abierto).

CREATE TABLE IF NOT EXISTS schedule_patterns (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  weekday      INT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=domingo … 6=sábado (JS Date.getDay())
  is_open      BOOLEAN NOT NULL DEFAULT false,
  time_ranges  JSONB NOT NULL DEFAULT '[]',                  -- [{"start":"09:00","end":"14:00"}, …]
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, weekday)
);

CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  is_open      BOOLEAN NOT NULL,
  time_ranges  JSONB NOT NULL DEFAULT '[]',
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinic_id, date)
);

CREATE INDEX IF NOT EXISTS idx_schedule_patterns_clinic        ON schedule_patterns(clinic_id);
CREATE INDEX IF NOT EXISTS idx_schedule_exceptions_clinic_date ON schedule_exceptions(clinic_id, date);

ALTER TABLE schedule_patterns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on schedule_patterns"   ON schedule_patterns;
DROP POLICY IF EXISTS "Service key full access on schedule_exceptions" ON schedule_exceptions;

CREATE POLICY "Service key full access on schedule_patterns"   ON schedule_patterns   FOR ALL USING (true);
CREATE POLICY "Service key full access on schedule_exceptions" ON schedule_exceptions FOR ALL USING (true);
