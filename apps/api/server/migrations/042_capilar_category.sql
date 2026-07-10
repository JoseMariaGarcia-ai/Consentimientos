-- Nueva categoría: Clínica Capilar / Tricología — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Clínica Capilar (procedimientos médicos, mismo marco legal que
-- Medicina Estética y Odontología — el/la especialista es médico/a).

-- Amplía las categorías permitidas para incluir 'capilar'.
ALTER TABLE consent_templates DROP CONSTRAINT consent_templates_category_check;
ALTER TABLE consent_templates ADD CONSTRAINT consent_templates_category_check
  CHECK (category IN (
    'medicina_estetica',
    'odontologia',
    'veterinaria',
    'centro_estetico',
    'salon_belleza',
    'tatuajes',
    'fisioterapia',
    'capilar'
  ));

ALTER TABLE consent_templates DROP CONSTRAINT consent_templates_extra_categories_check;
ALTER TABLE consent_templates ADD CONSTRAINT consent_templates_extra_categories_check
  CHECK (extra_categories <@ ARRAY[
    'medicina_estetica',
    'odontologia',
    'veterinaria',
    'centro_estetico',
    'salon_belleza',
    'tatuajes',
    'fisioterapia',
    'capilar'
  ]::TEXT[]);

DO $$
DECLARE
  v_fue     UUID := '10000004-0000-0000-0000-000000000001';
  v_fut     UUID := '10000004-0000-0000-0000-000000000002';
  v_meso    UUID := '10000004-0000-0000-0000-000000000003';
  v_prp     UUID := '10000004-0000-0000-0000-000000000004';
  v_smp     UUID := '10000004-0000-0000-0000-000000000005';
  v_lllt    UUID := '10000004-0000-0000-0000-000000000006';
  v_farmaco UUID := '10000004-0000-0000-0000-000000000007';
  v_carboxi UUID := '10000004-0000-0000-0000-000000000008';
  v_exosom  UUID := '10000004-0000-0000-0000-000000000009';
  v_legal   JSONB;
  v_img     TEXT;
BEGIN

  v_legal := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 18,
      "witnessRequired": false,
      "retentionYears": 5,
      "introText": "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre el tratamiento propuesto antes de decidir si desea o no someterse al mismo.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del tratamiento, sin que ello suponga perjuicio alguno en la atención que se le preste.",
      "dataClause": "Sus datos personales y de salud serán tratados por esta clínica con la finalidad exclusiva de gestionar su historia clínica, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>10. Sesión de imágenes (fotografías del cuero cabelludo)</h2>
