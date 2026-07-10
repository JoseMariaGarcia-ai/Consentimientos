-- Control horario (registro de jornada) — RDL 8/2019 (art. 34.9 ET), ya
-- alineado con los requisitos técnicos del borrador de reforma 2026
-- (trazabilidad inmutable por hash encadenado, exportación verificable).
--
-- Biometría excluida a propósito: la AEPD considera el fichaje por huella o
-- reconocimiento facial desproporcionado salvo casos excepcionales, y el
-- borrador de reforma 2026 lo prohíbe expresamente. No es una limitación
-- técnica — no se debe añadir sin revisar antes la normativa vigente.

CREATE TABLE IF NOT EXISTS employees (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  -- Si el empleado tiene acceso a la app (por ejemplo un doctor o
  -- recepcionista con user de tipo "clinica"), se enlaza aquí para que
  -- pueda ver su propio historial sin depender del administrador. Un
  -- empleado sin cuenta (p. ej. solo ficha por PIN en el terminal) puede
  -- no tener app_user_id.
  app_user_id   UUID REFERENCES app_users(id) ON DELETE SET NULL,
  full_name     TEXT NOT NULL,
  dni_nie       TEXT NOT NULL,
  role          TEXT,
  email         TEXT,
  -- PIN de fichaje en terminal fijo — nunca en texto plano.
  pin_hash      TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clinic_id, dni_nie)
);

CREATE TABLE IF NOT EXISTS time_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES employees(id),
  record_type     TEXT NOT NULL CHECK (record_type IN ('entrada', 'salida', 'inicio_pausa', 'fin_pausa')),
  timestamp_utc   TIMESTAMPTZ NOT NULL,
  method          TEXT NOT NULL CHECK (method IN ('web', 'qr', 'pin')),
  latitude        NUMERIC(10,7),
  longitude       NUMERIC(10,7),
  ip_address      TEXT,
  device_info     TEXT,
  record_hash     TEXT NOT NULL,
  previous_hash   TEXT, -- hash del fichaje anterior DEL MISMO EMPLEADO
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Igual que las facturas: nunca se borra ni edita un fichaje ya guardado.
-- Una corrección queda documentada aquí, con quién, cuándo y por qué,
-- sin tocar el registro original.
CREATE TABLE IF NOT EXISTS time_record_edits (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_record_id  UUID NOT NULL REFERENCES time_records(id),
  clinic_id            UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  edited_by            UUID NOT NULL REFERENCES app_users(id),
  reason               TEXT NOT NULL,
  old_timestamp        TIMESTAMPTZ,
  new_timestamp        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Cómo se compensan las horas extra de un empleado en un periodo dado —
-- campo editable del panel de administración, no calculado automáticamente
-- (la ley no impone una forma concreta de compensación, solo que quede
-- documentada).
CREATE TABLE IF NOT EXISTS overtime_compensations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id         UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  employee_id       UUID NOT NULL REFERENCES employees(id),
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('economica', 'descanso')),
  notes             TEXT,
  created_by        UUID NOT NULL REFERENCES app_users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overtime_comp_employee ON overtime_compensations(employee_id, period_start);

ALTER TABLE overtime_compensations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on overtime_compensations" ON overtime_compensations;
CREATE POLICY "Service key full access on overtime_compensations" ON overtime_compensations FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_employees_clinic       ON employees(clinic_id);
CREATE INDEX IF NOT EXISTS idx_time_records_clinic     ON time_records(clinic_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_time_records_employee   ON time_records(employee_id, timestamp_utc DESC);
CREATE INDEX IF NOT EXISTS idx_time_record_edits_orig  ON time_record_edits(original_record_id);

ALTER TABLE employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_record_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on employees"         ON employees;
DROP POLICY IF EXISTS "Service key full access on time_records"      ON time_records;
DROP POLICY IF EXISTS "Service key full access on time_record_edits" ON time_record_edits;
CREATE POLICY "Service key full access on employees"         ON employees         FOR ALL USING (true);
CREATE POLICY "Service key full access on time_records"      ON time_records      FOR ALL USING (true);
CREATE POLICY "Service key full access on time_record_edits" ON time_record_edits FOR ALL USING (true);

-- Qué métodos de fichaje tiene activos cada clínica (configurable en el
-- propio módulo). Por defecto: fichaje en un clic desde la web, la opción
-- más simple y completa, tal como pide el documento de requisitos.
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS time_tracking_methods TEXT[] NOT NULL DEFAULT ARRAY['web']::TEXT[];

-- Nuevo módulo de menú "Control horario" — igual que facturación, no
-- incluido en el plan Base; 'redes' hereda de ia-plus como el resto.
INSERT INTO plan_permissions (plan, module, can_access) VALUES
  ('base', 'time-tracking', false),
  ('pro', 'time-tracking', true),
  ('ia', 'time-tracking', true),
  ('ia-plus', 'time-tracking', true)
ON CONFLICT (plan, module) DO NOTHING;

INSERT INTO plan_permissions (plan, module, can_access)
SELECT 'redes', 'time-tracking', can_access FROM plan_permissions WHERE plan = 'ia-plus' AND module = 'time-tracking'
ON CONFLICT (plan, module) DO NOTHING;
