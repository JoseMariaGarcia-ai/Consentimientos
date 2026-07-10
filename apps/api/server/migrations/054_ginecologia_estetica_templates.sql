-- Consentimientos informados de Ginecología Estética — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Ginecología Estética. El rejuvenecimiento no quirúrgico usa el
-- marco estándar de medicina estética (mayor de 16, sin testigo). Los
-- procedimientos quirúrgicos (labioplastia, himenoplastia, perineoplastia,
-- vaginoplastia) usan el marco reforzado de cirugía (mayor de edad, testigo,
-- conservación 15 años), dada su naturaleza invasiva y su especial
-- sensibilidad para la intimidad de la paciente.

DO $$
DECLARE
  v_rejuv     UUID := '10000013-0000-0000-0000-000000000001';
  v_labio     UUID := '10000013-0000-0000-0000-000000000002';
  v_himeno    UUID := '10000013-0000-0000-0000-000000000003';
  v_perineo   UUID := '10000013-0000-0000-0000-000000000004';
  v_vagino    UUID := '10000013-0000-0000-0000-000000000005';
  v_legal_nq  JSONB;
  v_legal_q   JSONB;
  v_img_nq    TEXT;
  v_img_q     TEXT;
  v_anest     TEXT;
BEGIN

  v_legal_nq := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 16,
      "witnessRequired": false,
      "retentionYears": 5,
      "introText": "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre el tratamiento propuesto antes de decidir si desea o no someterse al mismo. Dada la naturaleza íntima de este tratamiento, se garantiza especial confidencialidad en todo momento.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del tratamiento, sin que ello suponga perjuicio alguno en la atención que se le preste.",
      "dataClause": "Sus datos personales y de salud, incluidos los relativos a este tratamiento de especial sensibilidad, serán tratados por esta clínica con la finalidad exclusiva de gestionar su historia clínica, de conformidad con el RGPD y la LOPDGDD, con las medidas de confidencialidad reforzada propias de datos íntimos. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_legal_q := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 18,
      "witnessRequired": true,
      "retentionYears": 15,
      "introText": "De conformidad con la Ley 41/2002, esta es una intervención quirúrgica de especial sensibilidad por afectar a la esfera íntima de la paciente. Usted tiene derecho a recibir información completa, comprensible y adecuada sobre el procedimiento, sus riesgos y alternativas, con tiempo suficiente para reflexionar antes de decidir si desea o no someterse al mismo, y con absoluta confidencialidad y respeto a su intimidad en todo el proceso.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización de la intervención, sin que ello suponga perjuicio alguno en la atención que se le preste.",
      "dataClause": "Sus datos personales y de salud, incluidos los relativos a esta intervención de especial sensibilidad, serán tratados por esta clínica/hospital con la finalidad exclusiva de gestionar su historia clínica quirúrgica, de conformidad con el RGPD y la LOPDGDD, con medidas de confidencialidad reforzada. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014. Dada la naturaleza quirúrgica e íntima de este procedimiento, se recomienda un periodo de reflexión antes de la firma definitiva."
    }
  }'::JSONB;

  v_anest := '<h2>6. Riesgos generales de la anestesia</h2>
<p>Este procedimiento se realiza bajo anestesia local con sedación, o anestesia regional/general según su extensión y la valoración anestésica previa, con los riesgos inherentes propios de cualquier procedimiento anestésico: reacción alérgica a los fármacos, complicación cardiorrespiratoria y, de forma excepcional, riesgo vital. Estos riesgos se minimizan mediante valoración preanestésica y monitorización continua por parte del equipo médico, que le informará específicamente sobre este aspecto.</p>
';

  v_img_nq := '<h2>10. Sesión de imágenes (fotografías clínicas)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo médico podrá realizar fotografías clínicas de la zona tratada antes y después del procedimiento, con el fin de documentar el estado previo y valorar la evolución. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen. Dada la naturaleza íntima de estas imágenes, se conservarán con medidas de seguridad reforzadas y acceso restringido al personal estrictamente necesario.</p>
