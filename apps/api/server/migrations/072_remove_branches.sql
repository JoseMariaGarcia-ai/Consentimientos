-- Elimina la funcionalidad de "sedes" (múltiples ubicaciones por clínica).
-- Nunca fue un recurso propio (no había tabla branches ni endpoint
-- dedicado) — era un array JSONB en clinics.branches más varias columnas de
-- texto libre sin clave foránea en otras tablas, que solo guardaban el
-- nombre de la sede elegida. Se elimina todo el rastro de almacenamiento.
ALTER TABLE clinics           DROP COLUMN IF EXISTS branches;
ALTER TABLE clinical_records  DROP COLUMN IF EXISTS branch;
ALTER TABLE photo_sessions    DROP COLUMN IF EXISTS branch;
ALTER TABLE appointments      DROP COLUMN IF EXISTS branch;
ALTER TABLE consent_records   DROP COLUMN IF EXISTS sede;
