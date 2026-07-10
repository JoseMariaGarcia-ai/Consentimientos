-- Consentimientos informados de Tatuajes y Perforaciones — Legalidad española
-- Conforme a: normativa autonómica reguladora de las prácticas de tatuaje,
-- micropigmentación y perforación cutánea · RD Legislativo 1/2007
-- (consumidores) · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Tatuajes
--
-- Al igual que Centro Estético, esta actividad no es ejercicio sanitario
-- (el/la tatuador/a no es personal médico), por lo que no aplica la Ley
-- 41/2002. Se exige mayoría de edad sin excepción por tratarse de una
-- intervención permanente sobre la piel, análoga a la micropigmentación.

DO $$
DECLARE
  v_tattoo   UUID := '10000007-0000-0000-0000-000000000001';
  v_piercing UUID := '10000007-0000-0000-0000-000000000002';
  v_retoque  UUID := '10000007-0000-0000-0000-000000000003';
  v_coverup  UUID := '10000007-0000-0000-0000-000000000004';
  v_riesgo   UUID := '10000007-0000-0000-0000-000000000005';
  v_especial UUID := '10000007-0000-0000-0000-000000000006';
  v_laser    UUID := '10000007-0000-0000-0000-000000000007';
  v_legal    JSONB;
  v_img      TEXT;
BEGIN

  v_legal := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Normativa autonómica reguladora de las prácticas de tatuaje, micropigmentación y perforación cutánea, y Real Decreto Legislativo 1/2007 (Ley General para la Defensa de los Consumidores y Usuarios)",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 18,
      "witnessRequired": false,
      "retentionYears": 5,
      "introText": "De conformidad con la normativa de protección de los consumidores y usuarios y la normativa autonómica de prácticas de tatuaje y perforación, tiene derecho a recibir información completa, comprensible y veraz sobre el procedimiento propuesto antes de decidir si desea o no someterse al mismo.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del procedimiento, sin que ello suponga penalización alguna más allá de los costes ya incurridos (materiales preparados, tiempo reservado).",
      "dataClause": "Sus datos personales serán tratados por este estudio con la finalidad exclusiva de gestionar su ficha de cliente y prestarle el servicio solicitado, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al estudio.",
      "footerLegal": "Consentimiento informado firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014. El/la firmante declara ser mayor de edad y aporta documento identificativo válido."
    }
  }'::JSONB;

  v_img := '<h2>10. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento del proceso de cicatrización, el estudio podrá realizar fotografías y/o vídeos de la zona trabajada antes, durante y después del procedimiento, con el fin de documentar el resultado y valorar la evolución de la cicatrización. Estas imágenes forman parte de su ficha de cliente y se tratan con la misma confidencialidad que el resto de sus datos, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>El uso de estas imágenes con cualquier finalidad distinta al seguimiento del proceso (formativa, publicitaria o de difusión, incluido el porfolio del/de la profesional) requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso al servicio que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de imágenes de mi trabajo con fines <strong>formativos</strong> (cursos, demostraciones internas).</li>
  <li>☐ Autorizo el uso de imágenes de mi trabajo con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, porfolio del estudio o del/de la profesional), pudiendo mostrarse mi rostro si la zona lo incluye.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito al estudio, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara ser mayor de edad, haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo su naturaleza permanente o semipermanente y que puede revocar este consentimiento en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. TATUAJE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_tattoo, 'Tatuaje', 'tatuajes', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tatuaje',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El tatuaje es una técnica que implanta pigmento de forma permanente en la dermis mediante una máquina con agujas estériles de un solo uso, siguiendo el diseño acordado previamente con el cliente.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Realizar un diseño decorativo permanente sobre la piel, según el boceto, tamaño, ubicación y estilo acordados con el cliente antes de comenzar.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la tatuador/a prepara la piel (rasurado y desinfección de la zona), traslada la plantilla del diseño, y realiza el tatuaje con máquina y agujas estériles de un solo uso, en una o varias sesiones según la extensión y complejidad del trabajo.</p>

