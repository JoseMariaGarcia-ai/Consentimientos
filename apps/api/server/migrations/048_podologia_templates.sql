-- Consentimientos informados de Podología — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Podología (el/la podólogo/a es personal sanitario colegiado).

DO $$
DECLARE
  v_uña     UUID := '10000008-0000-0000-0000-000000000001';
  v_verruga UUID := '10000008-0000-0000-0000-000000000002';
  v_quiro   UUID := '10000008-0000-0000-0000-000000000003';
  v_plant   UUID := '10000008-0000-0000-0000-000000000004';
  v_matriz  UUID := '10000008-0000-0000-0000-000000000005';
  v_diabet  UUID := '10000008-0000-0000-0000-000000000006';
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
      "dataClause": "Sus datos personales y de salud serán tratados por este centro con la finalidad exclusiva de gestionar su historia clínica podológica, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>10. Sesión de imágenes (fotografías)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo podológico podrá realizar fotografías del pie tratado antes, durante y después del procedimiento, con el fin de documentar el estado previo y valorar la evolución. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>El uso de estas imágenes con cualquier finalidad distinta al seguimiento clínico requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia).</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales del centro).</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito al centro, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la podólogo/a y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. TRATAMIENTO DE UÑA ENCARNADA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_uña, 'Tratamiento de Uña Encarnada (Onicocriptosis)', 'podologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tratamiento de Uña Encarnada',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento de la uña encarnada (onicocriptosis), que puede realizarse mediante técnica conservadora (corte y ortonixia) o mediante cirugía ungueal parcial bajo anestesia local si el grado de afectación lo requiere.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aliviar el dolor y la inflamación causados por el borde de la uña que se clava en el tejido periungueal, y prevenir infecciones asociadas (paroniquia).</p>