<p>Como parte del diagnóstico y seguimiento de este tratamiento, el equipo médico realizará fotografías del cuero cabelludo antes, durante y después del procedimiento, con el fin de documentar el estado previo y valorar objetivamente la evolución y el resultado. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>La toma de imágenes con fines clínicos es necesaria para la correcta prestación asistencial y no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al equipo médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. TRASPLANTE CAPILAR FUE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_fue, 'Trasplante Capilar FUE (Unidades Foliculares)', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Trasplante Capilar FUE',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica quirúrgica de restauración capilar que consiste en la extracción individual de unidades foliculares (FUE, Follicular Unit Extraction) de una zona donante (habitualmente occipital, resistente a la caída) y su posterior implantación en la zona receptora con alopecia.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la densidad capilar en zonas de alopecia androgénica u otras causas de pérdida de cabello, mediante la redistribución de folículos genéticamente resistentes a la miniaturización.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local en zona donante y receptora, el equipo médico extrae los folículos uno a uno con micropunch, los conserva en solución específica, y los implanta manualmente en la zona receptora siguiendo el ángulo y dirección natural del cabello. El procedimiento dura entre 4 y 8 horas según el número de injertos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Restauración permanente de la densidad capilar en la zona tratada</li>
  <li>Resultado de aspecto natural al respetar la dirección y agrupación folicular original</li>
  <li>Cicatrices puntiformes prácticamente imperceptibles en la zona donante</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y enrojecimiento del cuero cabelludo durante varios días</li>
  <li>Costras puntiformes en la zona receptora (7-10 días)</li>
  <li>Dolor o molestia leve-moderada postoperatoria</li>
  <li><strong>Efluvio telógeno</strong>: caída temporal del cabello trasplantado (y a veces del cabello preexistente circundante) entre las semanas 2 y 8, con recrecimiento posterior — es un efecto esperado del proceso, no un fracaso del injerto</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Foliculitis o infección de los injertos</li>
  <li>Necrosis parcial de la zona receptora (muy infrecuente)</li>
  <li>Baja tasa de supervivencia de los injertos por manipulación o técnica (variable según la clínica y el caso)</li>
  <li>Cicatrización hipertrófica o queloide en la zona donante (infrecuente)</li>
  <li>Efluvio telógeno persistente más allá de lo esperado</li>
  <li>Aspecto no completamente natural si la densidad/dirección no se planifica correctamente</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alopecia difusa sin zona donante estable</li>
  <li>Enfermedades del cuero cabelludo activas (psoriasis, dermatitis seborreica severa no controlada)</li>
  <li>Coagulopatías no controladas</li>
  <li>Expectativas no realistas sobre el resultado</li>
  <li>Alopecia areata activa (valorar con el/la médico/a)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No tocar ni rascar la zona receptora durante los primeros días, lavado del cabello según protocolo específico indicado (habitualmente a partir del día 3-5), evitar exposición solar directa y actividad física intensa durante 2-3 semanas, y no consumir alcohol ni tabaco en los días previos y posteriores para favorecer la cicatrización.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Trasplante FUSS/FUT (técnica de tira), tratamiento farmacológico de la alopecia (minoxidil/finasteride), PRP o mesoterapia capilar como tratamiento no quirúrgico, o micropigmentación capilar como alternativa no invasiva.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. TRASPLANTE CAPILAR FUSS/FUT
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_fut, 'Trasplante Capilar FUSS/FUT (Técnica de Tira)', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Trasplante Capilar FUSS/FUT',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica quirúrgica de restauración capilar que consiste en la extracción de una tira de cuero cabelludo de la zona donante occipital, su disección en unidades foliculares bajo microscopio, y la posterior implantación en la zona receptora con alopecia.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la densidad capilar obteniendo un elevado número de injertos en una sola sesión, especialmente indicado en casos que requieren gran cantidad de unidades foliculares.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el equipo médico extrae quirúrgicamente una tira de cuero cabelludo de la zona donante y sutura el área (cierre lineal), mientras un equipo técnico diseca la tira en unidades foliculares individuales bajo microscopio para su implantación en la zona receptora. El procedimiento dura entre 4 y 8 horas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Obtención de un número elevado de injertos de alta calidad en una única sesión</li>
  <li>Menor tiempo de extracción comparado con FUE para grandes volúmenes</li>
  <li>Resultado de aspecto natural en la zona receptora</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor y tensión en la zona donante durante la primera semana</li>
  <li>Inflamación del cuero cabelludo</li>
  <li><strong>Cicatriz lineal</strong> en la zona donante (visible especialmente con el cabello muy corto)</li>
  <li>Efluvio telógeno (caída temporal) del cabello trasplantado entre las semanas 2 y 8</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Cicatriz hipertrófica o ensanchada en la zona donante</li>
  <li>Alteración de la sensibilidad (adormecimiento) en la zona donante, habitualmente transitoria</li>
  <li>Infección de la herida quirúrgica</li>
  <li>Dehiscencia (apertura) de la sutura</li>
  <li>Baja supervivencia de los injertos por técnica o manipulación</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Cuero cabelludo poco elástico que dificulte el cierre sin tensión</li>
  <li>Alopecia difusa sin zona donante estable</li>
  <li>Coagulopatías no controladas</li>
  <li>Preferencia por llevar el cabello muy corto (la cicatriz sería más visible que con FUE)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Reposo relativo la primera semana, no realizar esfuerzos físicos intensos durante 2-3 semanas, cuidado de la sutura según protocolo, retirada de puntos a los 10-14 días si no son reabsorbibles, y evitar exposición solar directa en la zona donante.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Trasplante FUE (sin cicatriz lineal, aunque con mayor tiempo de extracción para grandes volúmenes), tratamiento farmacológico de la alopecia, o PRP/mesoterapia capilar.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. MESOTERAPIA CAPILAR
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_meso, 'Mesoterapia Capilar', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Mesoterapia Capilar',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica médica que consiste en microinyecciones intradérmicas de una mezcla de principios activos (vitaminas, aminoácidos, minerales, péptidos u otros) directamente en el cuero cabelludo, con el fin de mejorar la salud del folículo piloso.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Fortalecer el cabello, frenar la caída (efluvio telógeno o alopecia incipiente) y mejorar la calidad y densidad capilar, como tratamiento único o complementario a otras terapias capilares.</p>

