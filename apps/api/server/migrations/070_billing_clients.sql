-- Ampliación del módulo de facturación: clientes no-paciente reutilizables
-- (billing_clients) y sección de facturas emitidas con envío por email.
-- AISLAMIENTO: billing_clients se filtra siempre por clinic_id, igual que
-- el resto de catálogos de la clínica (treatments, doctors...).

CREATE TABLE IF NOT EXISTS billing_clients (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id    UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  tax_id       TEXT NOT NULL, -- NIF/CIF, obligatorio para facturar
  address      TEXT NOT NULL,
  postal_code  TEXT,
  city         TEXT,
  province     TEXT,
  email        TEXT,
  phone        TEXT,
  notes        TEXT,
  -- Un cliente con facturas emitidas nunca se borra (mismo criterio de
  -- conservación que el resto del sistema) — se marca inactivo en su lugar
  -- y deja de ofrecerse como destinatario para facturas nuevas, pero las ya
  -- emitidas conservan su copia de los datos y no se ven afectadas.
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_by   UUID NOT NULL REFERENCES app_users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_clients_clinic ON billing_clients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_billing_clients_taxid  ON billing_clients(clinic_id, tax_id);

ALTER TABLE billing_clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on billing_clients" ON billing_clients;
CREATE POLICY "Service key full access on billing_clients" ON billing_clients FOR ALL USING (true);

-- invoices.patient_id ya existe desde el módulo original (036) y siempre ha
-- podido quedar NULL: InvoiceModal ya permite facturar a un tercero sin
-- seleccionar paciente, rellenando los datos a mano ("modo manual"). Por
-- eso recipient_type tiene TRES valores, no dos como en la especificación
-- genérica — 'manual' preserva ese caso ya existente, que de lo contrario
-- la nueva restricción CHECK habría roto para las facturas ya emitidas así.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recipient_type TEXT NOT NULL DEFAULT 'manual';
UPDATE invoices SET recipient_type = 'paciente' WHERE patient_id IS NOT NULL AND recipient_type = 'manual';

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS billing_client_id UUID REFERENCES billing_clients(id);

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_recipient_type_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_recipient_type_check
  CHECK (recipient_type IN ('paciente', 'cliente', 'manual'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_invoice_recipient;
ALTER TABLE invoices ADD CONSTRAINT chk_invoice_recipient
  CHECK (
    (recipient_type = 'paciente' AND patient_id IS NOT NULL AND billing_client_id IS NULL)
    OR
    (recipient_type = 'cliente' AND billing_client_id IS NOT NULL AND patient_id IS NULL)
    OR
    (recipient_type = 'manual' AND patient_id IS NULL AND billing_client_id IS NULL)
  );

CREATE INDEX IF NOT EXISTS idx_invoices_billing_client ON invoices(billing_client_id);

-- Registrar el envío manual de una factura por email (punto 4.3 de la
-- ampliación) en la misma tabla de eventos ya usada para creación/anulación.
ALTER TABLE invoice_events DROP CONSTRAINT IF EXISTS invoice_events_event_type_check;
ALTER TABLE invoice_events ADD CONSTRAINT invoice_events_event_type_check
  CHECK (event_type IN ('creacion', 'envio_aeat', 'anulacion', 'alarma_integridad', 'envio_manual_email'));
