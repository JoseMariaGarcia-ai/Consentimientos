-- Ampliación del módulo de Bono IA (independiente entre sí):
--   Parte A: enrutamiento de conversaciones de WhatsApp cuando se usa un
--            único número de YCloud compartido por todas las clínicas.
--   Parte B: vigilancia (solo lectura) del saldo que ConsentsPro mantiene
--            en las cuentas reales de Anthropic/Retell/YCloud — capa
--            distinta al bono de cada clínica, sin motor de recarga propio.
--
-- No se crean tablas whatsapp_conversations/whatsapp_messages desde cero
-- (ya existen del módulo de WhatsApp previo, con nombres de columna algo
-- distintos a los del documento de requisitos: phone en vez de
-- patient_phone, body en vez de content, direction 'inbound'/'outbound' en
-- vez de 'entrante'/'saliente') — se amplían con ALTER TABLE para no
-- romper el panel de WhatsApp ya construido ni los datos existentes.

ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('link_directo', 'mensaje_saliente_clinica', 'pregunta_ambigua', 'recencia_automatica'));
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'activa'
  CHECK (status IN ('activa', 'esperando_clinica', 'cerrada'));
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id) ON DELETE SET NULL;

-- 'sender' matiza 'direction' para los mensajes salientes: quién lo mandó
-- realmente (la IA o una persona del equipo de la clínica), útil en el
-- historial y para depurar el enrutamiento — 'direction' sigue siendo la
-- columna que ya usa el resto del código (inbound/outbound).
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS sender TEXT CHECK (sender IN ('paciente', 'ia', 'clinica'));

-- Código corto único por clínica para su enlace directo de WhatsApp
-- (https://wa.me/<numero>?text=CLINICA_<codigo>) — evita la ambigüedad de
-- enrutamiento desde el origen. Se backfillea con un código aleatorio para
-- las clínicas ya existentes.
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_code TEXT UNIQUE;
UPDATE clinics SET whatsapp_code = upper(substr(md5(id::text || random()::text), 1, 6))
WHERE whatsapp_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_wa_conv_phone_only ON whatsapp_conversations(phone);

-- Ajustes de sistema para el enrutamiento y la vigilancia de saldo externo
-- (mismo patrón key/value que active_ai_provider, migración 060).
INSERT INTO system_settings (key, value) VALUES
  ('shared_ycloud_api_key', ''),                    -- API Key del número único compartido (Parte A)
  ('wa_ambiguity_window_days', '90'),                -- umbral configurable del Caso C
  ('provider_balance_alert_threshold_usd', '50')     -- alarma interna de la Parte B
ON CONFLICT (key) DO NOTHING;