<p>El uso de estas imágenes con cualquier finalidad distinta al seguimiento clínico requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes, siempre de forma no identificable, con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia).</li>
  <li>☐ Autorizo el uso de mis imágenes, siempre de forma no identificable, con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica).</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración de la paciente</h2>
<p>La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al equipo médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  v_img_q := '<h2>%s. Sesión de imágenes (fotografías clínicas)</h2>
<p>Como parte del diagnóstico y seguimiento de esta intervención, el equipo médico realizará fotografías clínicas de la zona antes, durante y después del procedimiento, con el fin de documentar el estado previo, planificar la intervención y valorar el resultado. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen. Dada la naturaleza íntima de estas imágenes, se conservarán con medidas de seguridad reforzadas y acceso restringido al personal estrictamente necesario.</p>
<p>El registro con fines clínicos y de planificación quirúrgica no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes, siempre de forma no identificable, con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia).</li>
  <li>☐ Autorizo el uso de mis imágenes, siempre de forma no identificable, con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica).</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>%s. Declaración de la paciente</h2>
<p>La paciente declara haber leído y comprendido la información anterior, incluidos los riesgos generales de la anestesia, haber dispuesto de tiempo suficiente para reflexionar, haber tenido la oportunidad de formular preguntas al equipo médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización de la intervención descrita, conociendo que puede revocarla en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. REJUVENECIMIENTO VAGINAL CON LÁSER/RADIOFRECUENCIA (NO QUIRÚRGICO)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_rejuv, 'Rejuvenecimiento Vaginal con Láser/Radiofrecuencia', 'ginecologia_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Rejuvenecimiento Vaginal con Láser/Radiofrecuencia',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento no quirúrgico de la mucosa vaginal mediante energía láser (CO2 fraccionado o Er:YAG) o radiofrecuencia, que estimula la producción de colágeno y mejora la elasticidad, hidratación y tono de la mucosa.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar síntomas de laxitud vaginal, sequedad, atrofia vulvovaginal (incluida la asociada a la menopausia) e incontinencia urinaria de esfuerzo leve, así como el aspecto y confort general de la zona.</p>

<h2>3. Cómo se realiza</h2>
<p>Con la paciente en posición ginecológica, se introduce el aplicador (láser o radiofrecuencia) en el canal vaginal, aplicando la energía de forma controlada sobre la mucosa. La sesión dura entre 15 y 30 minutos y suele requerir de 1 a 3 sesiones espaciadas 4-6 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la hidratación y elasticidad de la mucosa vaginal</li>
  <li>Reducción de la sequedad y las molestias asociadas a la atrofia vulvovaginal</li>
  <li>Mejora leve-moderada de síntomas de incontinencia urinaria de esfuerzo leve</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia o sensación de calor durante y tras la sesión</li>
  <li>Flujo vaginal ligero o spotting los días posteriores</li>
  <li>Sensibilidad local durante 24-48 horas</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Quemadura o lesión térmica de la mucosa por exceso de energía o mal manejo del dispositivo</li>
  <li>Infección local</li>
  <li>Resultado insuficiente o no perceptible, requiriendo sesiones adicionales</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo</li>
  <li>Infección vaginal o genital activa</li>
  <li>Sangrado vaginal de causa no filiada</li>
  <li>Patología oncológica ginecológica activa</li>
  <li>Prolapso genital severo (valorar derivación a tratamiento quirúrgico)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Abstinencia de relaciones sexuales durante 48-72 horas, evitar tampones y baños en piscina/mar durante los días indicados, y mantener higiene íntima habitual sin productos irritantes.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento hormonal tópico (estrógenos locales) pautado por ginecología, lubricantes/hidratantes vaginales, fisioterapia de suelo pélvico, o cirugía en casos de prolapso o laxitud severa.</p>

