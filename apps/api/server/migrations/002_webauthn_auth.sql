-- supabase/migrations/002_webauthn_auth.sql
-- WebAuthn / FIDO2 biometric authentication tables
-- Auth Spec v1.0 — ConsentsPro

-- WebAuthn credentials (one per registered device)
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL,
  credential_id TEXT NOT NULL UNIQUE,
  public_key    TEXT NOT NULL,
  device_name   TEXT DEFAULT 'Mi dispositivo',
  counter       BIGINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ
);

-- Temporary challenges (registration + authentication)
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL,
  challenge  TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Device sessions for persistent login (PC without biometrics)
CREATE TABLE IF NOT EXISTS device_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL,
  device_token_hash TEXT NOT NULL UNIQUE,
  device_name      TEXT,
  expires_at       TIMESTAMPTZ NOT NULL,
  ip               TEXT,
  user_agent       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Authentication audit log (RGPD — retain 2 years)
CREATE TABLE IF NOT EXISTS auth_audit_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID,
  email      TEXT,
  event      TEXT NOT NULL, -- 'magic_link_request', 'magic_link_success', 'webauthn_success', 'webauthn_failure', 'logout'
  ip         TEXT,
  user_agent TEXT,
  success    BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_creds_user ON webauthn_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_webauthn_challenges_user ON webauthn_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_device_sessions_user ON device_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON auth_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON auth_audit_log(user_id);

-- Auto-cleanup expired challenges (run periodically)
-- DELETE FROM webauthn_challenges WHERE expires_at < NOW();
-- DELETE FROM device_sessions WHERE expires_at < NOW();
