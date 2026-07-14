-- Facturas propias de ConsentsPro para las suscripciones de planes (Base,
-- Pro, IA, IA Premium, Redes) — sustituyen visualmente al PDF nativo de
-- Stripe, que la cuenta comparte con otras actividades del titular y por
-- tanto no puede personalizarse a nivel de cuenta sin afectarlas a todas.
--
-- Identificación de qué facturas son de ConsentsPro: NO se usa una lista de
-- product_id de Stripe (las suscripciones de este sistema se crean con
-- price_data/product_data en línea — ver routes/billing.ts createCheckoutSession
-- — por lo que Stripe no reutiliza un product_id estable entre suscripciones).
-- La fuente de verdad es la propia tabla `subscriptions` de este backend
-- (stripe_subscription_id → clinic_id/plan_id), ya mantenida por el webhook
-- existente: si el invoice.subscription de un invoice.paid no aparece ahí,
-- no es una factura de ConsentsPro y se ignora por completo.

CREATE TABLE IF NOT EXISTS consentspro_invoices (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id               UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  stripe_invoice_id       TEXT NOT NULL UNIQUE,
  stripe_subscription_id  TEXT,
  plan_id                 TEXT NOT NULL,
  amount_cents            BIGINT NOT NULL,
  period_start            DATE NOT NULL,
  period_end              DATE NOT NULL,
  -- Recarga de saldo IA (bono) cobrada dentro del mismo periodo, si la hubo
  -- — se añade como línea informativa adicional en el PDF, no altera
  -- amount_cents (que refleja solo el cobro de esta factura de Stripe).
  ai_credit_topup_cents   BIGINT,
  pdf_r2_key              TEXT, -- clave del objeto en R2 (mismo patrón que clinic_media.r2_key)
  sent_at                 TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cp_invoices_clinic ON consentspro_invoices(clinic_id, created_at DESC);

ALTER TABLE consentspro_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on consentspro_invoices" ON consentspro_invoices;
CREATE POLICY "Service key full access on consentspro_invoices" ON consentspro_invoices FOR ALL USING (true);

-- Override manual del NIF/CIF del emisor (ConsentsPro): la API de Stripe
-- (GET /v1/account) NO devuelve el valor real del NIF/CIF configurado en
-- Settings → Business details — solo un booleano `tax_id_provided`, por
-- motivos de seguridad/cumplimiento (confirmado en la documentación pública
-- de Stripe). El nombre y la dirección del negocio sí son legibles vía API
-- y se leen en vivo; el NIF/CIF se configura aquí una única vez.
INSERT INTO system_settings (key, value) VALUES ('consentspro_issuer_tax_id', '')
ON CONFLICT (key) DO NOTHING;
