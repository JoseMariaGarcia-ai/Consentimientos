-- supabase/migrations/013_lab_managed_media.sql
-- A lab partner can now manage the welcome/patient advertising media for
-- every clinic linked to it (clinic_lab_partners), instead of each clinic
-- managing its own. clinic_media / clinic_media_settings gain an
-- alternative owner column (lab_partner_id); exactly one of clinic_id /
-- lab_partner_id is set per row.

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

-- Replace the old clinic-only unique constraint with one that covers both owner kinds.
ALTER TABLE clinic_media_settings DROP CONSTRAINT IF EXISTS clinic_media_settings_clinic_id_media_type_key;
DROP INDEX IF EXISTS idx_clinic_media_settings_owner_type;
CREATE UNIQUE INDEX idx_clinic_media_settings_owner_type
  ON clinic_media_settings (COALESCE(clinic_id::text, lab_partner_id::text), media_type);

CREATE INDEX IF NOT EXISTS idx_clinic_media_lab          ON clinic_media(lab_partner_id, type);
CREATE INDEX IF NOT EXISTS idx_clinic_media_settings_lab ON clinic_media_settings(lab_partner_id, media_type);

-- One-off adoption: a clinic already linked to exactly one lab partner hands
-- its existing media (if any) over to that lab, so nothing already uploaded
-- disappears once the clinic becomes lab-managed. Clinics linked to zero or
-- several labs are left untouched (still self-managed) to avoid ambiguity.
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

    -- Any leftover clinic-owned settings row that couldn't move (the lab
    -- already had one for that media_type) is now orphaned data — remove it.
    DELETE FROM clinic_media_settings WHERE clinic_id = r.clinic_id;
  END LOOP;
END $$;
