-- Cantidad/detalle asociado a un hábito marcado como "Sí" (p.ej. "10
-- cigarrillos/día", "2 copas/semana"). Texto libre porque el formato varía
-- mucho según la sustancia; NULL cuando no se ha indicado.
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS tobacco_quantity TEXT;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS alcohol_quantity TEXT;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS drug_quantity TEXT;