<h2>3. Cómo se realiza</h2>
<p>El equipo médico administra las microinyecciones con aguja ultrafina en el cuero cabelludo, de forma manual o con mesogun, a una profundidad controlada. La sesión dura entre 20 y 30 minutos, y se requiere habitualmente un protocolo de 4 a 6 sesiones iniciales.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción de la caída del cabello</li>
  <li>Mejora del grosor y la calidad del cabello existente</li>
  <li>Estimulación de la microcirculación del cuero cabelludo</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor o molestia durante la aplicación</li>
  <li>Eritema y pequeñas pápulas en los puntos de inyección (horas)</li>
  <li>Prurito transitorio</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Infección local o foliculitis</li>
  <li>Reacción alérgica a alguno de los componentes de la mezcla</li>
  <li>Hematomas en el cuero cabelludo</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Alergia conocida a alguno de los principios activos</li>
  <li>Infección o dermatosis activa del cuero cabelludo</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar lavar el cabello en las 6-12 horas siguientes, no exponerse al sol directo el mismo día, y evitar productos capilares agresivos durante 24 horas.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>PRP capilar, tratamiento farmacológico de la alopecia, láser de baja intensidad (LLLT), o exosomas capilares.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. PRP CAPILAR
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_prp, 'PRP Capilar (Plasma Rico en Plaquetas)', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — PRP Capilar',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El plasma rico en plaquetas (PRP) capilar consiste en la extracción de una muestra de sangre autóloga del propio paciente, su centrifugación para concentrar las plaquetas y los factores de crecimiento, y su posterior inyección en el cuero cabelludo.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Estimular los folículos pilosos mediante los factores de crecimiento plaquetarios, favoreciendo el engrosamiento del cabello y frenando la progresión de la alopecia androgénica.</p>

