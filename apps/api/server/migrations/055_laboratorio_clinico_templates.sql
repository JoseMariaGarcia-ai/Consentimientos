-- Consentimientos informados de Laboratorio Clínico / Extracción de Muestras — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Laboratorio Clínico (procedimientos diagnósticos; sin sesión de
-- imágenes clínicas, al no aplicar a este tipo de procedimiento).

DO $$
DECLARE
  v_sangre   UUID := '10000014-0000-0000-0000-000000000001';
  v_antigeno UUID := '10000014-0000-0000-0000-000000000002';
  v_genetica UUID := '10000014-0000-0000-0000-000000000003';
  v_alergia  UUID := '10000014-0000-0000-0000-000000000004';
  v_legal    JSONB;
  v_legal_gen JSONB;
  v_decl     TEXT;
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
      "introText": "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre la prueba propuesta antes de decidir si desea o no someterse a ella.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización de la prueba, sin que ello suponga perjuicio alguno en la atención que se le preste.",
      "dataClause": "Sus datos personales y de salud serán tratados por este centro con la finalidad exclusiva de gestionar su historia clínica y el resultado de la prueba solicitada, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_legal_gen := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD), en particular su artículo 9 sobre categorías especiales de datos (datos genéticos), y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 16,
      "witnessRequired": false,
      "retentionYears": 5,
      "introText": "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre la prueba genética propuesta antes de decidir si desea o no someterse a ella. Los datos genéticos constituyen una categoría especial de datos conforme al artículo 9 del RGPD, sujeta a garantías reforzadas de protección.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización de la prueba, así como a no ser informado/a de determinados resultados (derecho a no saber), salvo que ello suponga un peligro grave para su salud o la de terceros.",
      "dataClause": "Sus datos genéticos, como categoría especial de datos conforme al artículo 9 del RGPD, serán tratados por este centro con la finalidad exclusiva de la prueba solicitada, con medidas de seguridad reforzadas y acceso restringido al personal estrictamente necesario. No se utilizarán para ninguna otra finalidad (seguros, empleo u otras) sin su consentimiento expreso adicional. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_decl := '<h2>9. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización de la prueba descrita, conociendo que puede revocarla en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. EXTRACCIÓN DE SANGRE / ANALÍTICA GENERAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_sangre, 'Extracción de Sangre / Analítica General', 'laboratorio_clinico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extracción de Sangre / Analítica General',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Extracción de una muestra de sangre venosa mediante venopunción, habitualmente en el pliegue del codo, para su posterior análisis en laboratorio clínico.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Obtener una muestra sanguínea para la realización de los análisis clínicos solicitados (hemograma, bioquímica, hormonas u otros parámetros), con fines diagnósticos, de seguimiento o de control rutinario.</p>

<h2>3. Cómo se realiza</h2>
<p>El personal sanitario localiza una vena periférica adecuada, desinfecta la zona y extrae la cantidad de sangre necesaria mediante una aguja estéril de un solo uso. El procedimiento dura entre 2 y 5 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Obtención de información diagnóstica precisa sobre su estado de salud</li>
  <li>Detección precoz de alteraciones analíticas relevantes</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor leve y transitorio en el momento de la punción</li>
  <li>Pequeño hematoma en la zona de punción</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Mareo o síncope vasovagal durante o tras la extracción</li>
  <li>Infección local en el punto de punción</li>
  <li>Flebitis (inflamación de la vena)</li>
  <li>Lesión nerviosa local, excepcional</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>No existen contraindicaciones absolutas; se extremará la precaución en pacientes con trastornos graves de la coagulación o venas de difícil acceso</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener presión sobre el punto de punción unos minutos, evitar esfuerzos intensos con el brazo utilizado durante las horas siguientes, y consultar si aparece hematoma extenso, dolor intenso o signos de infección.</p>

' || v_decl
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. PRUEBAS RÁPIDAS DE ANTÍGENOS/PCR
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_antigeno, 'Pruebas Rápidas de Antígenos/PCR', 'laboratorio_clinico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Pruebas Rápidas de Antígenos/PCR',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Toma de muestra nasofaríngea, orofaríngea o salival para la detección de antígenos o material genético (PCR) de agentes infecciosos (virus respiratorios u otros patógenos, según la prueba solicitada).</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Detectar la presencia de una infección activa, con fines diagnósticos, de cribado o de control previo a determinadas actividades o desplazamientos.</p>