<h2>4. Resultado esperado</h2>
<ul>
  <li>Diseño permanente sobre la piel según lo acordado</li>
  <li>El color y la nitidez definitivos se aprecian tras la cicatrización completa (4-6 semanas)</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor durante la sesión, variable según la zona y la sensibilidad individual</li>
  <li>Enrojecimiento, inflamación y sensibilidad en las horas y días posteriores</li>
  <li>Formación de costras superficiales durante el proceso de cicatrización (7-15 días)</li>
  <li>Picor durante la cicatrización</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Infección local por cuidados postoperatorios inadecuados</li>
  <li>Reacción alérgica al pigmento (más frecuente con tonos rojos)</li>
  <li>Cicatrización hipertrófica o queloide, especialmente en personas con predisposición</li>
  <li>Pérdida de nitidez, color desigual o "sangrado" del pigmento a largo plazo</li>
  <li>Fotosensibilización de la zona tatuada</li>
  <li>Granulomas o reacciones inflamatorias tardías (infrecuente)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción</li>
  <li>Embarazo o lactancia</li>
  <li>Hemofilia, diabetes descompensada o enfermedades autoinmunes activas</li>
  <li>Tratamiento con anticoagulantes</li>
  <li>Infección o lesión cutánea activa en la zona</li>
  <li>Alergia conocida a pigmentos o tintas</li>
  <li>Consumo de alcohol o drogas antes de la sesión</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener la cura protectora indicada por el estudio durante las primeras horas, lavar la zona con agua y jabón neutro sin frotar, aplicar la crema cicatrizante recomendada, no exponer al sol ni a piscina/mar hasta la cicatrización completa, y no rascar ni despegar las costras.</p>

<h2>9. Alternativas</h2>
<p>Tatuaje temporal (henna u otros productos no permanentes) si no se desea un resultado definitivo, o reducir el tamaño/complejidad del diseño para minimizar el tiempo de sesión y molestia.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. PIERCING / PERFORACIÓN CORPORAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_piercing, 'Piercing / Perforación Corporal', 'tatuajes', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Piercing / Perforación Corporal',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Perforación de una zona corporal mediante aguja hueca estéril de un solo uso, para la colocación de una joya de material biocompatible (titanio implantable, oro de 14-18 quilates u otro material apto).</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Colocar una joya decorativa en la zona corporal acordada con el cliente (oreja, nariz, ceja, ombligo, labio, u otra zona no clasificada como especial).</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional desinfecta la zona, marca el punto de perforación, y realiza la perforación con aguja hueca estéril de un solo uso, colocando inmediatamente la joya elegida. El procedimiento dura pocos minutos.</p>

<h2>4. Resultado esperado</h2>
<ul>
  <li>Perforación cicatrizada con la joya colocada, según el tiempo de cicatrización propio de cada zona (semanas a varios meses)</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor durante la perforación</li>
  <li>Inflamación, enrojecimiento y sensibilidad en los días posteriores</li>
  <li>Secreción serosa (líquido claro) durante la cicatrización, normal en el proceso</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Infección local, especialmente si no se siguen los cuidados indicados</li>
  <li>Rechazo o migración de la joya (más frecuente en piercings de superficie)</li>
  <li>Formación de queloide o cicatriz hipertrófica</li>
  <li>Desgarro del tejido si se engancha la joya accidentalmente</li>
  <li>Reacción alérgica al material de la joya (infrecuente con materiales biocompatibles certificados)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción (salvo perforación auricular en lóbulo con autorización expresa de tutor legal, según normativa autonómica y política del estudio)</li>
  <li>Embarazo o lactancia (según la zona)</li>
  <li>Hemofilia, diabetes descompensada o enfermedades autoinmunes activas</li>
  <li>Tratamiento con anticoagulantes</li>
  <li>Infección o lesión cutánea activa en la zona</li>
  <li>Alergia conocida al material de la joya</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Limpiar la zona con suero fisiológico o el producto indicado 1-2 veces al día, no tocar la joya con las manos sucias, evitar piscina/mar hasta la cicatrización completa, y no retirar la joya durante el periodo de cicatrización aunque parezca curado.</p>

