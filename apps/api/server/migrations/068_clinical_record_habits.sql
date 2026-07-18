-- Embarazo y hábitos (tabaco, alcohol, drogas) en la historia clínica.
-- Se guardan como booleano NULL (no NOT NULL) porque no siempre se
-- pregunta/consta en cada visita — NULL representa "sin especificar",
-- distinto de un "No" explícito.
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS is_pregnant BOOLEAN;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS tobacco_use BOOLEAN;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS alcohol_use BOOLEAN;
ALTER TABLE clinical_records ADD COLUMN IF NOT EXISTS drug_use BOOLEAN;
