-- Mismo problema que 031: estas columnas se aplicaron a mano en Railway
-- (commits "Doctors: split name/surname, add phone field..." y "Add sede
-- (branch) selector when creating a consent") sin migración versionada, así
-- que faltaban en cualquier base de datos nueva y rompían POST/PUT
-- /api/doctors y POST /api/consents con "column ... does not exist".

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS sede TEXT;