<h2>3. Cómo se realiza</h2>
<p>Se extrae una muestra de sangre venosa del paciente, que se centrifuga para obtener el plasma rico en plaquetas, el cual se inyecta con aguja fina en el cuero cabelludo, en la zona afectada. La sesión dura entre 45 y 60 minutos, y se recomienda un protocolo inicial de 3-4 sesiones separadas por 4-6 semanas, con mantenimiento posterior.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Producto 100% autólogo (de la propia sangre del paciente), sin riesgo de rechazo o transmisión de enfermedades de terceros</li>
  <li>Mejora de la densidad y grosor del cabello existente</li>
  <li>Reducción de la velocidad de progresión de la alopecia</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor durante la extracción sanguínea y las microinyecciones</li>
  <li>Eritema, edema y pequeños hematomas en el cuero cabelludo</li>
  <li>Cefalea leve tras la sesión</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Infección local en el punto de inyección o extracción</li>
  <li>Mareo o síncope vasovagal durante la extracción sanguínea</li>
  <li>Respuesta clínica insuficiente (variable según el grado de alopecia y la causa subyacente)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alteraciones de la coagulación o trombocitopenia</li>
  <li>Infección activa o enfermedad de la piel en el cuero cabelludo</li>
  <li>Enfermedades hematológicas o neoplásicas activas</li>
  <li>Embarazo o lactancia</li>
  <li>Tratamiento con anticoagulantes (valorar)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar lavar el cabello en las primeras 6-12 horas, no aplicar productos capilares agresivos ni exponerse al sol directo el mismo día, y evitar actividad física intensa durante 24 horas.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Mesoterapia capilar, exosomas capilares, tratamiento farmacológico de la alopecia, o trasplante capilar en casos de alopecia ya establecida.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. MICROPIGMENTACIÓN CAPILAR (SMP)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_smp, 'Micropigmentación Capilar (Simulación de Folículos - SMP)', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Micropigmentación Capilar (SMP)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La micropigmentación capilar (SMP, Scalp Micropigmentation) es una técnica que implanta microdepósitos de pigmento en la dermis superficial del cuero cabelludo, simulando la apariencia de folículos pilosos recién rasurados, para camuflar zonas de alopecia o dar densidad visual.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Camuflar zonas de calvicie o baja densidad capilar, disimular cicatrices de trasplantes previos, o crear el efecto visual de una cabeza rapada con densidad uniforme.</p>

<h2>3. Cómo se realiza</h2>
<p>El equipo médico o técnico especializado implanta el pigmento con dermógrafo y microagujas estériles de un solo uso, replicando el patrón, tamaño y dirección de un folículo natural. El tratamiento completo requiere entre 2 y 4 sesiones separadas por 1-2 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resultado inmediato de mayor densidad visual capilar</li>
  <li>Técnica no invasiva ni quirúrgica</li>
  <li>Camuflaje eficaz de cicatrices de trasplante previo</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Enrojecimiento y sensibilidad del cuero cabelludo durante varios días</li>
  <li>Descamación superficial durante el proceso de cicatrización</li>
  <li>Color más intenso los primeros días, que se aclara tras la cicatrización</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Migración o difuminado del pigmento con el tiempo</li>
  <li>Cambio de tonalidad del pigmento (viraje a tonos azulados/verdosos) a largo plazo</li>
  <li>Infección local por cuidados postoperatorios inadecuados</li>
  <li>Reacción alérgica al pigmento</li>
  <li>Resultado no uniforme si el cabello circundante cambia de color/densidad (canas, mayor pérdida capilar)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alergia conocida a pigmentos o tintas</li>
  <li>Enfermedades activas del cuero cabelludo (psoriasis, dermatitis en la zona)</li>
  <li>Queloides o cicatrización hipertrófica previa</li>
  <li>Diabetes descompensada</li>
  <li>Alopecia en progresión activa sin estabilizar (valorar tratamiento previo de la caída)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No mojar la zona ni exponerla al sol durante 4-5 días, aplicar la crema cicatrizante indicada, evitar el sudor excesivo (deporte intenso, sauna) durante la primera semana, y no rasurar la zona hasta autorización.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Trasplante capilar (si se busca cabello real, no un efecto visual de densidad rapada), o tratamiento farmacológico/PRP para frenar la progresión de la alopecia.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. TERAPIA CON LÁSER DE BAJA INTENSIDAD (LLLT)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_lllt, 'Terapia con Láser de Baja Intensidad (LLLT)', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Terapia con Láser de Baja Intensidad (LLLT)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La terapia con láser de baja intensidad (LLLT, Low-Level Laser Therapy) emplea luz láser de baja potencia para estimular fotobiológicamente el folículo piloso, sin generar calor significativo ni dañar el tejido.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Estimular el metabolismo celular del folículo piloso, favoreciendo la fase de crecimiento del cabello y frenando la miniaturización folicular propia de la alopecia androgénica, como tratamiento único o complementario.</p>

