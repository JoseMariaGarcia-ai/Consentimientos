-- Color por tratamiento, para diferenciarlos visualmente en la agenda.
-- Se guarda una CLAVE de una paleta curada de colores suaves (ver
-- apps/web/src/lib/treatmentColors.ts), no un valor hex libre — evita que
-- se puedan elegir colores saturados que desentonen con el resto de la UI.
-- 'blue' es el mismo color que ya usaba la agenda por defecto para las
-- citas programadas, así que los tratamientos existentes no cambian de
-- aspecto al desplegar esto.
ALTER TABLE treatments ADD COLUMN IF NOT EXISTS color TEXT NOT NULL DEFAULT 'blue';
