-- Las columnas first_name/last_name de patients llevaban semanas en uso en
-- producción (commit "Store and display first_name/last_name separately for
-- patients") pero la migración correspondiente nunca se añadió al
-- repositorio — se crearon a mano en la base de datos de Railway. Cualquier
-- base de datos nueva (entorno de pruebas, recuperación ante desastres)
-- carecía de ellas, lo que rompía POST y PUT /api/patients por completo
-- ("column first_name of relation patients does not exist"). En producción
-- este ALTER es un no-op (las columnas ya existen); aquí solo reconcilia el
-- esquema versionado con la realidad.

ALTER TABLE patients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill para bases de datos nuevas a partir de full_name (en producción
-- no debería tocar nada, ya que first_name ya está relleno ahí).
UPDATE patients
SET first_name = COALESCE(NULLIF(split_part(full_name, ' ', 1), ''), full_name),
    last_name = NULLIF(regexp_replace(full_name, '^\S+\s*', ''), '')
WHERE first_name IS NULL AND full_name IS NOT NULL AND full_name <> '';