' || v_img_nq
    )
  ), v_legal_nq)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. LABIOPLASTIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_labio, 'Labioplastia', 'ginecologia_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Labioplastia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica de reducción y/o remodelación de los labios menores y/o mayores de la vulva, mediante técnica de resección de borde libre o técnica en cuña, según la anatomía y preferencia de la paciente.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir el tamaño o corregir la asimetría de los labios vulvares por motivos estéticos y/o funcionales (molestias con la ropa ajustada, práctica deportiva o relaciones sexuales).</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia local con sedación (o anestesia regional en casos seleccionados), el/la cirujano/a reseca el tejido sobrante siguiendo la técnica planificada, con sutura reabsorbible. La intervención dura entre 45 y 90 minutos y se realiza de forma ambulatoria.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del tamaño y mejora de la simetría de los labios vulvares</li>
  <li>Mejora del confort con la ropa ajustada, el deporte y las relaciones sexuales</li>
  <li>Mejora de la satisfacción con la propia imagen genital</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y hematomas en la zona durante 1-2 semanas</li>
  <li>Dolor o molestia local durante la primera semana</li>
  <li>Cicatriz en el borde tratado, habitualmente poco visible</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Asimetría residual o resultado estético no satisfactorio, que puede requerir cirugía de revisión</li>
  <li>Dehiscencia (apertura) de la sutura</li>
  <li>Infección postquirúrgica</li>
  <li>Alteración de la sensibilidad local, habitualmente transitoria</li>
  <li>Dispareunia (dolor con las relaciones sexuales) transitoria durante la cicatrización</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Infección genital activa</li>
  <li>Coagulopatías no controladas</li>
  <li>Expectativas no realistas sobre el resultado</li>
  <li>Patología ginecológica no diagnosticada con signos de alarma</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Higiene local con los productos indicados, uso de ropa interior de algodón holgada, abstinencia de relaciones sexuales durante 4-6 semanas, evitar deporte intenso durante 3-4 semanas, y acudir a las revisiones programadas.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>No intervenir (variante anatómica normal, sin necesidad médica de tratamiento), o tratamientos no quirúrgicos de mejora del confort (lubricantes, ropa adecuada) cuando el motivo sea exclusivamente funcional leve.</p>

' || format(v_img_q, '11', '12')
    )
  ), v_legal_q)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. HIMENOPLASTIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_himeno, 'Himenoplastia', 'ginecologia_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Himenoplastia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica de reconstrucción del himen mediante sutura de los restos del tejido himeneal, mediante técnica de himenorrafia con puntos reabsorbibles.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reconstruir la integridad anatómica del himen a petición expresa y voluntaria de la paciente, por motivos personales, culturales o psicológicos que le son propios y que la clínica respeta sin cuestionar.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia local con sedación, el/la cirujano/a aproxima y sutura los restos del tejido himeneal con puntos reabsorbibles, reconstruyendo la apariencia del himen. La intervención dura entre 30 y 60 minutos y se realiza de forma ambulatoria.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reconstrucción de la apariencia anatómica del himen</li>
  <li>Posible sangrado con la primera relación sexual posterior, coincidiendo con la rotura de la sutura reconstruida (resultado esperado y buscado por la paciente)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y molestia local durante 1-2 semanas</li>
  <li>Sangrado leve tras la intervención</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Que la sutura no resista hasta la relación sexual posterior, sin producirse el sangrado esperado</li>
  <li>Infección postquirúrgica</li>
  <li>Dehiscencia (apertura) precoz de la sutura</li>
  <li>Dispareunia (dolor con las relaciones sexuales) transitoria durante la cicatrización</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Infección genital activa</li>
  <li>Coagulopatías no controladas</li>
  <li>Ausencia de tejido himeneal residual suficiente para la reconstrucción (se informará a la paciente si no es técnicamente viable)</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Higiene local con los productos indicados, abstinencia de relaciones sexuales y de esfuerzos físicos intensos durante el periodo indicado por el/la cirujano/a (habitualmente 4-6 semanas), y acudir a la revisión de control.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>No intervenir. No existe alternativa no quirúrgica para reconstruir la anatomía del himen.</p>

