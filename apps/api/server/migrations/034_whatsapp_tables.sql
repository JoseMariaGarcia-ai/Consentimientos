-- Igual que 031/032/033: el módulo de WhatsApp (commit "Add WhatsApp
-- module...") se desplegó con sus tablas creadas a mano en Railway, sin
-- migración versionada. Reconstruidas aquí a partir de las columnas que
-- routes/whatsapp.ts realmente usa, para que una base de datos nueva no
-- rompa con "relation whatsapp_conversations/whatsapp_messages does not
-- exist".

CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id             UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  phone                 TEXT NOT NULL,
  contact_name          TEXT,
  last_message_at       TIMESTAMPTZ,
  last_message_preview  TEXT,
  unread_count          INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic ON whatsapp_conversations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_phone ON whatsapp_conversations(clinic_id, phone);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
  clinic_id        UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  direction        TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  body             TEXT,
  status           TEXT,
  ycloud_id        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id, created_at);