<h2>3. Cómo se realiza</h2>
<p>El paciente se coloca un casco o peine láser durante sesiones de 15 a 25 minutos, con una periodicidad recomendada de 2-3 veces por semana durante al menos 4-6 meses para valorar resultados.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Tratamiento indoloro y no invasivo</li>
  <li>Mejora progresiva del grosor y densidad capilar en respondedores</li>
  <li>Sin efectos secundarios sistémicos (a diferencia de los tratamientos farmacológicos)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensación de calor leve durante la sesión</li>
  <li>Sequedad leve del cuero cabelludo</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Respuesta clínica variable o insuficiente (no todos los pacientes responden igual)</li>
  <li>Molestia ocular si no se usa correctamente la protección visual en dispositivos tipo casco</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Epilepsia fotosensible</li>
  <li>Cáncer de piel activo en el cuero cabelludo</li>
  <li>Tratamiento fotosensibilizante concomitante</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; se recomienda constancia en la frecuencia de las sesiones para valorar correctamente la respuesta al tratamiento.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento farmacológico de la alopecia, mesoterapia o PRP capilar, o combinación de varias terapias según el criterio médico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 7. TRATAMIENTO FARMACOLÓGICO DE LA ALOPECIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_farmaco, 'Tratamiento Farmacológico de la Alopecia', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tratamiento Farmacológico de la Alopecia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Prescripción y seguimiento médico de tratamiento farmacológico para la alopecia androgénica, habitualmente minoxidil tópico y/o finasteride o dutasteride oral, tras valoración clínica y diagnóstico del tipo y grado de alopecia.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Frenar la progresión de la caída del cabello y, en muchos casos, favorecer una mejora parcial de la densidad capilar mediante tratamiento médico continuado.</p>

<h2>3. Cómo se realiza</h2>
<p>Tras el diagnóstico (incluyendo, si procede, analítica hormonal/tricoscopia), el/la médico/a prescribe la pauta farmacológica adecuada (tópica y/u oral) y realiza revisiones periódicas para valorar la respuesta y ajustar el tratamiento. El tratamiento es de uso continuado; su interrupción revierte progresivamente el beneficio obtenido.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Frenado de la progresión de la caída en la mayoría de los pacientes</li>
  <li>Mejora parcial de la densidad capilar en un porcentaje relevante de casos</li>
  <li>Tratamiento no invasivo y de larga trayectoria de uso clínico</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Irritación local del cuero cabelludo (minoxidil tópico)</li>
  <li>Aumento transitorio de la caída al iniciar el tratamiento ("shedding" inicial, efecto esperado en las primeras 4-8 semanas)</li>
  <li>Hipertricosis (crecimiento de vello) en zonas de contacto accidental con minoxidil tópico</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Disfunción sexual</strong> (disminución de la libido, disfunción eréctil) asociada al uso de finasteride/dutasteride oral, generalmente reversible al suspender el tratamiento, aunque se han descrito casos de persistencia tras la suspensión (síndrome post-finasteride, de baja incidencia pero descrito en la literatura)</li>
  <li>Alteración del estado de ánimo (raramente descrito con inhibidores de 5-alfa-reductasa)</li>
  <li>Taquicardia o mareo con minoxidil oral (formulación distinta a la tópica)</li>
  <li>Ginecomastia (infrecuente, con finasteride/dutasteride)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo, lactancia, o mujeres en edad fértil sin anticoncepción adecuada (finasteride/dutasteride: teratogénico, contraindicado su manejo/contacto)</li>
  <li>Hepatopatía severa</li>
  <li>Hipersensibilidad conocida a los principios activos</li>
  <li>Antecedente de cáncer de mama (dutasteride/finasteride, valorar)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Cumplimiento estricto de la pauta prescrita (la eficacia depende del uso continuado), acudir a las revisiones periódicas programadas, y comunicar de inmediato cualquier efecto adverso al equipo médico.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>PRP o mesoterapia capilar, láser de baja intensidad (LLLT), trasplante capilar (en alopecia ya establecida), o no tratar (con progresión previsible de la alopecia).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 8. CARBOXITERAPIA CAPILAR
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_carboxi, 'Carboxiterapia Capilar', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Carboxiterapia Capilar',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica médica que consiste en la microinyección subcutánea de dióxido de carbono (CO₂) medicinal en el cuero cabelludo, con el objetivo de mejorar la oxigenación y microcirculación local mediante el efecto Bohr.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar la vascularización y oxigenación del folículo piloso, como tratamiento complementario en el manejo de la alopecia, especialmente en combinación con otras terapias capilares.</p>