<h2>3. Cómo se realiza</h2>
<p>El personal sanitario introduce un hisopo estéril en la fosa nasal y/o la orofaringe para obtener la muestra, o recoge una muestra de saliva según el tipo de prueba. El procedimiento dura menos de 1 minuto y el resultado se obtiene en minutos (prueba rápida de antígenos) o en horas/días (PCR de laboratorio).</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Diagnóstico rápido de una posible infección activa</li>
  <li>Posibilidad de iniciar precozmente medidas de aislamiento o tratamiento si procede</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia leve y transitoria durante la toma de la muestra nasofaríngea</li>
  <li>Estornudo o lagrimeo reflejo durante la toma</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Pequeño sangrado nasal transitorio</li>
  <li>Resultado falso negativo o falso positivo, inherente a la sensibilidad y especificidad de la técnica empleada</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Traumatismo nasal reciente o cirugía nasal reciente (valorar vía alternativa de toma de muestra)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales. Se recomienda seguir las indicaciones sanitarias correspondientes según el resultado obtenido.</p>

' || v_decl
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. PRUEBAS GENÉTICAS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_genetica, 'Pruebas Genéticas', 'laboratorio_clinico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Pruebas Genéticas',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Análisis de material genético (ADN) obtenido mediante muestra de sangre o saliva, dirigido a la detección de variantes genéticas asociadas a determinadas características, predisposiciones o enfermedades, según la prueba solicitada.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Obtener información genética con fines diagnósticos, de cribado de portadores, de estudio de predisposición a determinadas patologías, o de otro tipo según la prueba específica solicitada y explicada previamente al paciente.</p>

<h2>3. Cómo se realiza</h2>
<p>Se obtiene una muestra de sangre venosa o de saliva, que se envía a un laboratorio especializado en genética para su análisis mediante las técnicas correspondientes (secuenciación, arrays u otras). El resultado suele tardar varias semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Información relevante para el diagnóstico, la prevención o la toma de decisiones sobre su salud</li>
  <li>Posibilidad de consejo genético personalizado según el resultado</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia leve asociada a la extracción de la muestra (venopunción o toma de saliva)</li>
  <li>Impacto emocional ante la espera o la comunicación del resultado</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Hallazgo de información genética inesperada, no relacionada con el motivo original de la prueba (hallazgos incidentales), que se comunicará conforme a su voluntad expresada (derecho a saber/no saber)</li>
  <li>Implicaciones para familiares biológicos, dado el carácter hereditario de determinada información genética, que podrá recomendarse comunicar de forma voluntaria</li>
  <li>Resultado no concluyente, requiriendo pruebas complementarias</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>No existen contraindicaciones médicas para la obtención de la muestra; se recomienda asesoramiento genético previo en pruebas de alto impacto psicológico o predictivo</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados físicos especiales. Se ofrecerá información y apoyo (consejo genético) en la entrega del resultado, especialmente en pruebas predictivas de enfermedades graves.</p>

' || v_decl
    )
  ), v_legal_gen)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. PRUEBAS DE ALERGIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_alergia, 'Pruebas de Alergia', 'laboratorio_clinico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Pruebas de Alergia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Pruebas cutáneas (prick test o intradérmicas) para la detección de sensibilización a alérgenos específicos (pólenes, ácaros, alimentos, fármacos u otros), mediante la aplicación de pequeñas cantidades del alérgeno sobre la piel.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Identificar el agente o agentes responsables de una reacción alérgica, con fines diagnósticos y para orientar el tratamiento y las medidas de evitación correspondientes.</p>

<h2>3. Cómo se realiza</h2>
<p>El personal sanitario aplica una gota de cada extracto alergénico sobre la piel del antebrazo (o la espalda) y realiza una pequeña punción superficial (prick test) o una inyección intradérmica, según la prueba indicada, valorando la reacción cutánea a los 15-20 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Identificación precisa del alérgeno causante de los síntomas</li>
  <li>Orientación del tratamiento (evitación, inmunoterapia, medicación) según el resultado</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Picor, enrojecimiento e inflamación local en los puntos positivos, de resolución en horas</li>
  <li>Molestia leve durante la punción o inyección</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Reacción alérgica generalizada o anafilaxia</strong> (excepcional pero potencialmente grave), por lo que la prueba se realiza siempre en un centro sanitario con capacidad de respuesta inmediata ante esta eventualidad</li>
  <li>Reacción local tardía o de mayor intensidad de la esperada</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Antecedente de anafilaxia grave al alérgeno a testar (valorar pruebas alternativas, como analítica de IgE específica)</li>
  <li>Dermatitis extensa en la zona de aplicación de la prueba</li>
  <li>Tratamiento con antihistamínicos no suspendido con la antelación necesaria (puede alterar el resultado)</li>
  <li>Asma no controlada en el momento de la prueba</li>
  <li>Embarazo, salvo indicación específica</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Permanecer en observación en el centro durante el tiempo indicado tras la prueba, evitar rascarse la zona, y acudir de inmediato a urgencias si aparecen síntomas de reacción generalizada (dificultad respiratoria, hinchazón facial, mareo intenso) tras abandonar el centro.</p>

' || v_decl
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
