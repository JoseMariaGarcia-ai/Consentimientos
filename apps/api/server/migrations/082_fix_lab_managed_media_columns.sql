-- La migración 013_lab_managed_media.sql nunca llegó a aplicarse con éxito
-- en producción (confirmado por el error en tiempo de ejecución "column
-- lab_partner_id does not exist" al gestionar el contenido de un
-- laboratorio) — como todas las sentencias de un fichero de migración se
-- ejecutan como una única transacción implícita, el fallo de una sola
-- (probablemente al crear el índice único, por filas duplicadas de
-- clinic_media_settings ya existentes) deshizo también los ADD COLUMN que
-- sí habrían funcionado, y así se ha quedado en cada reintento desde
-- entonces. Aquí cada paso va en su propio bloque con captura de errores,
-- para que un fallo puntual no arrastre a los demás.

DO $$ BEGIN
  ALTER TABLE clinic_media ALTER COLUMN clinic_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media.clinic_id DROP NOT NULL: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE clinic_media ADD COLUMN IF NOT EXISTS lab_partner_id UUID REFERENCES lab_partners(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media.lab_partner_id: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE clinic_media_settings ALTER COLUMN clinic_id DROP NOT NULL;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media_settings.clinic_id DROP NOT NULL: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE clinic_media_settings ADD COLUMN IF NOT EXISTS lab_partner_id UUID REFERENCES lab_partners(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media_settings.lab_partner_id: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE clinic_media DROP CONSTRAINT IF EXISTS clinic_media_owner_check;
  ALTER TABLE clinic_media ADD CONSTRAINT clinic_media_owner_check CHECK (
    (clinic_id IS NOT NULL AND lab_partner_id IS NULL) OR (clinic_id IS NULL AND lab_partner_id IS NOT NULL)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media_owner_check: %', SQLERRM;
END $$;

DO $$ BEGIN
  ALTER TABLE clinic_media_settings DROP CONSTRAINT IF EXISTS clinic_media_settings_owner_check;
  ALTER TABLE clinic_media_settings ADD CONSTRAINT clinic_media_settings_owner_check CHECK (
    (clinic_id IS NOT NULL AND lab_partner_id IS NULL) OR (clinic_id IS NULL AND lab_partner_id IS NOT NULL)
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'clinic_media_settings_owner_check: %', SQLERRM;
END $$;

-- Antes de crear el índice único por dueño, elimina cualquier duplicado que
-- se hubiera colado (misma clínica/laboratorio + mismo tipo de medio con
-- más de una fila de configuración) — si no, CREATE UNIQUE INDEX fallaría
-- igual que probablemente falló ya en 013, y seguiría bloqueando todo.
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
  ALTER TABLE clinic_media_settings DROP CONSTRAINT IF EXISTS clinic_media_settings_clinic_id_media_type_key;
  DROP INDEX IF EXISTS idx_clinic_media_settings_owner_type;
  CREATE UNIQUE INDEX idx_clinic_media_settings_owner_type
    ON clinic_media_settings (COALESCE(clinic_id::text, lab_partner_id::text), media_type);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'idx_clinic_media_settings_owner_type: %', SQLERRM;
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

-- Adopción de medios existentes: si una clínica está vinculada a
-- EXACTAMENTE un laboratorio, ese laboratorio pasa a gestionar el
-- contenido de bienvenida/paciente que esa clínica ya tuviera subido,
-- igual que pretendía hacer la migración 013.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT clp.clinic_id, (array_agg(clp.lab_partner_id))[1] AS lab_partner_id
    FROM clinic_lab_partners clp
    GROUP BY clp.clinic_id
    HAVING COUNT(*) = 1
  LOOP
    UPDATE clinic_media
    SET lab_partner_id = r.lab_partner_id, clinic_id = NULL
    WHERE clinic_id = r.clinic_id;

    UPDATE clinic_media_settings s
    SET lab_partner_id = r.lab_partner_id, clinic_id = NULL
    WHERE s.clinic_id = r.clinic_id
      AND NOT EXISTS (
        SELECT 1 FROM clinic_media_settings s2
        WHERE s2.lab_partner_id = r.lab_partner_id AND s2.media_type = s.media_type
      );

    DELETE FROM clinic_media_settings WHERE clinic_id = r.clinic_id;
  END LOOP;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'adopcion de medios existentes: %', SQLERRM;
END $$;
