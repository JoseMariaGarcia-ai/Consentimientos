-- supabase/migrations/003_admin_users.sql
-- Admin superuser table (separate from clinic doctors)
-- Auth Spec v1.0 — bcrypt cost 12 + TOTP obligatorio

CREATE TABLE IF NOT EXISTS admin_users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username          TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,          -- bcrypt cost 12
  totp_secret       TEXT,                   -- AES-256 encrypted, set after first login
  totp_enabled      BOOLEAN DEFAULT FALSE,
  recovery_codes    TEXT[],                 -- 10 one-time codes, hashed
  last_login        TIMESTAMPTZ,
  failed_attempts   INT DEFAULT 0,
  locked_until      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Magic link tokens (one-time use, TTL enforced)
CREATE TABLE IF NOT EXISTS magic_tokens (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL,
  token_hash   TEXT NOT NULL UNIQUE,        -- SHA-256 of the actual token
  expires_at   TIMESTAMPTZ NOT NULL,
  used_at      TIMESTAMPTZ,
  ip_origin    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_magic_tokens_hash ON magic_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_user ON magic_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
