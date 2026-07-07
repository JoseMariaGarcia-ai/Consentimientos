-- supabase/migrations/016_clinic_nika_number.sql
-- Número NIKA (registro de centros, servicios y establecimientos sanitarios)
-- de la clínica, junto al resto de datos identificativos (NIF, nombre fiscal).

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS nika_number TEXT;
