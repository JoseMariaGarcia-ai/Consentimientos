-- Tickets de incidencias/errores reportados por el personal de una clínica,
-- revisados y resueltos por un superadmin.
CREATE TABLE IF NOT EXISTS support_tickets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id    UUID NOT NULL,
  created_by   UUID,
  subject      TEXT NOT NULL,
  description  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_clinic  ON support_tickets(clinic_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status  ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS support_tickets_all ON support_tickets;
CREATE POLICY support_tickets_all ON support_tickets FOR ALL USING (true);
