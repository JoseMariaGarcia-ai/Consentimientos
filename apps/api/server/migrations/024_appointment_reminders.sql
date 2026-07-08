-- URL de "cómo llegar" de la clínica, para incluir en los emails de cita.
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS directions_url TEXT;

-- Marca cuándo se envió el recordatorio de "queda 1 día" para no duplicarlo
-- en cada pasada del scheduler.
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

INSERT INTO workflows (key, enabled) VALUES
  ('appointment_reminder', true)
ON CONFLICT (key) DO NOTHING;
