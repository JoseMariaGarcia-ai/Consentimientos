-- supabase/migrations/011_set_jmgarcialojo_superadmin.sql
-- One-off data fix requested by the account owner: promote jmgarcialojo@icloud.com
-- (currently role='admin') to 'superadmin', matching Flavia Piccelli's role.

UPDATE app_users SET role = 'superadmin', updated_at = NOW()
WHERE email = 'jmgarcialojo@icloud.com';
