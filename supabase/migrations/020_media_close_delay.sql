-- Minimum number of seconds a welcome/patient creative must stay on screen
-- before the viewer is allowed to close it. 0 keeps the previous behavior
-- (closable immediately).
ALTER TABLE clinic_media_settings ADD COLUMN IF NOT EXISTS close_delay_seconds INT NOT NULL DEFAULT 0;
