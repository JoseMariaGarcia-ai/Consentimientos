ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES app_users(id),
  ADD COLUMN IF NOT EXISTS revocation_reason TEXT;
