ALTER TABLE consent_records
  ADD COLUMN IF NOT EXISTS revocation_hash TEXT;
