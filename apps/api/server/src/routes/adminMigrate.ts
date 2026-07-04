import { Router } from 'express'
import { pool } from '../lib/db'

// TEMPORARY — applies migration 013 (lab-managed media) to production.
// Remove this file and its registration in index.ts right after use.
const router = Router()
const MIGRATE_SECRET = 'mig013-9d4b7a1e-lab-media'

const SQL_013 = `
ALTER TABLE clinic_media ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE clinic_media ADD COLUMN IF NOT EXISTS lab_partner_id UUID REFERENCES lab_partners(id) ON DELETE CASCADE;

ALTER TABLE clinic_media DROP CONSTRAINT IF EXISTS clinic_media_owner_check;
ALTER TABLE clinic_media ADD CONSTRAINT clinic_media_owner_check CHECK (
  (clinic_id IS NOT NULL AND lab_partner_id IS NULL) OR (clinic_id IS NULL AND lab_partner_id IS NOT NULL)
);

ALTER TABLE clinic_media_settings ALTER COLUMN clinic_id DROP NOT NULL;
ALTER TABLE clinic_media_settings ADD COLUMN IF NOT EXISTS lab_partner_id UUID REFERENCES lab_partners(id) ON DELETE CASCADE;

ALTER TABLE clinic_media_settings DROP CONSTRAINT IF EXISTS clinic_media_settings_owner_check;
ALTER TABLE clinic_media_settings ADD CONSTRAINT clinic_media_settings_owner_check CHECK (
  (clinic_id IS NOT NULL AND lab_partner_id IS NULL) OR (clinic_id IS NULL AND lab_partner_id IS NOT NULL)
);

ALTER TABLE clinic_media_settings DROP CONSTRAINT IF EXISTS clinic_media_settings_clinic_id_media_type_key;
DROP INDEX IF EXISTS idx_clinic_media_settings_owner_type;
CREATE UNIQUE INDEX idx_clinic_media_settings_owner_type
  ON clinic_media_settings (COALESCE(clinic_id::text, lab_partner_id::text), media_type);

CREATE INDEX IF NOT EXISTS idx_clinic_media_lab          ON clinic_media(lab_partner_id, type);
CREATE INDEX IF NOT EXISTS idx_clinic_media_settings_lab ON clinic_media_settings(lab_partner_id, media_type);

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
END $$;
`

router.get('/', async (req, res) => {
  if (req.query.key !== MIGRATE_SECRET) return res.status(404).end()
  try {
    await pool.query(SQL_013)
    return res.json({ '013_lab_managed_media': 'ok' })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
})

export default router