<h2>9. Alternativas</h2>
<p>Joyería no perforante (clips, imanes) si no se desea una perforación permanente, o elegir una zona de menor riesgo/tiempo de cicatrización.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. RETOQUE DE TATUAJE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_retoque, 'Retoque de Tatuaje', 'tatuajes', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Retoque de Tatuaje',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Repaso de línea y/o color sobre un tatuaje ya cicatrizado (propio o realizado por otro estudio), con el fin de corregir zonas donde el pigmento se ha perdido, desvanecido o presenta irregularidades.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Mejorar la nitidez, el color o la uniformidad de un tatuaje existente, restaurando su aspecto original o mejorándolo según lo acordado con el cliente.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la tatuador/a valora el estado del tatuaje existente y repasa las zonas necesarias con máquina y agujas estériles de un solo uso, de forma similar a un tatuaje nuevo pero de menor extensión. La sesión suele ser más breve que la sesión original.</p>

<h2>4. Resultado esperado</h2>
<ul>
  <li>Mejora de la nitidez y uniformidad del tatuaje existente</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor y sensibilidad similar al tatuaje original en la zona retocada</li>
  <li>Enrojecimiento e inflamación transitorios</li>
  <li>Nuevo proceso de cicatrización en la zona retocada (7-15 días)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Infección local si no se siguen los cuidados postoperatorios</li>
  <li>Diferencia de tono entre el pigmento nuevo y el envejecido del resto del tatuaje, especialmente notable si ha pasado mucho tiempo desde el original</li>
  <li>Reacción alérgica al pigmento</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción</li>
  <li>Embarazo o lactancia</li>
  <li>Piel de la zona con cicatrización incompleta, irritación o infección activa</li>
  <li>Alergia conocida a pigmentos o tintas</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mismos cuidados que un tatuaje nuevo: cura protectora inicial, limpieza suave, crema cicatrizante, y fotoprotección hasta la cicatrización completa.</p>

<h2>9. Alternativas</h2>
<p>Cover up (tatuaje de cobertura) si el deterioro es muy extenso y un simple retoque no sería suficiente, o eliminación con láser si se prefiere no mantener el diseño.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. COVER UP
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_coverup, 'Cover Up (Tatuaje de Cobertura)', 'tatuajes', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Cover Up (Tatuaje de Cobertura)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Realización de un nuevo diseño de tatuaje sobre la piel donde existe un tatuaje previo, diseñado específicamente para camuflar o integrar el tatuaje existente dentro del nuevo diseño.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Cubrir u ocultar visualmente un tatuaje previo no deseado mediante un nuevo diseño más grande, oscuro o complejo que lo integre.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la tatuador/a diseña una pieza que tenga en cuenta la forma, el color y la ubicación del tatuaje existente, habitualmente con mayor densidad de tinta y tamaño que el original, y realiza el tatuaje con máquina y agujas estériles de un solo uso, pudiendo requerir varias sesiones.</p>

<h2>4. Resultado esperado</h2>
<ul>
  <li>Camuflaje visual del tatuaje anterior mediante el nuevo diseño</li>
  <li><strong>El tatuaje original no desaparece</strong>: puede seguir siendo parcialmente perceptible bajo ciertas condiciones de luz o con el paso del tiempo, según el contraste de colores y la calidad del tatuaje previo</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor y sensibilidad, potencialmente mayores que en un tatuaje nuevo por la mayor densidad de tinta necesaria</li>
  <li>Enrojecimiento e inflamación más intensos por la mayor cantidad de trabajo sobre la piel</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Resultado estético limitado por las características del tatuaje original (color, tamaño, saturación), que el/la tatuador/a habrá explicado antes de comenzar</li>
  <li>Necesidad de sesiones adicionales para lograr la cobertura completa</li>
  <li>Mayor riesgo de saturación de tinta en la piel (exceso de pigmento acumulado)</li>
  <li>Los mismos riesgos generales de un tatuaje: infección, reacción alérgica, cicatrización anómala</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción</li>
  <li>Embarazo o lactancia</li>
  <li>Tatuaje original con cicatrización queloide extensa que desaconseje trabajar sobre la zona</li>
  <li>Las mismas contraindicaciones generales de un tatuaje</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mismos cuidados que un tatuaje nuevo, con especial atención a la zona dado el mayor trabajo realizado sobre la piel.</p>

