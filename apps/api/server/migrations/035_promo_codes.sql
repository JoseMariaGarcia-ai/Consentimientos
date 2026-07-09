-- Códigos promocionales para campañas (p. ej. Meta Ads) que dan acceso con
-- periodo de prueba gratuito a un plan concreto — gestionados desde
-- Configuración > Códigos promocionales (superadmin).

CREATE TABLE IF NOT EXISTS promo_codes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT UNIQUE NOT NULL,
  plan_id       TEXT NOT NULL,
  trial_days    INTEGER NOT NULL DEFAULT 10,
  campaign_name TEXT,
  max_uses      INTEGER,
  used_count    INTEGER NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_by    UUID REFERENCES app_users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Para poder ver en el panel de Suscripciones y en el de Códigos
-- promocionales qué alta vino de qué campaña.
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS promo_code TEXT;

-- Un mismo código sirve para muchos usuarios distintos (max_uses/used_count
-- de arriba limita el total), pero cada email solo puede canjearlo una vez
-- — el UNIQUE es lo que lo hace cumplir de verdad, no solo una comprobación
-- en el código.
CREATE TABLE IF NOT EXISTS promo_code_redemptions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  clinic_id     UUID REFERENCES clinics(id) ON DELETE SET NULL,
  redeemed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (promo_code_id, email)
);
