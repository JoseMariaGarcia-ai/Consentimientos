-- El superadmin necesita poder escribir por WhatsApp a cualquier clínica o
-- persona con identidad de ConsentsPro (gestión de suscripciones, altas de
-- clientes, cobros de deuda), no en nombre de una clínica concreta. Esas
-- conversaciones no pertenecen a ninguna clínica, así que clinic_id pasa a
-- ser opcional (NULL = conversación de administración de ConsentsPro).
ALTER TABLE whatsapp_conversations ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE whatsapp_messages      ALTER COLUMN clinic_id DROP NOT NULL;

ALTER TABLE whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_sender_check;
ALTER TABLE whatsapp_messages ADD CONSTRAINT whatsapp_messages_sender_check
  CHECK (sender IN ('paciente', 'ia', 'clinica', 'admin'));
