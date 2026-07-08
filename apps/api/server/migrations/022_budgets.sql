-- Presupuestos: nombre del paciente y uno o varios tratamientos con precio
-- (autocompletado desde treatments, editable, o añadido a mano), guardados
-- por clínica, con PDF y envío por email al paciente.

CREATE TABLE IF NOT EXISTS budgets (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id     UUID REFERENCES patients(id) ON DELETE SET NULL,
  budget_number  TEXT NOT NULL,
  notes          TEXT,
  valid_until    DATE,
  created_by     UUID REFERENCES app_users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Treatment name and price are snapshotted at creation time (not just a
-- treatment_id FK) so later edits to the treatments catalog never change
-- the amount of a budget that was already sent to a patient.
CREATE TABLE IF NOT EXISTS budget_items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  budget_id      UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  treatment_id   UUID REFERENCES treatments(id) ON DELETE SET NULL,
  treatment_name TEXT NOT NULL,
  price          NUMERIC(10,2) NOT NULL DEFAULT 0,
  sort_order     INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_budgets_clinic      ON budgets(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_budgets_patient     ON budgets(patient_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_budget ON budget_items(budget_id);

ALTER TABLE budgets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on budgets"      ON budgets;
DROP POLICY IF EXISTS "Service key full access on budget_items" ON budget_items;
CREATE POLICY "Service key full access on budgets"      ON budgets      FOR ALL USING (true);
CREATE POLICY "Service key full access on budget_items" ON budget_items FOR ALL USING (true);

-- Grant the new "budgets" module to the plans that already advertise
-- "Presupuestos a Pacientes" (see apps/web/src/pages/Recharge.tsx) — the
-- Base plan does not include it, editable afterward in Configuración >
-- Planes Suscripción.
INSERT INTO plan_permissions (plan, module, can_access) VALUES
  ('base', 'budgets', false),
  ('pro', 'budgets', true),
  ('ia', 'budgets', true),
  ('ia-plus', 'budgets', true)
ON CONFLICT (plan, module) DO NOTHING;
