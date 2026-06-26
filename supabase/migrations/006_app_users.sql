-- supabase/migrations/006_app_users.sql
-- Gestión de usuarios de la aplicación con roles y permisos granulares

CREATE TABLE IF NOT EXISTS app_users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'clinica' CHECK (role IN ('admin', 'clinica')),
  is_active     BOOLEAN DEFAULT TRUE,
  invited_at    TIMESTAMPTZ DEFAULT NOW(),
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Permisos granulares por módulo para el rol 'clinica'
-- El rol 'admin' tiene acceso total sin necesidad de entrada en esta tabla
CREATE TABLE IF NOT EXISTS user_permissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  module        TEXT NOT NULL,  -- 'dashboard','patients','doctors','consents','templates','clinic'
  can_access    BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module)
);

CREATE INDEX IF NOT EXISTS idx_app_users_clinic  ON app_users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email   ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_user_perms_user   ON user_permissions(user_id);

ALTER TABLE app_users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Admin service key bypasses RLS
CREATE POLICY "Service key full access on app_users"
  ON app_users FOR ALL USING (true);
CREATE POLICY "Service key full access on user_permissions"
  ON user_permissions FOR ALL USING (true);