<h2>9. Alternativas</h2>
<p>Eliminación con láser del tatuaje original antes de realizar un nuevo diseño (proceso más largo pero con mayor libertad de diseño posterior), o retoque si el tatuaje original solo necesita mejoras menores.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. TATUAJE EN ZONAS DE RIESGO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_riesgo, 'Tatuaje en Zonas de Riesgo (Manos, Cuello, Cara)', 'tatuajes', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tatuaje en Zonas de Riesgo',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Realización de un tatuaje en zonas corporales de alta exposición y/o mayor dificultad técnica: manos, dedos, cuello, cara o cabeza, que presentan características especiales frente al resto del cuerpo.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Realizar el diseño acordado en la zona solicitada, informando de forma reforzada de las particularidades y mayores riesgos que presentan estas zonas frente a otras del cuerpo.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la tatuador/a realiza el tatuaje con la misma técnica general, adaptando la profundidad y presión al grosor cutáneo específico de la zona (habitualmente más fina y con mayor movimiento que otras zonas del cuerpo).</p>

<h2>4. Consideraciones específicas de estas zonas</h2>
<ul>
  <li><strong>Mayor desvanecimiento y pérdida de nitidez con el tiempo</strong>, por el grosor cutáneo fino, la exposición solar constante y el roce/lavado frecuente (manos)</li>
  <li><strong>Mayor dolor</strong> por la alta densidad de terminaciones nerviosas en estas zonas</li>
  <li><strong>Implicaciones sociales/laborales</strong>: son zonas de difícil ocultación, lo que puede afectar a determinados entornos laborales o sociales — se recomienda valorarlo antes de decidir</li>
  <li>Cicatrización potencialmente más lenta o irregular por el movimiento constante de la zona (manos, cuello)</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor más intenso que en otras zonas del cuerpo</li>
  <li>Inflamación que puede dificultar el movimiento de la zona los primeros días (manos)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Pérdida de nitidez acelerada respecto a otras zonas del cuerpo, requiriendo retoques más frecuentes</li>
  <li>Infección de mayor relevancia clínica en manos (zona de alto contacto) si no se cuida adecuadamente</li>
  <li>Los mismos riesgos generales de un tatuaje: reacción alérgica, cicatrización anómala</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción</li>
  <li>Embarazo o lactancia</li>
  <li>Las mismas contraindicaciones generales de un tatuaje</li>
  <li>Algunos estudios aplican política propia de edad mínima superior o experiencia previa en tatuajes para estas zonas — se informará si aplica</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Cuidados generales de un tatuaje, con especial atención a evitar el lavado excesivo de manos con jabones agresivos durante la cicatrización, y fotoprotección estricta a largo plazo para retrasar el desvanecimiento en zonas muy expuestas al sol.</p>

<h2>9. Alternativas</h2>
<p>Realizar el mismo diseño en una zona menos expuesta o de piel más gruesa, con mejor retención del pigmento a largo plazo.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. PERFORACIÓN DE ZONAS ESPECIALES
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_especial, 'Perforación de Zonas Especiales (Oral / Genital)', 'tatuajes', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Perforación de Zonas Especiales',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Perforación corporal en zonas de mucosa oral (lengua, labio, frenillo) o genital, que presentan un manejo técnico y unos cuidados específicos distintos de las perforaciones cutáneas convencionales.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Colocar una joya decorativa en la zona especial solicitada, informando de forma reforzada de las particularidades y riesgos superiores que presentan estas zonas.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional desinfecta la zona con productos específicos aptos para mucosas, y realiza la perforación con aguja hueca estéril de un solo uso, colocando la joya de menor tamaño recomendada inicialmente para permitir la inflamación esperable (especialmente en piercings orales).</p>

<h2>4. Consideraciones específicas de estas zonas</h2>
<ul>
  <li><strong>Piercings orales (lengua, labio, frenillo)</strong>: inflamación significativa esperada los primeros días, pudiendo dificultar el habla y la masticación; riesgo de daño dental o de encías por el roce continuado de la joya; riesgo de infección por la alta carga bacteriana natural de la boca</li>
  <li><strong>Piercings genitales</strong>: mayor sensibilidad de la zona; cicatrización que puede ser más lenta; necesidad de higiene íntima reforzada durante el proceso; recomendación de abstinencia de relaciones sexuales durante el periodo de cicatrización inicial</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Inflamación marcada los primeros días (especialmente en piercings orales)</li>
  <li>Dolor y sensibilidad durante la cicatrización</li>
  <li>Dificultad temporal para hablar, comer o mantener relaciones sexuales según la zona</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Infección local, con mayor relevancia clínica potencial en estas zonas</li>
  <li>Daño dental o gingival por el roce continuado de piercings orales (lengua, labio)</li>
  <li>Rechazo o migración de la joya</li>
  <li>Sangrado más abundante de lo habitual por la vascularización de estas zonas</li>
  <li>Formación de tejido cicatricial (queloide) en la zona</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción</li>
  <li>Embarazo (piercings genitales)</li>
  <li>Infecciones bucales o genitales activas</li>
  <li>Hemofilia, diabetes descompensada o enfermedades autoinmunes activas</li>
  <li>Tratamiento con anticoagulantes</li>
  <li>Problemas dentales o periodontales previos relevantes (piercings orales, valorar con el profesional)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Enjuagues con colutorio sin alcohol tras cada comida (piercings orales), dieta blanda y fría los primeros días, higiene íntima reforzada con productos específicos (piercings genitales), y evitar el contacto sexual u oral durante el periodo de cicatrización inicial indicado.</p>

