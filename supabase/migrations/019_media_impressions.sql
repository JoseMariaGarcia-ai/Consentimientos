-- Tracks every time a lab-managed (or clinic-managed) welcome/patient
-- creative is actually shown to clinic staff, so labs can see how often
-- their advertising has been displayed over a date range.

CREATE TABLE IF NOT EXISTS media_impressions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id      UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  lab_partner_id UUID REFERENCES lab_partners(id) ON DELETE CASCADE,
  media_type     TEXT NOT NULL CHECK (media_type IN ('welcome', 'patient')),
  creative_id    UUID REFERENCES clinic_media(id) ON DELETE SET NULL,
  shown_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_impressions_lab_date    ON media_impressions(lab_partner_id, shown_at);
CREATE INDEX IF NOT EXISTS idx_media_impressions_clinic_date ON media_impressions(clinic_id, shown_at);

ALTER TABLE media_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on media_impressions" ON media_impressions;
CREATE POLICY "Service key full access on media_impressions" ON media_impressions FOR ALL USING (true);
