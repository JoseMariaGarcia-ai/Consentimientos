-- Rol de usuario "doctor": vincula un doctor con su propia cuenta de acceso
-- (app_users, role='doctor') y guarda si puede ver la agenda de TODOS los
-- doctores de la clínica o solo la suya. Los permisos de sección (a qué
-- módulos accede) se reutilizan de user_permissions — la misma tabla que ya
-- usa el rol 'clinica' — solo se amplía qué roles la consultan (ver
-- requireModuleAccess en middleware/auth.ts y GET /api/me).
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS app_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS can_view_all_agendas BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_doctors_app_user ON doctors(app_user_id);
