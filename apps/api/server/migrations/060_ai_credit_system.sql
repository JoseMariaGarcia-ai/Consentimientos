-- Sistema de saldo prepago único por clínica ("Bono IA") que cubre el
-- consumo del proveedor de IA activo (Anthropic u OpenRouter), Retell (voz)
-- e YCloud (WhatsApp). Bono inicial de 50€, margen del 30% sobre el coste
-- real, avisos de saldo bajo, auto-recarga con Stripe y panel de
-- superadmin de ingresos/gastos por clínica.
--
-- REGLA DE ORO: todos los importes en céntimos (BIGINT), nunca en
-- decimales de coma flotante. Todo el cobro pasa por una única función
-- (lib/creditService.ts → chargeCredit) con SELECT ... FOR UPDATE dentro de
-- una transacción — ningún otro punto del código descuenta saldo.

CREATE TABLE IF NOT EXISTS clinic_credit_accounts (
  id                            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id                     UUID NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
  balance_cents                 BIGINT NOT NULL DEFAULT 0, -- SIEMPRE céntimos, nunca decimal
  -- Importe de la última recarga (manual o automática) — es la base sobre
  -- la que se calculan los porcentajes de aviso de saldo bajo (20/10/5%).
  -- Al crear la cuenta se inicializa con el propio bono de bienvenida.
  last_recharge_amount_cents    BIGINT NOT NULL DEFAULT 5000,
  auto_recharge                 BOOLEAN NOT NULL DEFAULT false,
  auto_recharge_amount_cents    BIGINT NOT NULL DEFAULT 5000, -- 50,00€ por defecto
  auto_recharge_threshold_pct   NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  stripe_payment_method_id      TEXT, -- método de pago guardado (SetupIntent) para auto-recarga
  low_balance_20_notified_at    TIMESTAMPTZ,
  low_balance_10_notified_at    TIMESTAMPTZ,
  low_balance_5_notified_at     TIMESTAMPTZ,
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_transactions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  transaction_type      TEXT NOT NULL CHECK (transaction_type IN ('recarga', 'recarga_automatica', 'consumo', 'ajuste_manual')),
  amount_cents          BIGINT NOT NULL, -- positivo en recargas, negativo en consumo
  balance_after_cents   BIGINT NOT NULL, -- saldo resultante tras esta transacción — clave de la auditoría cruzada
  service               TEXT CHECK (service IN ('anthropic', 'openrouter', 'retell', 'ycloud')), -- null si es recarga/ajuste
  service_reference_id  TEXT, -- id de la llamada/mensaje en el proveedor externo, trazabilidad
  real_cost_cents       BIGINT, -- coste real pagado al proveedor (sin margen), null si es recarga
  margin_cents          BIGINT, -- margen aplicado (30%), null si es recarga
  stripe_payment_id     TEXT,
  notes                 TEXT, -- motivo legible, sobre todo en 'ajuste_manual'
  created_by            UUID REFERENCES app_users(id) ON DELETE SET NULL, -- quién hizo el ajuste manual / recarga
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_clinic  ON credit_transactions(clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_tx_service ON credit_transactions(service);
CREATE INDEX IF NOT EXISTS idx_credit_tx_date    ON credit_transactions(created_at);

ALTER TABLE clinic_credit_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions    ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on clinic_credit_accounts" ON clinic_credit_accounts;
DROP POLICY IF EXISTS "Service key full access on credit_transactions"    ON credit_transactions;
CREATE POLICY "Service key full access on clinic_credit_accounts" ON clinic_credit_accounts FOR ALL USING (true);
CREATE POLICY "Service key full access on credit_transactions"    ON credit_transactions    FOR ALL USING (true);

-- Bono inicial de 50€ para todas las clínicas ya existentes — las nuevas lo
-- reciben de forma perezosa la primera vez que se toca su cuenta
-- (creditService.getOrCreateAccount), así que este backfill es solo para
-- las que ya existían antes de esta migración.
INSERT INTO clinic_credit_accounts (clinic_id, balance_cents, last_recharge_amount_cents)
SELECT id, 5000, 5000 FROM clinics
ON CONFLICT (clinic_id) DO NOTHING;

INSERT INTO credit_transactions (clinic_id, transaction_type, amount_cents, balance_after_cents, notes)
SELECT clinic_id, 'recarga', 5000, 5000, 'Bono inicial de bienvenida'
FROM clinic_credit_accounts
WHERE clinic_id NOT IN (SELECT clinic_id FROM credit_transactions)
ON CONFLICT DO NOTHING;

-- Configuración del agente de voz Retell (distinta del prompt de WhatsApp
-- ya existente en clinic_api_config.prompt) y de activación de cada agente.
ALTER TABLE clinic_api_config ADD COLUMN IF NOT EXISTS retell_prompt TEXT;
ALTER TABLE clinic_api_config ADD COLUMN IF NOT EXISTS retell_llm_id TEXT;
ALTER TABLE clinic_api_config ADD COLUMN IF NOT EXISTS retell_agent_id TEXT;
ALTER TABLE clinic_api_config ADD COLUMN IF NOT EXISTS wa_ai_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clinic_api_config ADD COLUMN IF NOT EXISTS retell_ai_enabled BOOLEAN NOT NULL DEFAULT false;

-- Interruptor central de sistema (no por clínica): qué proveedor de IA
-- procesa las respuestas del agente en cada momento.
CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on system_settings" ON system_settings;
CREATE POLICY "Service key full access on system_settings" ON system_settings FOR ALL USING (true);

INSERT INTO system_settings (key, value) VALUES ('active_ai_provider', 'anthropic')
ON CONFLICT (key) DO NOTHING;

-- Alarmas de la verificación diaria de integridad del saldo (punto 6): si
-- la suma de credit_transactions no coincide con balance_cents, se
-- registra aquí para revisión humana — el saldo NUNCA se corrige solo.
CREATE TABLE IF NOT EXISTS credit_integrity_alarms (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  expected_balance_cents BIGINT NOT NULL, -- suma de credit_transactions.amount_cents
  actual_balance_cents   BIGINT NOT NULL, -- clinic_credit_accounts.balance_cents en el momento de la comprobación
  detected_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at            TIMESTAMPTZ,
  resolved_by            UUID REFERENCES app_users(id) ON DELETE SET NULL,
  resolution_notes       TEXT
);
CREATE INDEX IF NOT EXISTS idx_credit_alarms_unresolved ON credit_integrity_alarms(clinic_id) WHERE resolved_at IS NULL;
ALTER TABLE credit_integrity_alarms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service key full access on credit_integrity_alarms" ON credit_integrity_alarms;
CREATE POLICY "Service key full access on credit_integrity_alarms" ON credit_integrity_alarms FOR ALL USING (true);

-- Nuevo módulo de menú "Bono IA" — visible para todas las clínicas por
-- defecto (a diferencia de invoicing/time-tracking, no es una función de
-- plan sino un sistema de consumo propio, siempre visible para que la
-- clínica pueda ver y recargar su saldo).
INSERT INTO plan_permissions (plan, module, can_access) VALUES
  ('base', 'ai-credits', true),
  ('pro', 'ai-credits', true),
  ('ia', 'ai-credits', true),
  ('ia-plus', 'ai-credits', true),
  ('redes', 'ai-credits', true)
ON CONFLICT (plan, module) DO NOTHING;
