-- Incidencias de control horario: olvido de fichaje y ausencias justificadas
-- o injustificadas. Diseño alineado con RDL 8/2019 (art. 34.9 ET):
--
-- 1. "Olvido de fichaje" es una corrección de un día realmente trabajado —
--    al aprobarse SÍ se crea el fichaje que faltaba (con la hora que se
--    justifica), encadenado igual que cualquier otro, marcado method='manual'
--    para que quede visualmente distinguible de un fichaje capturado en vivo.
--
-- 2. "Ausencia" es un día NO trabajado — al aprobarse NUNCA se crea un
--    fichaje simulando horas trabajadas que no existieron (sería falsear el
--    registro de jornada). Solo queda documentada la ausencia con su motivo;
--    ese día sigue sin fichajes y con 0 horas en los cálculos, pero con la
--    justificación visible para una inspección.
--
-- El propio empleado puede reportar una incidencia, pero nunca autoaprobarla
-- — solo un responsable de la clínica puede resolver (aprobar/rechazar),
-- igual que las correcciones de fichajes ya existentes (time_record_edits).
ALTER TABLE time_records DROP CONSTRAINT IF EXISTS time_records_method_check;
ALTER TABLE time_records ADD CONSTRAINT time_records_method_check
  CHECK (method IN ('web', 'qr', 'pin', 'manual'));

CREATE TABLE IF NOT EXISTS time_incidents (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id          UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  employee_id        UUID NOT NULL REFERENCES employees(id),
  incident_type      TEXT NOT NULL CHECK (incident_type IN (
                        'olvido_entrada', 'olvido_salida',
                        'ausencia_justificada', 'ausencia_injustificada', 'otro'
                      )),
  -- Solo para olvido_entrada/olvido_salida: la fecha/hora real que se propone.
  proposed_timestamp TIMESTAMPTZ,
  -- Solo para ausencias: el rango de días que cubre (puede ser un único día).
  date_from          DATE,
  date_to            DATE,
  reason             TEXT NOT NULL,
  reported_by        UUID NOT NULL REFERENCES app_users(id),
  status             TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobada', 'rechazada')),
  resolved_by        UUID REFERENCES app_users(id),
  resolved_at        TIMESTAMPTZ,
  resolution_notes   TEXT,
  -- Solo se rellena si se aprobó un olvido y se creó el fichaje que faltaba.
  created_record_id  UUID REFERENCES time_records(id),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_incidents_clinic   ON time_incidents(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_time_incidents_employee ON time_incidents(employee_id, created_at DESC);

ALTER TABLE time_incidents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on time_incidents" ON time_incidents;
CREATE POLICY "Service key full access on time_incidents" ON time_incidents FOR ALL USING (true);
