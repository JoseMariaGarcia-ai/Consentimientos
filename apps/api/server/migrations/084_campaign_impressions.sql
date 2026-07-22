-- Las campañas publicitarias (lab_ad_campaigns) nunca llegaban a mostrarse
-- a ninguna clínica — solo existía la pantalla de gestión, sin ningún
-- mecanismo de entrega. Se añade el registro de impresiones de campaña,
-- reutilizando media_impressions (igual que ya hace welcome/patient).
--
-- Lección aprendida en la migración 080 de este mismo proyecto: al añadir
-- un valor nuevo a una columna con CHECK, hay que ampliar la restricción
-- en la MISMA migración que empieza a insertar ese valor, o cada INSERT
-- fallará en silencio (devuelve 200 al llamador pero nunca guarda nada).

ALTER TABLE media_impressions ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES lab_ad_campaigns(id) ON DELETE CASCADE;

ALTER TABLE media_impressions DROP CONSTRAINT IF EXISTS media_impressions_media_type_check;
ALTER TABLE media_impressions ADD CONSTRAINT media_impressions_media_type_check CHECK (media_type IN ('welcome', 'patient', 'campaign'));

CREATE INDEX IF NOT EXISTS idx_media_impressions_campaign ON media_impressions(campaign_id, shown_at);