<h2>3. Cómo se realiza</h2>
<p>El/la podólogo/a valora el grado de afectación y realiza el tratamiento conservador (corte del borde afectado, colocación de órtesis ungueal) o, en casos recurrentes o infectados, la cirugía parcial de la uña bajo anestesia local. La duración varía entre 15 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Alivio inmediato del dolor y la presión</li>
  <li>Resolución de la infección si estaba presente</li>
  <li>Prevención de recidivas, especialmente con la técnica quirúrgica</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia o dolor leve tras el procedimiento (especialmente en la técnica quirúrgica)</li>
  <li>Sangrado leve durante o después del tratamiento</li>
  <li>Sensibilidad al calzado cerrado los días siguientes</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Infección postquirúrgica</li>
  <li>Recidiva de la uña encarnada, especialmente con la técnica conservadora</li>
  <li>Cicatrización anómala del lecho ungueal</li>
  <li>Cambio permanente en la forma de la uña tras la cirugía parcial (efecto esperado de la técnica, no una complicación)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección activa muy extensa que requiera tratamiento antibiótico previo</li>
  <li>Diabetes mal controlada o enfermedad vascular periférica severa (valorar con precaución)</li>
  <li>Coagulopatías no controladas (para la técnica quirúrgica)</li>
  <li>Alergia conocida al anestésico local</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener el vendaje indicado, realizar los baños o curas prescritas, usar calzado cómodo y abierto los primeros días, y acudir a la revisión de control.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Corte y limado periódico de mantenimiento (sin resolver la causa de fondo en casos recurrentes), u órtesis ungueales correctoras como alternativa no quirúrgica.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. EXTRACCIÓN DE VERRUGAS PLANTARES
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_verruga, 'Extracción de Verrugas Plantares (Papiloma Plantar)', 'podologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extracción de Verrugas Plantares',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento de lesiones cutáneas plantares causadas por el virus del papiloma humano (VPH), mediante técnicas como crioterapia, electrocoagulación, curetaje o aplicación de agentes queratolíticos, según el tamaño y localización de la lesión.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminar la verruga plantar, aliviar el dolor asociado a la presión al caminar, y prevenir su propagación a otras zonas del pie o a otras personas.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la podólogo/a aplica la técnica más adecuada según el caso (crioterapia con nitrógeno líquido, electrocoagulación bajo anestesia local, curetaje, o tratamiento químico progresivo), pudiendo requerir varias sesiones espaciadas en el tiempo.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación de la lesión y del dolor asociado a la presión</li>
  <li>Reducción del riesgo de contagio a otras zonas o personas</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor durante y después del tratamiento</li>
  <li>Formación de ampolla en la zona tratada (crioterapia)</li>
  <li>Necesidad de varias sesiones para la eliminación completa</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Infección local</li>
  <li>Cicatriz residual, especialmente con técnicas más agresivas (electrocoagulación)</li>
  <li>Recidiva de la lesión (el virus puede persistir en el tejido circundante)</li>
  <li>Despigmentación local transitoria o permanente</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Enfermedad vascular periférica severa</li>
  <li>Diabetes mal controlada (valorar con precaución la técnica más adecuada)</li>
  <li>Infección activa en la zona</li>
  <li>Alergia conocida al anestésico local (técnicas que lo requieran)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener la zona limpia y protegida, evitar caminar descalzo en zonas húmedas compartidas durante el tratamiento (piscinas, duchas comunitarias) para prevenir el contagio, y acudir a las sesiones de seguimiento programadas.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento tópico domiciliario con agentes queratolíticos de venta en farmacia (más lento y con menor tasa de éxito en lesiones establecidas), o derivación a dermatología en casos resistentes al tratamiento podológico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. QUIROPODIA / PODOLOGÍA GENERAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_quiro, 'Quiropodia / Podología General', 'podologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Quiropodia / Podología General',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento podológico general que incluye corte y limado de uñas, tratamiento de durezas (hiperqueratosis) y callosidades, e hidratación de la piel del pie.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mantener la salud e higiene del pie, prevenir complicaciones derivadas de durezas o uñas mal cuidadas, y mejorar el confort al caminar.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la podólogo/a realiza el corte y limado de las uñas, la reducción de durezas y callosidades con instrumental específico (bisturí, fresa), y aplica productos hidratantes. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora del confort y prevención de dolor por presión de durezas</li>
  <li>Prevención de complicaciones derivadas del mal cuidado de las uñas</li>
  <li>Mejora del aspecto e higiene general del pie</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Sensibilidad leve en la zona tratada tras la reducción de durezas</li>
  <li>Pequeño sangrado si la dureza es muy profunda</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Pequeña herida o corte accidental, especialmente en pieles muy finas o frágiles</li>
  <li>Infección local si no se mantiene higiene adecuada tras el tratamiento</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección activa o herida abierta en el pie a tratar</li>
  <li>Enfermedad vascular periférica severa (valorar técnica con especial precaución)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener los pies hidratados diariamente, usar calzado adecuado y transpirable, y acudir a revisiones periódicas de mantenimiento (cada 4-8 semanas según necesidad).</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Cuidado domiciliario básico (no sustituye el tratamiento profesional de durezas ya formadas), o plantillas ortopédicas si la causa de las durezas es un problema biomecánico de base.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. PLANTILLAS ORTOPÉDICAS A MEDIDA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_plant, 'Plantillas Ortopédicas a Medida', 'podologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Plantillas Ortopédicas a Medida',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Estudio biomecánico de la pisada y fabricación de plantillas ortopédicas personalizadas, diseñadas para corregir o compensar alteraciones en el apoyo del pie durante la marcha.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corregir o compensar alteraciones biomecánicas del pie (pie plano, cavo, pronación excesiva, entre otras), aliviar el dolor asociado, y mejorar la distribución de las presiones plantares durante la marcha o el deporte.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la podólogo/a realiza un estudio biomecánico (exploración física, análisis de la pisada, y en ocasiones plataforma de presiones), toma un molde o escaneado del pie, y diseña la plantilla a medida según los hallazgos, que se fabrica en laboratorio y se ajusta en una segunda cita.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la distribución de presiones plantares</li>
  <li>Alivio del dolor asociado a alteraciones biomecánicas (fascitis, metatarsalgia, entre otras)</li>
  <li>Mejora de la postura y el rendimiento deportivo en casos seleccionados</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Periodo de adaptación con molestia leve las primeras semanas de uso</li>
  <li>Necesidad de cambiar de calzado en algunos casos para adaptarse a la plantilla</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Rozaduras o irritación cutánea si la plantilla no se ajusta correctamente</li>
  <li>Resultado insuficiente si la corrección no se ajusta adecuadamente, requiriendo modificación</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>No existen contraindicaciones relevantes; se debe adaptar el diseño en casos de heridas activas o deformidades severas del pie</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Uso progresivo de la plantilla durante las primeras semanas (aumentando el tiempo de uso gradualmente), mantenimiento e higiene periódica, y acudir a revisión si aparece molestia persistente.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Plantillas prefabricadas de farmacia (menor precisión de corrección), calzado ortopédico específico, o tratamiento fisioterapéutico complementario según la causa de la alteración biomecánica.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. CIRUGÍA UNGUEAL (MATRICECTOMÍA)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_matriz, 'Cirugía Ungueal (Matricectomía)', 'podologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Cirugía Ungueal (Matricectomía)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica bajo anestesia local que consiste en la eliminación parcial o total de la matriz ungueal (la zona de crecimiento de la uña), mediante técnica química (fenolización) o quirúrgica convencional, para evitar el recrecimiento de la parte de uña eliminada.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Tratamiento definitivo de la uña encarnada recidivante, evitando que la parte problemática de la uña vuelva a crecer.</p>

