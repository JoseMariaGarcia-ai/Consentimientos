-- Permite que una plantilla aparezca listada en más de una categoría sin
-- duplicar el documento legal (mismo id, mismo contenido, mismo hash de
-- integridad si en el futuro se firma). `category` sigue siendo la
-- categoría principal (la que se usa en el editor); `extra_categories`
-- añade categorías adicionales donde también debe listarse.
ALTER TABLE consent_templates
  ADD COLUMN IF NOT EXISTS extra_categories TEXT[] NOT NULL DEFAULT '{}'
  CHECK (extra_categories <@ ARRAY[
    'medicina_estetica',
    'odontologia',
    'veterinaria',
    'centro_estetico',
    'salon_belleza',
    'tatuajes',
    'fisioterapia'
  ]::TEXT[]);

-- Radiofrecuencia y HIFU: mismos equipos/finalidad que en un centro
-- estético (versión médica de mayor potencia), pero es habitual que
-- también se ofrezcan en centros de estética bajo el mismo nombre.
-- Cavitación/Criolipólisis, Peeling Químico Estético y Microagujas/Dermapen
-- ya llevaban "estético" en su propio nombre — se listan también en Centro
-- Estético en vez de duplicarse.
UPDATE consent_templates
SET extra_categories = ARRAY['centro_estetico']
WHERE id IN (
  '10000001-0000-0000-0000-000000000010', -- HIFU
  '10000001-0000-0000-0000-000000000011', -- Radiofrecuencia Facial y Corporal
  '10000001-0000-0000-0000-000000000012', -- Cavitación y Criolipólisis
  '10000001-0000-0000-0000-000000000018', -- Microagujas / Dermapen
  '10000001-0000-0000-0000-000000000020'  -- Peeling Químico Estético (Superficial)
);
