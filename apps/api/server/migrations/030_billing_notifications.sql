-- Avisos por email del ciclo de facturación (recordatorio de renovación,
-- confirmación, fallo de cobro, desactivación) y enlaces de un clic sin
-- necesidad de iniciar sesión.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS renewal_reminder_sent_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_failed_notified_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS billing_action_tokens (
  token_hash      TEXT PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  clinic_id       UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('cancel', 'portal', 'reactivate')),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_action_tokens_sub ON billing_action_tokens(subscription_id, action);
