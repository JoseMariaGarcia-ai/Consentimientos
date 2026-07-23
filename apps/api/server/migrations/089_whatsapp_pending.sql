-- Pestaña "Pendiente de gestión" del panel de WhatsApp: marcador manual,
-- independiente de unread_count (una conversación ya leída puede seguir
-- pendiente de que alguien la resuelva).
ALTER TABLE whatsapp_conversations ADD COLUMN IF NOT EXISTS is_pending BOOLEAN NOT NULL DEFAULT false;
