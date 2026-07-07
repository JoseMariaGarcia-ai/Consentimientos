-- Which plan each clinic is on, and which menu sections (modules) each plan
-- grants access to. Configured from Configuración > Planes Suscripción
-- (superadmin only); applied automatically to a "clinica" user's
-- user_permissions when they're invited/edited with that plan selected.

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS plan TEXT CHECK (plan IN ('base', 'pro', 'ia', 'ia-plus'));

CREATE TABLE IF NOT EXISTS plan_permissions (
  plan       TEXT NOT NULL CHECK (plan IN ('base', 'pro', 'ia', 'ia-plus')),
  module     TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (plan, module)
);

ALTER TABLE plan_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service key full access on plan_permissions" ON plan_permissions;
CREATE POLICY "Service key full access on plan_permissions" ON plan_permissions FOR ALL USING (true);

-- Sensible starting defaults matching each plan's advertised features
-- (see apps/web/src/pages/Recharge.tsx) — editable afterward in the UI.
INSERT INTO plan_permissions (plan, module, can_access) VALUES
  ('base', 'dashboard', true),  ('base', 'agenda', false),          ('base', 'patients', true),
  ('base', 'doctors', true),    ('base', 'consents', true),         ('base', 'clinical-records', true),
  ('base', 'photos', true),     ('base', 'toxin', false),           ('base', 'whatsapp', false),
  ('base', 'clinic', true),     ('base', 'settings', false),        ('base', 'templates', false),
  ('base', 'lab-partners', false),

  ('pro', 'dashboard', true),   ('pro', 'agenda', true),            ('pro', 'patients', true),
  ('pro', 'doctors', true),     ('pro', 'consents', true),          ('pro', 'clinical-records', true),
  ('pro', 'photos', true),      ('pro', 'toxin', true),             ('pro', 'whatsapp', false),
  ('pro', 'clinic', true),      ('pro', 'settings', false),         ('pro', 'templates', false),
  ('pro', 'lab-partners', false),

  ('ia', 'dashboard', true),    ('ia', 'agenda', true),             ('ia', 'patients', true),
  ('ia', 'doctors', true),      ('ia', 'consents', true),           ('ia', 'clinical-records', true),
  ('ia', 'photos', true),       ('ia', 'toxin', true),              ('ia', 'whatsapp', true),
  ('ia', 'clinic', true),       ('ia', 'settings', false),          ('ia', 'templates', false),
  ('ia', 'lab-partners', false),

  ('ia-plus', 'dashboard', true), ('ia-plus', 'agenda', true),      ('ia-plus', 'patients', true),
  ('ia-plus', 'doctors', true),   ('ia-plus', 'consents', true),    ('ia-plus', 'clinical-records', true),
  ('ia-plus', 'photos', true),    ('ia-plus', 'toxin', true),       ('ia-plus', 'whatsapp', true),
  ('ia-plus', 'clinic', true),    ('ia-plus', 'settings', false),   ('ia-plus', 'templates', false),
  ('ia-plus', 'lab-partners', false)
ON CONFLICT (plan, module) DO NOTHING;
