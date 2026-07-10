-- Consentimientos informados de Osteopatía y Quiropraxia — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Osteopatía y Quiropraxia (terapia manual realizada en el ámbito
-- sanitario, habitualmente por fisioterapeutas u otro personal sanitario
-- colegiado con formación específica en técnicas osteopáticas/quiroprácticas).

DO $$
DECLARE
  v_general UUID := '10000012-0000-0000-0000-000000000001';
  v_vert    UUID := '10000012-0000-0000-0000-000000000002';
  v_craneal UUID := '10000012-0000-0000-0000-000000000003';
  v_pediat  UUID := '10000012-0000-0000-0000-000000000004';
  v_visceral UUID := '10000012-0000-0000-0000-000000000005';
  v_legal   JSONB;
  v_img     TEXT;
BEGIN

  v_legal := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 16,
      "witnessRequired": false,
      "retentionYears": 5,
      "introText": "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre el tratamiento propuesto antes de decidir si desea o no someterse al mismo.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del tratamiento, sin que ello suponga perjuicio alguno en la atención que se le preste.",
      "dataClause": "Sus datos personales y de salud serán tratados por este centro con la finalidad exclusiva de gestionar su historia clínica, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>10. Sesión de imágenes</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo podrá realizar fotografías o vídeos de la exploración postural o del gesto tratado, con el fin de documentar el estado previo y valorar la evolución. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>El uso de estas imágenes con cualquier finalidad distinta al seguimiento clínico requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia).</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales del centro).</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito al centro, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente (o su padre/madre/tutor legal, en caso de menor de edad) declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. OSTEOPATÍA GENERAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_general, 'Osteopatía General', 'osteopatia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Osteopatía General',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Evaluación y tratamiento manual del sistema musculoesquelético mediante técnicas osteopáticas (movilización articular, técnicas de tejidos blandos, estiramientos y, en su caso, manipulaciones de baja velocidad), dirigidas a restaurar la movilidad y el equilibrio funcional del cuerpo.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aliviar el dolor y la restricción de movilidad de origen musculoesquelético, y mejorar la función global del sistema neuromusculoesquelético.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional realiza una anamnesis y exploración física completa, y aplica las técnicas manuales que considere más adecuadas según los hallazgos: movilización articular suave, técnicas miofasciales, estiramientos y, cuando esté indicado, manipulaciones articulares de baja amplitud. La sesión dura entre 30 y 60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Alivio del dolor musculoesquelético</li>
  <li>Mejora de la movilidad articular y la función global</li>
  <li>Reducción de la tensión muscular asociada</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia o dolor leve transitorio en las 24-48 horas posteriores a la sesión</li>
  <li>Cansancio o sensación de "resaca" tras el tratamiento</li>
  <li>Enrojecimiento cutáneo leve en la zona tratada</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Agravamiento transitorio de los síntomas previos</li>
  <li>Lesión de tejidos blandos (distensión muscular o ligamentosa) en pacientes con fragilidad tisular</li>
  <li>Fractura, en pacientes con osteoporosis severa u otra fragilidad ósea no detectada previamente</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Fracturas recientes o sospecha de fractura no consolidada</li>
  <li>Osteoporosis severa o metástasis óseas conocidas en la zona a tratar</li>
  <li>Procesos infecciosos o inflamatorios agudos en la zona</li>
  <li>Trombosis venosa profunda no tratada</li>
  <li>Patología tumoral no diagnosticada con signos de alarma ("banderas rojas")</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Se recomienda hidratación adecuada, evitar esfuerzos físicos intensos las 24 horas siguientes, y comunicar al profesional cualquier síntoma inusual o persistente.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Fisioterapia convencional, tratamiento farmacológico sintomático pautado por un médico, o abstención terapéutica con reposo relativo.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. MANIPULACIÓN VERTEBRAL / AJUSTE QUIROPRÁCTICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_vert, 'Manipulación Vertebral / Ajuste Quiropráctico', 'osteopatia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Manipulación Vertebral / Ajuste Quiropráctico',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica manual de alta velocidad y baja amplitud (thrust) aplicada sobre una articulación vertebral con restricción de movilidad, con el objetivo de restaurar su rango de movimiento normal. Suele acompañarse de un chasquido articular audible, fenómeno normal y esperado de la técnica.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la movilidad de la articulación vertebral afectada y aliviar el dolor y la contractura muscular asociados a la restricción articular.</p>