<h2>3. Cómo se realiza</h2>
<p>El equipo médico administra el CO₂ medicinal mediante microinyecciones subcutáneas con aguja muy fina en el cuero cabelludo, con un equipo específico que regula el flujo y la presión del gas. La sesión dura entre 20 y 30 minutos, con un protocolo habitual de 6 a 10 sesiones.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la microcirculación y oxigenación del cuero cabelludo</li>
  <li>Efecto complementario a otros tratamientos capilares (mesoterapia, PRP)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensación de crepitación subcutánea (por el gas) durante y tras la sesión, transitoria</li>
  <li>Molestia o escozor durante la aplicación</li>
  <li>Enrojecimiento local transitorio</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Hematomas en los puntos de inyección</li>
  <li>Infección local (excepcional con técnica aséptica correcta)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Enfermedad cardiovascular o respiratoria severa</li>
  <li>Embarazo</li>
  <li>Infección activa o dermatosis en el cuero cabelludo</li>
  <li>Trastornos de la coagulación</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; se recomienda evitar el lavado agresivo del cabello el mismo día de la sesión.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Mesoterapia capilar, PRP capilar, o láser de baja intensidad (LLLT).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 9. EXOSOMAS CAPILARES
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_exosom, 'Exosomas Capilares', 'capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Exosomas Capilares',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Tratamiento médico regenerativo de última generación que emplea exosomas (vesículas extracelulares ricas en factores de crecimiento, proteínas y ARN mensajero, de origen no celular) inyectados en el cuero cabelludo para estimular la actividad folicular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Estimular la regeneración y actividad del folículo piloso mediante señalización celular avanzada, como alternativa o complemento al PRP, especialmente en pacientes con respuesta insuficiente a otras terapias.</p>

<h2>3. Cómo se realiza</h2>
<p>El equipo médico administra los exosomas mediante microinyecciones en el cuero cabelludo, con o sin técnicas complementarias de microneedling para favorecer la penetración. La sesión dura entre 30 y 45 minutos, con un protocolo habitual de 3-4 sesiones separadas por 4 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Estimulación regenerativa avanzada del folículo piloso</li>
  <li>Producto no celular, con menor riesgo inmunológico que otras terapias celulares</li>
  <li>Complemento eficaz en pacientes con respuesta parcial a otros tratamientos</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Eritema, edema y molestia en el cuero cabelludo tras la sesión</li>
  <li>Dolor durante la aplicación</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Reacción alérgica o de hipersensibilidad al producto</li>
  <li>Infección local</li>
  <li>Respuesta clínica variable, al tratarse de una técnica relativamente reciente con menor volumen de evidencia científica a largo plazo que otras terapias más establecidas (PRP, minoxidil)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedad oncológica activa</li>
  <li>Infección o dermatosis activa del cuero cabelludo</li>
  <li>Alergia conocida a alguno de los componentes del producto</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar lavar el cabello en las primeras 6-12 horas, no exponerse al sol directo el mismo día, y evitar productos capilares agresivos durante 24-48 horas.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>PRP capilar (tratamiento autólogo más establecido), mesoterapia capilar, tratamiento farmacológico de la alopecia, o trasplante capilar en alopecia ya establecida.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
