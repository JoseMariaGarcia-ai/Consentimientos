-- Nuevo origen de conversación: 'paciente_registrado' — el número que
-- escribe ya es un paciente dado de alta en una clínica (coincidencia por
-- teléfono), señal más fiable que el historial de conversaciones o que
-- preguntar la provincia. Aprendida la lección de la migración 080: se
-- amplía el CHECK constraint en el mismo cambio que añade el valor nuevo,
-- no después.
ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_source_check;
ALTER TABLE whatsapp_conversations ADD CONSTRAINT whatsapp_conversations_source_check
  CHECK (source IN (
    'link_directo', 'mensaje_saliente_clinica', 'pregunta_ambigua', 'recencia_automatica',
    'lista_interactiva', 'admin_directo', 'sin_resolver', 'paciente_registrado'
  ));
