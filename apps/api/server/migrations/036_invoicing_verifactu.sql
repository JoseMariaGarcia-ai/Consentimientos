-- Facturación con VeriFactu (RD 1007/2023 / RRSIF) — factura, registro de
-- facturación con hash encadenado (SHA-256) y bitácora de eventos por
-- clínica. Gestionado desde el nuevo módulo "Facturación" del menú
-- principal (Configuración > Planes controla a qué planes se les concede).
--
-- El envío efectivo a la AEAT (modalidad VERI*FACTU) depende del esquema
-- XSD y del endpoint del servicio web vigentes en la Sede Electrónica de
-- la AEAT en el momento de la implementación — ver src/lib/aeatSubmission.ts
-- para el estado actual de esa integración.

CREATE TABLE IF NOT EXISTS invoices (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id            UUID REFERENCES patients(id) ON DELETE SET NULL,
  series                TEXT NOT NULL DEFAULT 'A',
  invoice_number        TEXT NOT NULL, -- serie + número correlativo, ej. A-0001
  issue_date            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  taxpayer_type         TEXT NOT NULL CHECK (taxpayer_type IN ('empresa', 'autonomo')),
  -- Datos del emisor (la clínica) fotografiados en el momento de emitir la
  -- factura — igual que budget_items congela nombre/precio del tratamiento,
  -- una factura no debe cambiar de contenido si luego se edita la ficha de
  -- la clínica.
  issuer_name           TEXT NOT NULL,
  issuer_nif            TEXT NOT NULL,
  recipient_name         TEXT NOT NULL,
  recipient_nif          TEXT NOT NULL,
  recipient_address      TEXT,
  concept                TEXT NOT NULL,
  base_amount            NUMERIC(10,2) NOT NULL,
  vat_rate               NUMERIC(5,2) NOT NULL DEFAULT 21.00,
  vat_amount              NUMERIC(10,2) NOT NULL,
  total_amount            NUMERIC(10,2) NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'emitida' CHECK (status IN ('emitida', 'anulada', 'rectificada')),
  rectifies_invoice_id    UUID REFERENCES invoices(id),
  created_by              UUID NOT NULL REFERENCES app_users(id),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (clinic_id, series, invoice_number)
);

CREATE TABLE IF NOT EXISTS invoice_records (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id            UUID NOT NULL REFERENCES invoices(id),
  clinic_id             UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  record_type           TEXT NOT NULL CHECK (record_type IN ('alta', 'anulacion')),
  previous_hash         TEXT, -- hash del registro cronológicamente anterior DE ESTA CLÍNICA
  record_hash            TEXT NOT NULL,
  qr_content              TEXT NOT NULL,
  aeat_sent_at            TIMESTAMPTZ,
  aeat_response_status     TEXT,
  aeat_response_raw        JSONB,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoice_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID REFERENCES invoices(id),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL CHECK (event_type IN ('creacion', 'envio_aeat', 'anulacion', 'alarma_integridad')),
  description   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_clinic         ON invoices(clinic_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_patient         ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoice_records_invoice  ON invoice_records(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_records_clinic   ON invoice_records(clinic_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_events_clinic    ON invoice_events(clinic_id, created_at DESC);

ALTER TABLE invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_events  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on invoices"        ON invoices;
DROP POLICY IF EXISTS "Service key full access on invoice_records" ON invoice_records;
DROP POLICY IF EXISTS "Service key full access on invoice_events"  ON invoice_events;
CREATE POLICY "Service key full access on invoices"        ON invoices        FOR ALL USING (true);
CREATE POLICY "Service key full access on invoice_records" ON invoice_records FOR ALL USING (true);
CREATE POLICY "Service key full access on invoice_events"  ON invoice_events  FOR ALL USING (true);

-- Nuevo módulo de menú "Facturación" — visible según el plan, igual que
-- "budgets". No incluido en el plan Base (es una función avanzada de
-- cumplimiento fiscal); 'redes' hereda lo mismo que ia-plus, como el resto
-- de módulos de ese plan (ver migración 029).
INSERT INTO plan_permissions (plan, module, can_access) VALUES
  ('base', 'invoicing', false),
  ('pro', 'invoicing', true),
  ('ia', 'invoicing', true),
  ('ia-plus', 'invoicing', true)
ON CONFLICT (plan, module) DO NOTHING;

INSERT INTO plan_permissions (plan, module, can_access)
SELECT 'redes', 'invoicing', can_access FROM plan_permissions WHERE plan = 'ia-plus' AND module = 'invoicing'
ON CONFLICT (plan, module) DO NOTHING;