<h2>3. Cómo se realiza</h2>
<p>Previo bloqueo anestésico local del dedo, el/la podólogo/a elimina la porción de uña afectada y destruye químicamente (con fenol) o extirpa quirúrgicamente la matriz correspondiente, para evitar su recrecimiento. El procedimiento dura entre 30 y 60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resolución definitiva de la uña encarnada recidivante en la zona tratada</li>
  <li>Baja tasa de recidiva comparada con el tratamiento conservador</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor postoperatorio moderado durante varios días</li>
  <li>Inflamación y supuración serosa durante el proceso de cicatrización (2-4 semanas)</li>
  <li>Cambio permanente en el ancho de la uña (efecto esperado de la técnica)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Infección postquirúrgica</li>
  <li>Recidiva si la destrucción de la matriz no es completa</li>
  <li>Cicatrización prolongada, especialmente en pacientes con mala circulación</li>
  <li>Espícula (fragmento de uña residual que vuelve a crecer de forma anómala), requiriendo una segunda intervención</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Enfermedad vascular periférica severa</li>
  <li>Diabetes mal controlada</li>
  <li>Infección activa no tratada previamente</li>
  <li>Coagulopatías no controladas</li>
  <li>Alergia conocida al anestésico local o al fenol</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Curas periódicas según pauta indicada (habitualmente diarias las primeras semanas), mantener el pie elevado y en reposo relativo los primeros días, uso de calzado abierto, y acudir a las revisiones de control hasta la cicatrización completa.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento conservador de mantenimiento (corte y ortonixia, con mayor tasa de recidiva), u órtesis ungueales correctoras en casos leves.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. TRATAMIENTO DEL PIE DIABÉTICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_diabet, 'Tratamiento del Pie Diabético', 'podologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tratamiento del Pie Diabético',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Valoración y tratamiento podológico especializado en pacientes diabéticos, dirigido a la prevención y el cuidado de las complicaciones del pie asociadas a la diabetes (neuropatía, alteración circulatoria, riesgo de úlceras).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Prevenir la aparición de úlceras y lesiones en el pie diabético, realizar un cuidado seguro de uñas y durezas adaptado al riesgo vascular y neurológico del paciente, y detectar precozmente signos de alarma.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la podólogo/a realiza una valoración de la sensibilidad (neuropatía) y la circulación del pie, y efectúa el tratamiento de uñas y durezas con técnica atraumática adaptada al riesgo del paciente, evitando cualquier procedimiento agresivo innecesario. La frecuencia de las revisiones se adapta al grado de riesgo (cada 4-12 semanas).</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Prevención de úlceras y complicaciones graves del pie diabético</li>
  <li>Detección precoz de alteraciones circulatorias o neurológicas</li>
  <li>Cuidado seguro adaptado a la fragilidad especial del pie diabético</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Mayor sensibilidad al manejo instrumental por la fragilidad del tejido</li>
  <li>Cicatrización más lenta de lo habitual ante cualquier microlesión, propia de la condición diabética</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Herida o úlcera que no cicatrice adecuadamente</strong>, con riesgo de infección grave dada la vulnerabilidad especial del pie diabético — por ello se extreman las precauciones y se emplea técnica atraumática</li>
  <li>Infección local con mayor riesgo de progresión que en un paciente no diabético</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>No existen contraindicaciones absolutas; el nivel de intervención se adapta siempre al grado de riesgo vascular y neurológico del paciente, evitando procedimientos invasivos en pies de muy alto riesgo salvo coordinación con el equipo médico</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Revisión diaria del pie por parte del paciente o familiar (buscando heridas, rozaduras o cambios de color), uso de calzado adecuado sin costuras internas, hidratación diaria evitando los espacios interdigitales, y consulta inmediata ante cualquier herida, por pequeña que sea.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>No existe alternativa al cuidado podológico especializado en pacientes diabéticos de riesgo; el autocuidado sin supervisión profesional incrementa significativamente el riesgo de complicaciones graves.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