<h2>9. Alternativas</h2>
<p>Realizar la perforación en una zona anatómica de menor riesgo si el cliente lo prefiere tras conocer las particularidades de la zona especial solicitada.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 7. ELIMINACIÓN DE TATUAJE CON LÁSER
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_laser, 'Eliminación de Tatuaje con Láser', 'tatuajes', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Eliminación de Tatuaje con Láser',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica que emplea energía láser de alta intensidad (Q-switched u otras tecnologías específicas de eliminación de tatuajes) para fragmentar las partículas de pigmento en la dermis, permitiendo su eliminación progresiva por el sistema linfático del organismo. <strong>Este procedimiento emplea equipos de mayor potencia que los tratamientos estéticos convencionales y debe ser realizado por personal debidamente formado y cualificado, conforme a la normativa aplicable al equipo utilizado.</strong></p>

<h2>2. Objetivo del procedimiento</h2>
<p>Eliminar total o parcialmente un tatuaje no deseado, ya sea para dejar la piel libre de pigmento o como preparación previa a un cover up.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional aplica los disparos de láser sobre el tatuaje, protegiendo los ojos del cliente y del propio profesional con gafas específicas. Se requieren habitualmente múltiples sesiones (entre 6 y 12 o más, según el tatuaje) espaciadas 6-8 semanas entre sí, para permitir la eliminación progresiva del pigmento fragmentado por el organismo.</p>

<h2>4. Resultado esperado</h2>
<ul>
  <li>Aclaramiento progresivo del tatuaje con cada sesión</li>
  <li>Eliminación completa no garantizada en el 100% de los casos: algunos pigmentos (especialmente ciertos colores como el verde, azul claro o blanco) responden peor al tratamiento y pueden dejar un remanente visible</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor intenso durante la aplicación, superior al del tatuaje original</li>
  <li>Formación de ampollas, costras y descamación en los días posteriores a cada sesión</li>
  <li>Enrojecimiento e inflamación marcados</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Hipopigmentación o hiperpigmentación de la zona tratada, en ocasiones permanente</li>
  <li>Cicatriz residual, especialmente si no se respetan los cuidados postoperatorios o hay manipulación de las ampollas</li>
  <li>Infección local</li>
  <li>Reacción alérgica paradójica por liberación de componentes del pigmento al fragmentarse (más descrita con determinados pigmentos rojos)</li>
  <li>Resultado incompleto que deje pigmento residual visible de forma permanente</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción</li>
  <li>Embarazo o lactancia</li>
  <li>Bronceado reciente o piel expuesta al sol sin protección en las semanas previas</li>
  <li>Fototipos muy altos (mayor riesgo de alteración de la pigmentación)</li>
  <li>Tendencia a cicatrices queloides</li>
  <li>Tratamiento con fármacos fotosensibilizantes</li>
  <li>Infección activa en la zona</li>
  <li>Epilepsia fotosensible</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Fotoprotección solar estricta (SPF 50+) durante todo el proceso, no manipular ni reventar las ampollas que se formen, mantener la zona limpia y con la cura indicada, y no exponer la zona al sol ni a piscina/mar hasta la cicatrización completa de cada sesión.</p>

<h2>9. Alternativas</h2>
<p>Cover up (tatuaje de cobertura) si no se necesita eliminación total, o aceptar el desvanecimiento natural progresivo del tatuaje con el tiempo sin intervención activa.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
