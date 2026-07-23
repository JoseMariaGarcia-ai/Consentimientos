-- El logo de la clínica se sube a R2 (igual que la foto del doctor) —
-- clinics.logo_url ya existía pero nunca tuvo interfaz de subida y estaba
-- pensado para una URL externa pegada a mano. logo_key guarda la clave del
-- objeto en R2; la URL real (presignada, con caducidad) se resuelve en cada
-- lectura, nunca se guarda en la base de datos — igual que doctors.photo_key.
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_key TEXT;
