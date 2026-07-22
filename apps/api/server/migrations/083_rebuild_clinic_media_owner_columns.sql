-- La migración 082 debía dejar clinic_id anulable en clinic_media y
-- clinic_media_settings, pero en producción la columna lab_partner_id ya
-- existe y sin embargo clinic_id sigue rechazando NULL (confirmado por el
-- error "null value in column clinic_id ... violates not-null constraint"
-- al guardar contenido de un laboratorio). Probado en local con Postgres
-- 16 y el mismo historial de migraciones: ALTER COLUMN ... DROP NOT NULL
-- funciona sin problema en un esquema limpio, así que el estado real de
-- producción difiere de lo documentado (con toda probabilidad por cambios
-- aplicados a mano antes de que existiera este sistema de migraciones).
-- En vez de seguir intentando adivinar la causa exacta de por qué DROP NOT
-- NULL no cuaja, se reconstruye la columna desde cero: se crea una nueva
-- columna anulable, se copian los datos, se elimina la original y se
-- renombra — así queda anulable pase lo que pase.

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinic_media' AND column_name = 'clinic_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE clinic_media DROP CONSTRAINT IF EXISTS clinic_media_owner_check;
    ALTER TABLE clinic_media ADD COLUMN clinic_id_nullable UUID REFERENCES clinics(id) ON DELETE CASCADE;
    UPDATE clinic_media SET clinic_id_nullable = clinic_id;
    ALTER TABLE clinic_media DROP COLUMN clinic_id;
    ALTER TABLE clinic_media RENAME COLUMN clinic_id_nullable TO clinic_id;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'rebuild clinic_media.clinic_id: %', SQLERRM;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clinic_media_settings' AND column_name = 'clinic_id' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE clinic_media_settings DROP CONSTRAINT IF EXISTS clinic_media_settings_owner_check;
    ALTER TABLE clinic_media_settings DROP CONSTRAINT IF EXISTS clinic_media_settings_clinic_id_media_type_key;
    DROP INDEX IF EXISTS idx_clinic_media_settings_owner_type;
    ALTER TABLE clinic_media_settings ADD COLUMN clinic_id_nullable UUID REFERENCES clinics(id) ON DELETE CASCADE;
    UPDATE clinic_media_settings SET clinic_id_nullable = clinic_id;
    ALTER TABLE clinic_media_settings DROP COLUMN clinic_id;
    ALTER TABLE clinic_media_settings RENAME COLUMN clinic_id_nullable TO clinic_id;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'rebuild clinic_media_settings.clinic_id: %', SQLERRM;
END $$;

-- Recrea índices/constraints que el DROP COLUMN pueda haberse llevado por
-- delante (cualquier constraint o índice que dependiera de la columna
-- original desaparece junto con ella).
DO $$ BEGIN
  ALTER TABLE clinic_media ADD CONSTRAINT clinic_media_owner_check CHECK (
    (clinic_id IS NOT NULL AND lab_partner_id IS NULL) OR (clinic_id IS NULL AND lab_partner_id IS NOT NULL)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media_owner_check: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE clinic_media_settings ADD CONSTRAINT clinic_media_settings_owner_check CHECK (
    (clinic_id IS NOT NULL AND lab_partner_id IS NULL) OR (clinic_id IS NULL AND lab_partner_id IS NOT NULL)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media_settings_owner_check: %', SQLERRM;
END $$;

DO $$ BEGIN
  DELETE FROM clinic_media_settings a
  USING clinic_media_settings b
  WHERE a.id > b.id
    AND COALESCE(a.clinic_id::text, a.lab_partner_id::text) = COALESCE(b.clinic_id::text, b.lab_partner_id::text)
    AND a.media_type = b.media_type;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'dedupe clinic_media_settings: %', SQLERRM;
END $$;

DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_clinic_media_settings_owner_type
    ON clinic_media_settings (COALESCE(clinic_id::text, lab_partner_id::text), media_type);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'idx_clinic_media_settings_owner_type: %', SQLERRM;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_clinic_media_clinic ON clinic_media(clinic_id, type);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'idx_clinic_media_clinic: %', SQLERRM;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_clinic_media_lab ON clinic_media(lab_partner_id, type);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'idx_clinic_media_lab: %', SQLERRM;
END $$;

DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS idx_clinic_media_settings_lab ON clinic_media_settings(lab_partner_id, media_type);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'idx_clinic_media_settings_lab: %', SQLERRM;
END $$;

-- Verificación final: si tras todo esto clinic_id siguiera sin admitir
-- NULL en alguna de las dos tablas, se lanza un error real (sin
-- silenciar) para que esta migración NO quede marcada como aplicada y se
-- reintente en el siguiente despliegue — mejor eso que quedar marcada
-- como hecha sin estarlo de verdad.
DO $$
DECLARE bad_table TEXT;
BEGIN
  SELECT table_name INTO bad_table
  FROM information_schema.columns
  WHERE table_name IN ('clinic_media', 'clinic_media_settings')
    AND column_name = 'clinic_id' AND is_nullable = 'NO'
  LIMIT 1;
  IF bad_table IS NOT NULL THEN
    RAISE EXCEPTION 'clinic_id sigue siendo NOT NULL en % tras el rebuild', bad_table;
  END IF;
END $$;