<h2>3. Cómo se realiza</h2>
<p>Tras la exploración física y, si procede, la revisión de pruebas de imagen previas, el/la profesional posiciona la articulación y aplica un impulso manual rápido y de corto recorrido sobre el segmento vertebral afectado. Cada ajuste dura solo segundos, dentro de una sesión de 15-30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Alivio rápido del dolor y la rigidez vertebral</li>
  <li>Mejora inmediata del rango de movimiento articular</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia local leve o rigidez transitoria en las horas posteriores</li>
  <li>Dolor de cabeza leve y pasajero, especialmente tras manipulación cervical</li>
  <li>Cansancio general tras la sesión</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Síndrome de arteria vertebral</strong> (extremadamente infrecuente, asociado sobre todo a la manipulación cervical de alta velocidad), con riesgo de accidente cerebrovascular — por ello se realiza siempre cribado previo de contraindicaciones vasculares</li>
  <li>Lesión de raíz nerviosa o agravamiento de una hernia discal preexistente no diagnosticada</li>
  <li>Fractura, en pacientes con fragilidad ósea no detectada (osteoporosis severa, metástasis)</li>
  <li>Esguince o distensión de estructuras ligamentosas vertebrales</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Inestabilidad vertebral, fractura o luxación no consolidada</li>
  <li>Osteoporosis severa o patología ósea tumoral en la zona</li>
  <li>Enfermedad vascular cervical conocida (disección arterial, insuficiencia vertebrobasilar)</li>
  <li>Hernia discal con signos neurológicos progresivos, salvo valoración específica</li>
  <li>Coagulopatías no controladas o tratamiento anticoagulante sin valoración previa</li>
  <li>Artritis reumatoide avanzada con afectación de la columna cervical alta</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Se recomienda hidratación adecuada, movimiento suave en las horas siguientes evitando cargas bruscas, y consultar de inmediato ante la aparición de mareo intenso, alteración visual, dificultad para hablar o debilidad en extremidades tras la manipulación cervical.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Técnicas de movilización articular de baja velocidad (sin impulso), fisioterapia convencional, o tratamiento farmacológico sintomático pautado por un médico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. OSTEOPATÍA CRANEAL / CRANEOSACRAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_craneal, 'Osteopatía Craneal / Craneosacral', 'osteopatia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Osteopatía Craneal / Craneosacral',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica manual suave aplicada sobre el cráneo, la columna vertebral y el sacro, mediante contactos de presión muy ligera, dirigida a valorar y tratar el sistema craneosacral.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aliviar tensiones craneales y cervicales, favorecer la relajación general, y complementar el abordaje de cefaleas tensionales, bruxismo o tensión cervical de origen musculoesquelético.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional aplica contactos manuales muy suaves sobre el cráneo, la columna vertebral y el sacro, escuchando el ritmo y la tensión de los tejidos, y realizando técnicas de liberación muy sutiles. La sesión dura entre 30 y 45 minutos y se realiza habitualmente en posición tumbada.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Relajación general y reducción de la tensión craneocervical</li>
  <li>Alivio complementario de cefaleas de origen tensional</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Somnolencia o relajación profunda durante o tras la sesión</li>
  <li>Sensación pasajera de mareo leve al incorporarse</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Agravamiento transitorio de síntomas previos (cefalea, mareo)</li>
  <li>Reacción emocional inesperada durante la sesión (poco frecuente, descrita en técnicas de relajación profunda)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Traumatismo craneoencefálico reciente</li>
  <li>Hipertensión intracraneal o hidrocefalia no controlada</li>
  <li>Aneurisma cerebral conocido</li>
  <li>Fractura craneal reciente no consolidada</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Se recomienda reposo relativo e hidratación tras la sesión, y evitar actividades que requieran plena alerta inmediatamente después si se ha experimentado somnolencia marcada.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Técnicas de relajación y terapia manual convencional, fisioterapia cervical, o tratamiento farmacológico sintomático pautado por un médico en caso de cefalea.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. OSTEOPATÍA PEDIÁTRICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_pediat, 'Osteopatía Pediátrica', 'osteopatia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Osteopatía Pediátrica',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento osteopático adaptado a recién nacidos, lactantes y niños, mediante técnicas manuales muy suaves (de intensidad y presión muy inferior a las empleadas en adultos), dirigidas a valorar y tratar restricciones de movilidad del sistema musculoesquelético y craneosacral infantil.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Abordar molestias frecuentes en la primera infancia como plagiocefalia postural, tortícolis congénita, cólicos del lactante o dificultades de succión de origen mecánico, siempre como tratamiento complementario y nunca sustitutivo del seguimiento pediátrico habitual.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional realiza una valoración específica de la movilidad craneal, cervical y corporal del bebé o niño/a, y aplica técnicas manuales muy suaves, sin manipulaciones de alta velocidad. La sesión dura entre 20 y 30 minutos y se adapta al estado y tolerancia del menor en cada momento.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la movilidad cervical en casos de tortícolis postural</li>
  <li>Alivio complementario de molestias asociadas a cólicos del lactante</li>
  <li>Apoyo en la mejora de la asimetría craneal postural leve</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Llanto o irritabilidad transitoria durante o tras la sesión</li>
  <li>Somnolencia o cambios pasajeros en el patrón de sueño el día del tratamiento</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Agravamiento transitorio de la irritabilidad o del llanto</li>
  <li>Retraso en la identificación de una causa médica subyacente si el tratamiento osteopático se emplea como sustituto, en lugar de complemento, de la valoración pediátrica — por ello se recomienda mantener siempre el seguimiento por el pediatra</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Sospecha de patología orgánica no diagnosticada (siempre derivar a valoración pediátrica previa)</li>
  <li>Fragilidad ósea congénita (osteogénesis imperfecta) u otra condición que contraindique la manipulación, incluso suave</li>
  <li>Proceso infeccioso agudo o fiebre en el momento de la sesión</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Observar al menor durante las horas siguientes, mantener sus rutinas habituales de alimentación y sueño, y consultar con el pediatra ante cualquier síntoma que genere preocupación.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Seguimiento y tratamiento exclusivamente pediátrico convencional, fisioterapia infantil, o medidas posturales domiciliarias según indicación del pediatra.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. OSTEOPATÍA VISCERAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_visceral, 'Osteopatía Visceral', 'osteopatia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Osteopatía Visceral',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica manual suave dirigida a valorar y mejorar la movilidad de los órganos abdominales y torácicos y sus estructuras de sujeción (fascias y ligamentos viscerales), con el objetivo de favorecer su función y su relación con el sistema musculoesquelético.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar la movilidad visceral y aliviar molestias funcionales asociadas (digestivas leves, tensión abdominal, dolor lumbar o pélvico de posible origen visceral-mecánico), siempre como tratamiento complementario a la valoración médica correspondiente.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional realiza una exploración manual suave del abdomen y, en su caso, del tórax, valorando la movilidad de los órganos y aplicando técnicas de presión ligera y estiramiento fascial. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la sensación de tensión o pesadez abdominal</li>
  <li>Alivio complementario de molestias digestivas funcionales leves</li>
  <li>Mejora de la movilidad global asociada a restricciones viscerales</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia abdominal leve y transitoria tras la sesión</li>
  <li>Cambios pasajeros en el tránsito intestinal el día del tratamiento</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Agravamiento transitorio de la sintomatología digestiva previa</li>
  <li>Retraso en el diagnóstico de una patología orgánica subyacente no valorada médicamente, si se prescinde de la evaluación médica pertinente ante síntomas de alarma</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Abdomen agudo o dolor abdominal de causa no filiada (derivar a urgencias)</li>
  <li>Embarazo de riesgo o primer trimestre, salvo valoración específica</li>
  <li>Cirugía abdominal reciente no cicatrizada por completo</li>
  <li>Aneurisma de aorta abdominal conocido</li>
  <li>Patología tumoral abdominal no diagnosticada con signos de alarma</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Se recomienda hidratación adecuada, comida ligera tras la sesión, y consultar con un médico si aparece dolor abdominal intenso, fiebre o cualquier síntoma de alarma en los días posteriores.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Valoración y tratamiento médico/digestivo convencional, fisioterapia abdominal, o técnicas de relajación y respiración.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
