-- Consentimientos informados adicionales de Medicina Estética — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Medicina Estética (ampliación: rinomodelación, toxina botulínica
-- para migraña crónica, radiofrecuencia con microagujas, bichectomía,
-- tratamiento de manchas/melasma y tratamiento de cicatrices y estrías).

DO $$
DECLARE
  v_rino     UUID := '10000001-0000-0000-0000-000000000028';
  v_migrana  UUID := '10000001-0000-0000-0000-000000000029';
  v_rfmicro  UUID := '10000001-0000-0000-0000-000000000030';
  v_bichect  UUID := '10000001-0000-0000-0000-000000000031';
  v_manchas  UUID := '10000001-0000-0000-0000-000000000032';
  v_cicatriz UUID := '10000001-0000-0000-0000-000000000033';
  v_legal    JSONB;
  v_img      TEXT;
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
      "introText": "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre el procedimiento propuesto antes de decidir si desea o no someterse al mismo.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del procedimiento, sin que ello suponga perjuicio alguno en la atención sanitaria que se le preste.",
      "dataClause": "Sus datos personales y de salud serán tratados por esta clínica con la finalidad exclusiva de gestionar su historia clínica, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>%s. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo médico realizará fotografías y/o vídeos de la zona tratada antes, durante y después del procedimiento. Estas imágenes tienen como finalidad principal documentar el estado clínico previo, valorar la evolución y el resultado del tratamiento, y forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>La toma de imágenes con fines clínicos es necesaria para la correcta prestación asistencial y no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>%s. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. RINOMODELACIÓN CON ÁCIDO HIALURÓNICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_rino, 'Rinomodelación con Ácido Hialurónico', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Rinomodelación con Ácido Hialurónico',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Perfilado no quirúrgico de la nariz ("rinoplastia líquida") mediante la inyección de ácido hialurónico en puntos estratégicos del dorso, la punta o la base nasal, con el fin de disimular irregularidades y mejorar la armonía del perfil, sin modificar la estructura ósea o cartilaginosa.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Disimular una joroba dorsal, mejorar la proyección o simetría de la punta nasal, o corregir pequeñas irregularidades del contorno, de forma reversible y sin cirugía.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica, el médico inyecta pequeñas cantidades de ácido hialurónico de alta densidad en el plano subcutáneo o supraperióstico de la nariz, con aguja fina, valorando el resultado de forma progresiva. La sesión dura entre 20 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora inmediata de la armonía y el perfil nasal</li>
  <li>Procedimiento reversible mediante hialuronidasa si el resultado no es satisfactorio</li>
  <li>Sin cirugía, anestesia general ni periodo de baja</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Inflamación y enrojecimiento leve de la zona durante 24-48 horas</li>
  <li>Pequeños hematomas en el punto de inyección</li>
  <li>Asimetría leve transitoria hasta la completa integración del producto</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Nódulos o irregularidades palpables o visibles</li>
  <li>Migración del producto</li>
  <li>Resultado insuficiente o no satisfactorio, requiriendo disolución con hialuronidasa</li>
</ul>

