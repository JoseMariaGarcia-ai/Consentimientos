-- Autorizaciones específicas de uso de imagen (formativo/científico y
-- publicitario/difusión) — la cláusula ya existe como texto legal en el
-- cuerpo de muchas plantillas (ver 014_image_session_clause.sql) pero hasta
-- ahora las casillas "☐" eran solo un carácter decorativo dentro del texto,
-- no una casilla real marcable. Por defecto NO autorizado (false), acorde
-- al mismo criterio de opt-in del RGPD que ya se documentó en 014.
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS image_auth_educational BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE consent_records ADD COLUMN IF NOT EXISTS image_auth_marketing BOOLEAN NOT NULL DEFAULT false;
