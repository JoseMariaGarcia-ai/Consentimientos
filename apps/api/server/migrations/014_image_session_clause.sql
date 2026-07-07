-- supabase/migrations/014_image_session_clause.sql
-- Añade un apartado "Sesión de imágenes (fotografías y/o vídeos)" a las 7
-- plantillas de consentimiento existentes, justo antes de la declaración
-- final del paciente. Cubre el uso clínico (obligatorio, sin casilla) y dos
-- usos opcionales — formativo/científico y publicitario/difusión — con
-- casillas DESMARCADAS por defecto: un checkbox premarcado no constituye
-- consentimiento válido bajo el RGPD (art. 4.11 y considerando 32; doctrina
-- del TJUE en el caso Planet49) para un tratamiento de datos no esencial
-- como es el uso de la imagen del paciente con fines de difusión.

-- HA, BTX y CaHA tienen 10 apartados (Declaración es el 10 → pasa a ser 11).
UPDATE consent_templates
SET content_json = jsonb_set(
  content_json,
  '{es-ES,body}',
  to_jsonb(REPLACE(
    content_json->'es-ES'->>'body',
    '<h2>10. Declaración del paciente</h2>',
    '<h2>10. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo médico realizará fotografías y/o vídeos de la zona tratada antes, durante y después del procedimiento. Estas imágenes tienen como finalidad principal documentar el estado clínico previo, valorar la evolución y el resultado del tratamiento, y forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>La toma de imágenes con fines clínicos es necesaria para la correcta prestación asistencial y no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del paciente</h2>'
  ))
)
WHERE id IN (
  '10000001-0000-0000-0000-000000000001', -- Ácido Hialurónico
  '10000001-0000-0000-0000-000000000002', -- Toxina Botulínica
  '10000001-0000-0000-0000-000000000003'  -- CaHA
)
AND content_json->'es-ES'->>'body' NOT LIKE '%Sesión de imágenes%';

-- PLLA, Mesoterapia, Peeling y Skin Booster tienen 11 apartados (Declaración
-- es el 11 → pasa a ser 12), porque además incluyen un apartado propio de
-- "Cuidados postprocedimiento".
UPDATE consent_templates
SET content_json = jsonb_set(
  content_json,
  '{es-ES,body}',
  to_jsonb(REPLACE(
    content_json->'es-ES'->>'body',
    '<h2>11. Declaración del paciente</h2>',
    '<h2>11. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo médico realizará fotografías y/o vídeos de la zona tratada antes, durante y después del procedimiento. Estas imágenes tienen como finalidad principal documentar el estado clínico previo, valorar la evolución y el resultado del tratamiento, y forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>La toma de imágenes con fines clínicos es necesaria para la correcta prestación asistencial y no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>12. Declaración del paciente</h2>'
  ))
)
WHERE id IN (
  '10000001-0000-0000-0000-000000000004', -- PLLA
  '10000001-0000-0000-0000-000000000005', -- Mesoterapia
  '10000001-0000-0000-0000-000000000006', -- Peeling Químico
  '10000001-0000-0000-0000-000000000007'  -- Skin Booster
)
AND content_json->'es-ES'->>'body' NOT LIKE '%Sesión de imágenes%';