<h2>7. Riesgos raros o excepcionales pero graves</h2>
<ul>
  <li><strong>Oclusión vascular con necrosis cutánea</strong>: la nariz presenta una vascularización terminal de pequeño calibre especialmente vulnerable a la compresión o inyección intravascular, lo que puede provocar la pérdida de la piel de la zona afectada.</li>
  <li><strong>Embolización retrógrada de la arteria oftálmica</strong>: complicación excepcional pero descrita en la literatura médica, que puede provocar pérdida de visión total o parcial, súbita e irreversible, en el ojo afectado. Es la complicación más grave posible de los rellenos en el área nasal y glabelar, y requiere atención médica urgente inmediata (protocolo de reversión con hialuronidasa) ante cualquier síntoma visual, dolor intenso o palidez cutánea súbita durante o tras la inyección.</li>
  <li>Reacción anafiláctica al producto</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Cirugía nasal previa con alteración significativa de la vascularización local (valorar con especial precaución)</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Enfermedades autoinmunes activas o inmunosupresión severa</li>
  <li>Tratamiento con anticoagulantes</li>
  <li>Hipersensibilidad conocida a los componentes del producto</li>
  <li>Deformidad estructural que requiera corrección quirúrgica (el relleno no sustituye a la rinoplastia en estos casos)</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>Rinoplastia quirúrgica (única opción para modificar la estructura ósea/cartilaginosa o reducir el tamaño nasal), o no intervenir.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. TOXINA BOTULÍNICA PARA MIGRAÑA CRÓNICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_migrana, 'Toxina Botulínica para Migraña Crónica', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Toxina Botulínica para Migraña Crónica',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Aplicación de toxina botulínica tipo A siguiendo el protocolo estandarizado PREEMPT (31 a 39 puntos de inyección distribuidos en frente, sienes, occipucio, cuello y trapecios), indicado en pacientes con diagnóstico médico de migraña crónica (cefalea ≥15 días al mes, de los cuales al menos 8 con características migrañosas, durante más de 3 meses).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir la frecuencia e intensidad de los episodios de migraña crónica, como tratamiento preventivo complementario al abordaje médico/neurológico habitual.</p>

<h2>3. Cómo se realiza</h2>
<p>Previo diagnóstico médico confirmado de migraña crónica (idealmente por neurología), se administran múltiples inyecciones superficiales de toxina botulínica en los puntos fijos del protocolo PREEMPT. La sesión dura entre 15 y 30 minutos y se repite cada 12 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del número de días de cefalea al mes</li>
  <li>Reducción de la intensidad y duración de los episodios</li>
  <li>Mejora de la calidad de vida y disminución del consumo de medicación analgésica de rescate</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor o molestia leve en los puntos de inyección</li>
  <li>Hematomas puntuales</li>
  <li>Dolor cervical o de cuello, especialmente tras la inyección en trapecios</li>
  <li>Debilidad muscular leve en la zona frontal (dificultad para fruncir el ceño)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Ptosis palpebral (caída del párpado) transitoria</li>
  <li>Rigidez o debilidad cervical que dificulte mantener la cabeza erguida (excepcional, más descrita en la zona de trapecios)</li>
  <li>Ausencia de respuesta clínica al tratamiento (no todos los pacientes responden igual)</li>
  <li>Reacción alérgica al producto</li>
  <li>Disfagia leve (dificultad para tragar), excepcional, asociada a difusión del producto hacia musculatura cervical profunda</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Enfermedades neuromusculares (miastenia gravis, síndrome de Lambert-Eaton)</li>
  <li>Embarazo o lactancia</li>
  <li>Infección activa en las zonas de inyección</li>
  <li>Hipersensibilidad conocida a la toxina botulínica o a la albúmina humana</li>
  <li>Tratamiento concomitante con aminoglucósidos u otros fármacos que potencien el bloqueo neuromuscular (valorar con precaución)</li>
  <li>Ausencia de diagnóstico médico confirmado de migraña crónica</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar tumbarse o inclinar la cabeza durante las 4 horas siguientes, no frotar ni masajear las zonas tratadas durante 24 horas, y evitar ejercicio físico intenso el día del tratamiento. El efecto clínico completo puede tardar 2-4 semanas en apreciarse y varias sesiones en optimizarse.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento farmacológico preventivo oral (betabloqueantes, antiepilépticos, antidepresivos), anticuerpos monoclonales anti-CGRP, u otras terapias neurológicas específicas, siempre bajo seguimiento del especialista correspondiente.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. RADIOFRECUENCIA CON MICROAGUJAS (RF MICRONEEDLING)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_rfmicro, 'Radiofrecuencia con Microagujas (RF Microneedling)', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Radiofrecuencia con Microagujas',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica combinada que asocia la microperforación controlada de la piel mediante microagujas con la emisión simultánea de energía de radiofrecuencia a través de las propias agujas, generando calor controlado en la dermis profunda para estimular la producción de colágeno y elastina.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar la firmeza y textura cutánea, reducir arrugas finas y cicatrices de acné, y tratar la flacidez leve-moderada de rostro y cuerpo, con un efecto de estimulación más profundo que las microagujas o la radiofrecuencia aplicadas por separado.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica, el dispositivo aplica microagujas aisladas que penetran la piel a la profundidad programada, emitiendo radiofrecuencia fraccionada en el momento de la penetración. La sesión dura entre 30 y 60 minutos, con un protocolo habitual de 3-4 sesiones espaciadas 4-6 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la firmeza, el tono y la textura cutánea</li>
  <li>Reducción de cicatrices de acné y poro dilatado</li>
  <li>Estimulación progresiva de colágeno con resultados acumulativos en varios meses</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento e inflamación de la zona durante 24-72 horas</li>
  <li>Sensación de calor o escozor durante el tratamiento</li>
  <li>Pequeños puntos de sangrado (petequias) en el momento de la aplicación</li>
  <li>Descamación leve en los días posteriores</li>
