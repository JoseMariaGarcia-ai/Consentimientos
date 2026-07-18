-- Orden personalizado del menú lateral, guardado por usuario individual —
-- igual que user_permissions ya son por-usuario (user_id), no por-clínica:
-- cada miembro del staff de una misma clínica puede tener su propia
-- preferencia de orden. NULL significa "usa el orden por defecto" (el
-- fijo de navItems en Sidebar.tsx); un array JSON de moduleKey es el
-- orden elegido por el usuario para las secciones que reconoce.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS sidebar_order JSONB;