' || format(v_img_q, '11', '12')
    )
  ), v_legal_q)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. PERINEOPLASTIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_perineo, 'Perineoplastia', 'ginecologia_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Perineoplastia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica de reconstrucción del periné y la musculatura perineal, frecuentemente afectada tras el parto (desgarros, episiotomías), mediante resección del exceso de tejido cicatricial y reaproximación muscular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la anatomía y el tono del periné, mejorar el confort y la función durante las relaciones sexuales, y corregir cicatrices perineales dolorosas o retráctiles derivadas del parto.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia regional o local con sedación, el/la cirujano/a reseca el tejido cicatricial excedente y reaproxima la musculatura del suelo pélvico y el periné, con sutura reabsorbible por planos. La intervención dura entre 45 y 90 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la anatomía y el tono perineal</li>
  <li>Reducción del dolor asociado a cicatrices retráctiles</li>
  <li>Mejora de la función y el confort en las relaciones sexuales</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematoma y molestia local durante 2-3 semanas</li>
  <li>Dolor con la sedestación prolongada las primeras semanas</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Dehiscencia (apertura) de la sutura</li>
  <li>Infección postquirúrgica</li>
  <li>Resultado estético o funcional insuficiente, que puede requerir revisión</li>
  <li>Dispareunia (dolor con las relaciones sexuales) transitoria o, raramente, persistente</li>
  <li>Estrechamiento excesivo del introito vaginal, en casos de sobrecorrección</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Infección genital o perineal activa</li>
  <li>Coagulopatías no controladas</li>
  <li>Periodo postparto insuficiente para garantizar la correcta cicatrización de los tejidos (habitualmente se recomienda esperar un mínimo de 6 meses tras el parto)</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Higiene local con los productos indicados, evitar la sedestación prolongada sin cojín especial las primeras semanas, abstinencia de relaciones sexuales y esfuerzos físicos intensos durante 6-8 semanas, y acudir a las revisiones programadas.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Fisioterapia de suelo pélvico, tratamientos no quirúrgicos (radiofrecuencia/láser) en casos leves, o no intervenir.</p>

' || format(v_img_q, '11', '12')
    )
  ), v_legal_q)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. VAGINOPLASTIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_vagino, 'Vaginoplastia', 'ginecologia_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Vaginoplastia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica de estrechamiento y reforzamiento de las paredes vaginales y la musculatura del suelo pélvico, mediante resección del exceso de mucosa vaginal redundante y plicatura (reaproximación) de la musculatura subyacente.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corregir la laxitud vaginal (frecuentemente secundaria a partos vaginales o al envejecimiento), mejorando el tono, la función y la satisfacción sexual.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia regional o general, el/la cirujano/a reseca el exceso de mucosa vaginal y reaproxima la musculatura del suelo pélvico mediante plicatura, con sutura reabsorbible. La intervención dura entre 60 y 120 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Estrechamiento y mejora del tono de las paredes vaginales</li>
  <li>Mejora de la función y la satisfacción durante las relaciones sexuales</li>
  <li>Mejora asociada, en algunos casos, de la incontinencia urinaria de esfuerzo leve</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, molestia y flujo vaginal durante 2-4 semanas</li>
  <li>Dolor con la sedestación o la marcha las primeras semanas</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Dehiscencia (apertura) de la sutura</li>
  <li>Infección postquirúrgica</li>
  <li>Estrechamiento excesivo del canal vaginal, dificultando las relaciones sexuales (sobrecorrección)</li>
  <li>Dispareunia (dolor con las relaciones sexuales), transitoria en la mayoría de los casos</li>
  <li>Fístula rectovaginal (excepcional)</li>
  <li>Resultado insuficiente, requiriendo cirugía de revisión</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Infección genital activa</li>
  <li>Coagulopatías no controladas</li>
  <li>Deseo de gestación futura a corto plazo (se recomienda completar la maternidad antes de la intervención, dado que un parto vaginal posterior puede alterar el resultado)</li>
  <li>Prolapso de órganos pélvicos significativo no corregido (valorar cirugía reconstructiva específica, no exclusivamente estética)</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Higiene local con los productos indicados, abstinencia de relaciones sexuales y uso de tampones durante 6-8 semanas, evitar esfuerzos físicos intensos durante el mismo periodo, y acudir a las revisiones programadas.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Fisioterapia de suelo pélvico (ejercicios de Kegel, biofeedback), tratamientos no quirúrgicos (radiofrecuencia/láser) en casos leves, o no intervenir.</p>

' || format(v_img_q, '11', '12')
    )
  ), v_legal_q)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
