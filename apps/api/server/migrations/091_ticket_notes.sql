-- Notas internas del superadmin sobre una incidencia: qué se ha hecho o qué
-- ha sucedido, independiente del cambio de estado (open/resolved).
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS notes TEXT;
