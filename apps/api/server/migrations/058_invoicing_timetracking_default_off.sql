-- Facturación y Control horario ahora se verifican también en el backend
-- (requireModuleAccess en index.ts / comprobación de plan en el kiosco de
-- PIN), así que dejan de estar disponibles por defecto en ningún plan: hay
-- que concederlos explícitamente por clínica desde Configuración > Planes,
-- igual que cualquier otro módulo opcional.
UPDATE plan_permissions
SET can_access = false
WHERE module IN ('invoicing', 'time-tracking');

-- plan_permissions es solo la plantilla que se copia a user_permissions al
-- (re)aplicar un plan (applyPlanToClinic) — las clínicas que ya tenían el
-- plan aplicado conservan su copia antigua con can_access=true. Se
-- actualiza también aquí para que la desactivación sea inmediata y no
-- dependa de que alguien vuelva a guardar el plan de cada clínica.
UPDATE user_permissions
SET can_access = false
WHERE module IN ('invoicing', 'time-tracking');