</ul>

<h2>6. Riesgos poco frecuentes o graves</h2>
<ul>
  <li><strong>Hiperpigmentación postinflamatoria</strong>, especialmente en fototipos cutáneos altos (IV-VI) o en pacientes con exposición solar reciente</li>
  <li>Quemadura térmica por exceso de energía o mal manejo del dispositivo</li>
  <li>Infección local</li>
  <li>Cicatriz residual, excepcional con parámetros adecuados</li>
  <li>Interferencia con dispositivos electrónicos implantados (marcapasos, desfibriladores) por la emisión de radiofrecuencia</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Portadores de marcapasos, desfibrilador u otro dispositivo electrónico implantado</li>
  <li>Embarazo</li>
  <li>Infección activa, herpes activo o dermatitis en la zona a tratar</li>
  <li>Tendencia a cicatrización queloidea</li>
  <li>Tratamiento con isotretinoína oral en los últimos 6 meses</li>
  <li>Exposición solar reciente o bronceado activo en la zona</li>
  <li>Trastornos de la coagulación no controlados</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Fotoprotección estricta (SPF 50+) durante al menos 4 semanas, evitar maquillaje las primeras 24 horas, no exponerse al sol, sauna o piscina durante 48-72 horas, y aplicar los productos reparadores indicados por el equipo médico.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Microagujas convencionales sin radiofrecuencia, radiofrecuencia superficial sin microperforación, láser fraccionado, o peeling químico según el objetivo específico.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. BICHECTOMÍA (EXTRACCIÓN DE BOLSAS DE BICHAT)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_bichect, 'Bichectomía (Extracción de Bolsas de Bichat)', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Bichectomía',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Extracción quirúrgica parcial de la bola adiposa de Bichat (bolsa de grasa bucal), un cuerpo graso situado en la mejilla, mediante un pequeño abordaje por vía intraoral (dentro de la boca, sin cicatriz visible en la piel), bajo anestesia local.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Afinar el óvalo facial y marcar el contorno de los pómulos y la línea mandibular, reduciendo la redondez de las mejillas de forma permanente.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia local intraoral, el médico realiza una pequeña incisión en la mucosa yugal (interior de la mejilla) y extrae parcialmente la bola adiposa de Bichat, dejando la cantidad de grasa necesaria para mantener un contorno facial natural. La intervención dura entre 30 y 45 minutos, con sutura reabsorbible, y se realiza de forma ambulatoria.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Afinamiento permanente del óvalo facial y las mejillas</li>
  <li>Mejor definición de pómulos y línea mandibular</li>
  <li>Sin cicatriz visible en la piel (abordaje intraoral)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y hematoma facial durante 1-2 semanas</li>
  <li>Dolor y molestia al masticar y abrir la boca los primeros días</li>
  <li>Dificultad temporal para hablar o comer con normalidad</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Lesión del nervio facial (rama bucal)</strong>, que discurre en proximidad a la bola adiposa, con riesgo de asimetría en la sonrisa o debilidad muscular, habitualmente transitoria pero excepcionalmente permanente</li>
  <li><strong>Lesión del conducto de Stenon</strong> (conducto de la glándula parótida), que puede requerir manejo quirúrgico específico</li>
  <li>Infección o absceso intraoral</li>
  <li>Asimetría entre ambos lados si la extracción no es simétrica</li>
  <li><strong>Resultado irreversible de "hundimiento" o envejecimiento prematuro de las mejillas</strong>: la grasa extraída no se regenera, por lo que una extracción excesiva o el envejecimiento facial futuro (pérdida de volumen propia de la edad) pueden dar un aspecto demacrado que no se puede revertir</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Rostro delgado o bajo peso corporal (agrava el riesgo de aspecto hundido tras la intervención)</li>
  <li>Menores de 18 años (el desarrollo óseo y graso facial no ha finalizado)</li>
  <li>Infección activa oral o dental no tratada</li>
  <li>Coagulopatías no controladas</li>
  <li>Expectativas no realistas sobre el resultado</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Dieta blanda o líquida los primeros días, enjuagues con colutorio antiséptico indicado, evitar abrir mucho la boca o hacer gestos bruscos, aplicar frío externo los primeros días, y acudir a la revisión de control.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamientos no quirúrgicos de contorno facial (lipólisis inyectable, radiofrecuencia), que ofrecen resultados más sutiles y reversibles, o no intervenir.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. TRATAMIENTO DE MANCHAS / MELASMA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_manchas, 'Tratamiento de Manchas / Melasma', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tratamiento de Manchas / Melasma',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Abordaje combinado de la hiperpigmentación cutánea (léntigos solares, melasma u otras manchas) mediante la combinación individualizada de peeling químico despigmentante, láser/IPL específico para pigmento, y activos tópicos despigmentantes de uso domiciliario (ácido tranexámico, ácido azelaico, niacinamida, hidroquinona u otros según el caso).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir la intensidad y extensión de las manchas cutáneas y homogeneizar el tono de la piel, informando de que el melasma es una condición crónica y recidivante que puede requerir tratamiento de mantenimiento continuado.</p>

