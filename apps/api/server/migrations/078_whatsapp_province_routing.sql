-- Localidad y provincia de la clínica — necesarias para resolver por lista
-- interactiva de WhatsApp qué clínica quiere contactar un número nuevo
-- ("la clínica de Jerez" no coincide con el nombre comercial registrado).
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city     TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS province TEXT;

-- Estado efímero de la conversación de enrutamiento de WhatsApp para un
-- número todavía no resuelto a ninguna clínica: qué paso del flujo
-- (provincia -> clínica) está esperando y qué provincia eligió, si procede.
-- No es la conversación en sí (esa vive en whatsapp_conversations, y solo
-- se crea una vez resuelto el clinic_id) — es el estado previo a saber a
-- qué clínica pertenece el mensaje.
CREATE TABLE IF NOT EXISTS whatsapp_routing_state (
  phone      TEXT PRIMARY KEY,
  stage      TEXT NOT NULL CHECK (stage IN ('awaiting_province', 'awaiting_clinic')),
  province   TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
