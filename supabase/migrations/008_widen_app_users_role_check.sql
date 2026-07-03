-- supabase/migrations/008_widen_app_users_role_check.sql
-- migration 006 restricted app_users.role to ('admin', 'clinica'), but the
-- app has used superadmin/lab_partner/patient/doctor/receptionist roles all
-- along (per apps/web/src/pages/Settings.tsx ROLE_OPTIONS and
-- apps/web/src/App.tsx routing). Widen the constraint to match reality.

ALTER TABLE app_users DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users ADD CONSTRAINT app_users_role_check
  CHECK (role IN ('admin', 'clinica', 'doctor', 'receptionist', 'lab_partner', 'patient', 'superadmin'));
