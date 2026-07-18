-- Ampliación del módulo de facturación: los tres mecanismos correctos de
-- corregir una factura (anulación simple, rectificativa, abono) y el
-- estado de cobro, como dimensión independiente del estado fiscal.
--
-- REGLA DE ORO: ninguna factura ya emitida se edita ni se borra jamás.
-- Toda corrección se resuelve con un INSERT nuevo (invoice_corrections +,
-- salvo la anulación simple, una nueva fila en invoices con su propio
-- registro de hash encadenado) — nunca un UPDATE de campos fiscales sobre
-- la factura original. Solo status y payment_status pueden cambiar en la
-- original, y ninguno de los dos es un dato fiscal (importe/concepto/
-- hash/fecha).
--
-- Nota de adaptación: el documento de ampliación usa amount_cents BIGINT
-- para los importes de invoice_corrections/invoice_payments, pero el resto
-- de esta tabla (y de todo el módulo de facturación) usa NUMERIC(10,2) en
-- euros directamente (base_amount, vat_amount, total_amount) — se sigue
-- esa misma convención aquí para no introducir una conversión cents↔euros
-- que no existe en ningún otro sitio del sistema.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_kind TEXT NOT NULL DEFAULT 'ordinaria';
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_kind_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_invoice_kind_check
  CHECK (invoice_kind IN ('ordinaria', 'rectificativa', 'abono'));

-- Estado de COBRO — independiente del estado fiscal (status). Se recalcula
-- siempre en el backend a partir de invoice_payments, nunca se edita a mano.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_status_check
  CHECK (payment_status IN ('pendiente', 'parcial', 'cobrada'));

CREATE TABLE IF NOT EXISTS invoice_corrections (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id              UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  original_invoice_id    UUID NOT NULL REFERENCES invoices(id),
  correction_invoice_id  UUID REFERENCES invoices(id), -- NULL en anulación simple (no genera factura nueva)
  correction_type        TEXT NOT NULL CHECK (correction_type IN ('anulacion', 'rectificativa', 'abono')),
  reason                 TEXT NOT NULL,
  amount                 NUMERIC(10,2), -- importe de la corrección; NULL en anulación simple
  requested_by           UUID NOT NULL REFERENCES app_users(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_corr_original ON invoice_corrections(original_invoice_id);
CREATE INDEX IF NOT EXISTS idx_inv_corr_clinic ON invoice_corrections(clinic_id, created_at DESC);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  invoice_id     UUID NOT NULL REFERENCES invoices(id),
  amount         NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('efectivo', 'transferencia', 'bizum', 'tarjeta', 'stripe', 'otro')),
  payment_date   DATE NOT NULL,
  notes          TEXT,
  registered_by  UUID NOT NULL REFERENCES app_users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_inv_payments_clinic ON invoice_payments(clinic_id, payment_date DESC);

-- Las rectificativas/abonos generan un evento propio en la factura
-- ORIGINAL para dejar constancia de qué corrección la reemplazó, distinto
-- de 'anulacion' (que es la anulación simple, sin factura nueva).
ALTER TABLE invoice_events DROP CONSTRAINT IF EXISTS invoice_events_event_type_check;
ALTER TABLE invoice_events ADD CONSTRAINT invoice_events_event_type_check
  CHECK (event_type IN ('creacion', 'envio_aeat', 'anulacion', 'alarma_integridad', 'envio_manual_email', 'correccion'));

ALTER TABLE invoice_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments    ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on invoice_corrections" ON invoice_corrections;
DROP POLICY IF EXISTS "Service key full access on invoice_payments"    ON invoice_payments;
CREATE POLICY "Service key full access on invoice_corrections" ON invoice_corrections FOR ALL USING (true);
CREATE POLICY "Service key full access on invoice_payments"    ON invoice_payments    FOR ALL USING (true);
