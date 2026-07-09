-- Facturación de suscripciones vía Stripe (planes de apps/web/src/pages/Recharge.tsx).
-- También añade 'redes' como plan válido — se creó después de la migración
-- 021 y aún no estaba en la restricción ni en plan_permissions.

ALTER TABLE clinics DROP CONSTRAINT IF EXISTS clinics_plan_check;
ALTER TABLE clinics ADD CONSTRAINT clinics_plan_check
  CHECK (plan IN ('base', 'pro', 'ia', 'ia-plus', 'redes'));

ALTER TABLE plan_permissions DROP CONSTRAINT IF EXISTS plan_permissions_plan_check;
ALTER TABLE plan_permissions ADD CONSTRAINT plan_permissions_plan_check
  CHECK (plan IN ('base', 'pro', 'ia', 'ia-plus', 'redes'));

-- Plan Redes incluye "Todo el Plan IA Premium +", así que hereda el mismo
-- acceso a módulos que ia-plus (la gestión de redes en sí la presta el
-- equipo de ConsentsPro, no añade una sección nueva dentro de la app).
INSERT INTO plan_permissions (plan, module, can_access)
SELECT 'redes', module, can_access FROM plan_permissions WHERE plan = 'ia-plus'
ON CONFLICT (plan, module) DO NOTHING;

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

CREATE TABLE IF NOT EXISTS subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id              UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  plan_id                TEXT NOT NULL,
  billing_cycle          TEXT NOT NULL DEFAULT 'monthly',
  stripe_customer_id     TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'incomplete',
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN DEFAULT FALSE,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_clinic ON subscriptions(clinic_id);

-- Registro de eventos de Stripe ya procesados, para ignorar reintentos duplicados del webhook.
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL,
  received_at TIMESTAMPTZ DEFAULT NOW()
);
