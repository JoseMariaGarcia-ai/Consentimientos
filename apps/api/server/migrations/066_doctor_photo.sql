-- Foto de perfil del doctor, mostrada en el circulito de avatar. Se guarda
-- solo la clave del objeto en R2 (bucket privado); la URL firmada se
-- resuelve al vuelo en cada GET /doctors, igual que las fotos de pacientes.
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS photo_key TEXT;