<h2>3. Cómo se realiza</h2>
<p>Tras el diagnóstico diferencial del tipo de hiperpigmentación (fundamental para elegir la técnica adecuada, ya que el melasma responde de forma distinta a los léntigos solares), se aplica el protocolo combinado indicado, en varias sesiones espaciadas 2-4 semanas, junto con la pauta de activos domiciliarios y fotoprotección estricta.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aclaramiento y homogeneización del tono cutáneo</li>
  <li>Reducción de la visibilidad de las manchas tratadas</li>
  <li>Mejora de la textura y luminosidad general de la piel</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento, descamación o sensación de tirantez tras el peeling o el láser</li>
  <li>Oscurecimiento transitorio de la mancha antes de su aclaramiento (frecuente y esperado con determinadas técnicas)</li>
  <li>Sequedad cutánea asociada al uso de activos despigmentantes</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Hiperpigmentación postinflamatoria</strong>: paradójicamente, un tratamiento agresivo o mal indicado puede oscurecer más la zona tratada, especialmente en fototipos cutáneos altos (IV-VI) o en el melasma, que es particularmente sensible a la inflamación</li>
  <li><strong>Efecto rebote del melasma</strong>: es una condición hormono-dependiente (embarazo, anticonceptivos) con alta tasa de recidiva, incluso con tratamiento correcto y buena respuesta inicial</li>
  <li>Hipopigmentación (manchas blancas) en casos de tratamiento excesivo</li>
  <li>Irritación o dermatitis de contacto por los activos tópicos</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo y lactancia (contraindican determinados activos como la hidroquinona y algunos retinoides, y el propio melasma gestacional se trata de forma más conservadora)</li>
  <li>Exposición solar activa o bronceado reciente en la zona</li>
  <li>Tratamiento con isotretinoína oral en los últimos 6 meses</li>
  <li>Herpes activo (contraindica determinados procedimientos hasta su resolución)</li>
  <li>Dermatitis activa en la zona a tratar</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Fotoprotección estricta y diaria (SPF 50+, reaplicación cada 2-3 horas) de por vida en la zona tratada, ya que la exposición solar es la principal causa de recidiva; uso constante de los activos domiciliarios pautados; y evitar la exposición solar intensa, cabinas de rayos UVA y saunas durante el tratamiento activo.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento exclusivamente tópico domiciliario sin procedimientos en clínica (resultado más lento y limitado), o camuflaje cosmético (maquillaje corrector) sin tratamiento activo de la pigmentación.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. TRATAMIENTO DE CICATRICES Y ESTRÍAS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_cicatriz, 'Tratamiento de Cicatrices y Estrías', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tratamiento de Cicatrices y Estrías',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento combinado de cicatrices (de acné, quirúrgicas o postraumáticas) y estrías cutáneas mediante láser fraccionado (CO2 o no ablativo), microagujas o radiofrecuencia con microagujas, según el tipo, la profundidad y la antigüedad de la lesión a tratar.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar el aspecto, la textura y la coloración de las cicatrices y estrías, disminuyendo su visibilidad, informando de que no es posible su eliminación completa en la mayoría de los casos.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica, se aplica la técnica seleccionada sobre la zona a tratar, ajustando los parámetros según la profundidad y el tipo de lesión (cicatriz atrófica, hipertrófica, o estría reciente/antigua). Se requieren habitualmente entre 3 y 6 sesiones espaciadas 4-6 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la textura, profundidad y coloración de la cicatriz o estría tratada</li>
  <li>Estimulación de colágeno con mejora progresiva y acumulativa</li>
  <li>Mejora de la calidad general de la piel circundante</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento e inflamación de la zona durante varios días</li>
  <li>Sensación de calor, escozor o tirantez</li>
  <li>Descamación o costras superficiales en técnicas más agresivas (láser ablativo)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Hiperpigmentación postinflamatoria, especialmente en fototipos cutáneos altos</li>
  <li>Hipopigmentación de la zona tratada</li>
  <li>Infección local</li>
  <li>Empeoramiento paradójico de la cicatriz en pacientes con predisposición a la cicatrización queloidea</li>
  <li>Resultado parcial o insuficiente respecto a las expectativas: <strong>ninguna técnica elimina por completo una cicatriz o estría establecida</strong>, solo mejora su aspecto</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Tendencia personal o familiar a la cicatrización queloidea (valorar con especial precaución, técnica y parámetros conservadores)</li>
  <li>Infección activa o herpes activo en la zona</li>
  <li>Tratamiento con isotretinoína oral en los últimos 6 meses</li>
  <li>Exposición solar reciente o bronceado activo en la zona</li>
  <li>Embarazo (según la técnica específica empleada)</li>
  <li>Cicatriz de menos de 6-12 meses de evolución (se recomienda esperar a la maduración completa antes de tratar, salvo indicación específica)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Fotoprotección estricta (SPF 50+) durante varias semanas, evitar exposición solar directa, aplicar los productos reparadores/cicatrizantes indicados, y evitar rascar o manipular las costras si las hubiera.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento tópico domiciliario con activos regeneradores (menor eficacia en cicatrices establecidas), cirugía revisora en cicatrices muy retráctiles o antiestéticas, o no intervenir.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
