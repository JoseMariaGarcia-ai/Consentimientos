-- Numeración configurable por serie de facturación. Antes, el número de
-- cada factura se calculaba con COUNT(*) sobre invoices en cada creación —
-- funcionaba, pero no dejaba fijar un punto de partida distinto de 1 (p. ej.
-- una clínica que migra desde otro sistema y ya tiene facturas A-0001 a
-- A-0150 fuera de ConsentsPro, y necesita que la serie A continúe en A-0151
-- aquí para no duplicar numeración).
--
-- next_number es ahora la fuente de verdad: se consume e incrementa de forma
-- atómica en cada factura nueva (dentro del mismo advisory lock por clínica
-- que ya protege la cadena de hashes), en vez de recalcularse por COUNT.
CREATE TABLE IF NOT EXISTS invoice_series (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id   UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  series      TEXT NOT NULL,
  next_number INTEGER NOT NULL DEFAULT 1 CHECK (next_number >= 1),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  UUID REFERENCES app_users(id),
  UNIQUE (clinic_id, series)
);

CREATE INDEX IF NOT EXISTS idx_invoice_series_clinic ON invoice_series(clinic_id);

-- Backfill: las clínicas que ya tienen facturas deben continuar la
-- secuencia exactamente donde iban (COUNT + 1), no reiniciar en 1.
INSERT INTO invoice_series (clinic_id, series, next_number)
SELECT clinic_id, series, COUNT(*) + 1
FROM invoices
GROUP BY clinic_id, series
ON CONFLICT (clinic_id, series) DO NOTHING;
