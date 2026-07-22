-- La migración 061 restringió whatsapp_conversations.source a los 4 valores
-- originales, pero las funciones añadidas después (lista interactiva por
-- provincia, modo administrador, bandeja de mensajes sin resolver) insertan
-- 'lista_interactiva', 'admin_directo' y 'sin_resolver' — sin ampliar este
-- CHECK, cualquier conversación con esos orígenes fallaba al guardarse
-- (violates check constraint "whatsapp_conversations_source_check"),
-- perdiéndose el mensaje entrante en silencio.
ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_source_check;
ALTER TABLE whatsapp_conversations ADD CONSTRAINT whatsapp_conversations_source_check
  CHECK (source IN (
    'link_directo', 'mensaje_saliente_clinica', 'pregunta_ambigua', 'recencia_automatica',
    'lista_interactiva', 'admin_directo', 'sin_resolver'
  ));
