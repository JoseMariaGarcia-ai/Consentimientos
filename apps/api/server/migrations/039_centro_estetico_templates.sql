-- Consentimientos informados de Centro Estético — Legalidad española
-- Conforme a: RD Legislativo 1/2007 (consumidores) · RGPD (UE) 2016/679 ·
-- LOPDGDD 3/2018 · eIDAS 910/2014 · Ley Orgánica 1/1982 (propia imagen)
-- Categoría: Centro Estético
--
-- A diferencia de las plantillas de Medicina Estética (procedimientos
-- médicos con aguja/láser de uso sanitario, regulados por la Ley 41/2002),
-- estos tratamientos los realiza un/a profesional de estética (no un
-- médico) y no tienen carácter sanitario, por lo que su base legal es la
-- normativa de consumidores y la reglamentación autonómica de centros de
-- estética, no la Ley 41/2002 de autonomía del paciente.

DO $$
DECLARE
  v_facial   UUID := '10000002-0000-0000-0000-000000000001';
  v_pestan   UUID := '10000002-0000-0000-0000-000000000002';
  v_micropig UUID := '10000002-0000-0000-0000-000000000003';
  v_drenaje  UUID := '10000002-0000-0000-0000-000000000004';
  v_preso    UUID := '10000002-0000-0000-0000-000000000005';
  v_dermo    UUID := '10000002-0000-0000-0000-000000000006';
  v_reafirm  UUID := '10000002-0000-0000-0000-000000000007';
  v_ems      UUID := '10000002-0000-0000-0000-000000000008';
  v_led      UUID := '10000002-0000-0000-0000-000000000009';
  v_ionto    UUID := '10000002-0000-0000-0000-000000000010';
  v_ipl      UUID := '10000002-0000-0000-0000-000000000013';
  v_legal    JSONB;
  v_legal18  JSONB;
  v_img      TEXT;
BEGIN

  -- Marco legal común (mayoría de edad 16 con autorización de tutor si es menor)
  v_legal := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Real Decreto Legislativo 1/2007, de 16 de noviembre (Ley General para la Defensa de los Consumidores y Usuarios), y normativa autonómica de centros de estética",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 16,
      "witnessRequired": false,
      "retentionYears": 5,
      "introText": "De conformidad con la normativa de protección de los consumidores y usuarios, tiene derecho a recibir información completa, comprensible y veraz sobre el tratamiento propuesto antes de decidir si desea o no someterse al mismo.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del tratamiento, sin que ello suponga penalización alguna.",
      "dataClause": "Sus datos personales serán tratados por este centro con la finalidad exclusiva de gestionar su ficha de cliente y prestarle el servicio solicitado, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  -- Marco legal para tratamientos asimilables al tatuaje (micropigmentación):
  -- mayoría de edad plena sin excepción, conforme a la normativa autonómica
  -- que regula las prácticas de tatuaje, micropigmentación y perforación
  -- cutánea (p. ej. Decreto 35/2019 de Cataluña, Decreto 286/2002 de
  -- Madrid, y equivalentes en el resto de comunidades autónomas).
  v_legal18 := jsonb_set(v_legal, '{es-ES,minAge}', '18');

  -- Cláusula de sesión de imágenes, adaptada a un contexto no sanitario
  -- (ficha de cliente en vez de historia clínica). Casillas desmarcadas por
  -- defecto: un checkbox premarcado no constituye consentimiento válido
  -- bajo el RGPD (art. 4.11 y considerando 32; doctrina del TJUE, Planet49).
  v_img := '<h2>%s. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento del tratamiento, el centro podrá realizar fotografías y/o vídeos de la zona tratada antes, durante y después del servicio, con el fin de documentar el estado previo y valorar el resultado. Estas imágenes forman parte de su ficha de cliente y se tratan con la misma confidencialidad que el resto de sus datos, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>La toma de imágenes con fines de seguimiento del servicio no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso al servicio que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos</strong> (cursos, demostraciones internas), garantizando que mi rostro no será reconocible.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales del centro), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito al centro, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>
';

  -- ─────────────────────────────────────────────────────────────
  -- 1. LIMPIEZA FACIAL PROFUNDA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_facial, 'Limpieza Facial Profunda', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Limpieza Facial Profunda',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>La limpieza facial profunda es un tratamiento de estética facial que combina higiene, exfoliación, extracción manual o instrumental de comedones e impurezas, y aplicación de productos calmantes e hidratantes, con el objetivo de mejorar el aspecto y la salud superficial de la piel.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminación de impurezas, puntos negros y células muertas, mejora de la textura y luminosidad de la piel, y prevención de la aparición de imperfecciones.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional de estética realiza una desincrustación mediante vapor de ozono o productos queratolíticos suaves, seguida de extracción manual o con extractor de comedones, y finaliza con mascarilla calmante, sérum e hidratación. La sesión dura entre 45 y 75 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Piel visiblemente más limpia, luminosa y de textura uniforme</li>
  <li>Reducción de puntos negros y poros obstruidos</li>
  <li>Mejor absorción de los productos cosméticos posteriores</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento (eritema) transitorio de la piel durante unas horas</li>
  <li>Ligera sensibilidad o tirantez tras la extracción</li>
  <li>Pequeños puntos rojos en zonas de extracción, que desaparecen en 24-48 horas</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Reacción alérgica a alguno de los productos aplicados</li>
  <li>Pequeñas marcas o microheridas por extracción en piel muy sensible</li>
  <li>Brote de acné reactivo en las 48 horas siguientes</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Heridas abiertas, quemaduras solares recientes o dermatitis activa en la zona</li>
  <li>Herpes labial en fase activa</li>
  <li>Alergia conocida a alguno de los productos utilizados</li>
  <li>Rosácea inflamatoria en brote agudo (valorar con el/la profesional)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar maquillaje durante 12-24 horas, aplicar fotoprotección solar, y no manipular ni presionar la piel en los días siguientes al tratamiento.</p>

<h2>9. Alternativas</h2>
<p>Microdermoabrasión estética, peeling químico médico (en clínica), o rutina de higiene facial en domicilio con productos específicos.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. EXTENSIÓN Y LIFTING DE PESTAÑAS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_pestan, 'Extensión y Lifting de Pestañas', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extensión y Lifting de Pestañas',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>La extensión de pestañas consiste en la adhesión de fibras sintéticas, de seda o mink individuales a las pestañas naturales mediante un adhesivo cosmético específico. El lifting de pestañas es un tratamiento que riza y fija la pestaña natural mediante productos de curvatura permanente.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aumentar volumen, longitud y curvatura de las pestañas con un efecto duradero, sin necesidad de máscara de pestañas diaria.</p>

<h2>3. Cómo se realiza</h2>
<p>Con los ojos cerrados y protegidos mediante parches, el/la profesional aplica el adhesivo y las extensiones fibra a fibra (extensión) o aplica los productos de curvatura y fijación sobre la pestaña natural (lifting). La sesión dura entre 60 y 120 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mirada con más volumen y definición de forma inmediata</li>
  <li>Efecto duradero: 3-4 semanas (extensión) o 6-8 semanas (lifting)</li>
  <li>Ahorro de tiempo en la rutina diaria de maquillaje</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Lagrimeo, picor o irritación ocular leve durante la aplicación</li>
  <li>Sensación de peso o cuerpo extraño los primeros días (extensión)</li>
  <li>Enrojecimiento transitorio de párpados</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Reacción alérgica al adhesivo, al látex o a los productos de curvatura (dermatitis de contacto, edema palpebral)</li>
  <li>Conjuntivitis irritativa o infecciosa por mala higiene o manipulación</li>
  <li>Rotura o debilitamiento de la pestaña natural por mala retirada o exceso de peso de las extensiones</li>
  <li>Queratitis por contacto accidental de producto con la córnea</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alergia conocida a adhesivos cosméticos, látex o formaldehído</li>
  <li>Conjuntivitis, blefaritis u otra infección ocular activa</li>
  <li>Cirugía ocular reciente (menos de 4 semanas)</li>
  <li>Ausencia de pestañas naturales suficientes para soportar la extensión</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar el contacto con agua o vapor durante las primeras 24-48 horas, no frotar los ojos, no usar máscara de pestañas ni desmaquillantes oleosos sobre las extensiones, y acudir a retoque cada 3-4 semanas.</p>

<h2>9. Alternativas</h2>
<p>Máscara de pestañas convencional, pestañas postizas de un solo uso, o micropigmentación de la línea de pestañas.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. MAQUILLAJE PERMANENTE DE LABIOS Y OJOS (MICROPIGMENTACIÓN)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_micropig, 'Maquillaje Permanente de Labios y Ojos (Micropigmentación)', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Maquillaje Permanente de Labios y Ojos',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>El maquillaje permanente o micropigmentación es una técnica que implanta pigmento en las capas superficiales de la dermis mediante microagujas, de forma análoga a un tatuaje, para conseguir un efecto de maquillaje duradero en labios (perfilado o full lips) o en la línea de pestañas/párpados (eyeliner).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Definir y dar color a los labios, o realizar un delineado permanente en la línea de pestañas superior y/o inferior, con un resultado que dura entre 1 y 3 años según el tipo de piel y cuidados.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica, el/la profesional implanta el pigmento con dermógrafo y microagujas estériles de un solo uso, siguiendo el diseño acordado previamente con el cliente. La sesión dura entre 90 y 150 minutos, y habitualmente se requiere una sesión de retoque a las 4-6 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resultado de maquillaje duradero sin necesidad de aplicación diaria</li>
  <li>Definición y simetría de labios u ojos</li>
  <li>Ahorro de tiempo en la rutina diaria</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento, edema y sensibilidad en la zona tratada (3-7 días)</li>
  <li>Descamación superficial durante el proceso de cicatrización (5-10 días)</li>
  <li>Color más intenso los primeros días, que se aclara tras la cicatrización</li>
  <li>Dolor o molestia durante el procedimiento pese a la anestesia tópica</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Infección local por mala cicatrización o cuidados inadecuados</li>
  <li>Reacción alérgica al pigmento o a la anestesia tópica</li>
  <li>Reactivación de herpes labial (en tratamientos de labios)</li>
  <li>Migración o difuminado irregular del pigmento</li>
  <li>Formación de granulomas o cicatrices hipertróficas (infrecuente)</li>
  <li>Resultado final distinto al esperado, requiriendo corrección posterior</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de edad, sin excepción</li>
  <li>Embarazo o lactancia</li>
  <li>Hemofilia, diabetes descompensada o enfermedades autoinmunes activas</li>
  <li>Tratamiento con anticoagulantes o isotretinoína</li>
  <li>Herpes labial activo (tratamientos de labios) o infección cutánea en la zona</li>
  <li>Alergia conocida a pigmentos, tintas o anestésicos tópicos</li>
  <li>Queloides o cicatrización hipertrófica previa</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Aplicar la pomada cicatrizante indicada, evitar el sol directo, la piscina, la sauna y el maquillaje sobre la zona hasta la cicatrización completa (7-10 días), y no despegar las costras que se formen de manera natural.</p>

<h2>9. Alternativas</h2>
<p>Maquillaje convencional diario, perfilado con henna temporal (cejas), o delineado con productos cosméticos de larga duración no permanentes.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, incluida la naturaleza semipermanente del pigmento implantado, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Declara ser mayor de edad y consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal18)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. DRENAJE LINFÁTICO MANUAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_drenaje, 'Drenaje Linfático Manual', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Drenaje Linfático Manual',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>El drenaje linfático manual es una técnica de masaje suave y rítmico dirigida a estimular la circulación linfática y favorecer la eliminación de líquidos retenidos en los tejidos.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducción de la retención de líquidos, mejora de la sensación de piernas cansadas, apoyo tras tratamientos corporales estéticos, y bienestar general.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional realiza maniobras manuales suaves, sin masaje profundo ni presión intensa, siguiendo el trayecto de los ganglios y vasos linfáticos. La sesión dura entre 45 y 60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Sensación de ligereza y reducción de la hinchazón</li>
  <li>Mejora de la circulación superficial</li>
  <li>Efecto relajante y de bienestar general</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Necesidad de orinar con mayor frecuencia en las horas siguientes (efecto esperado del drenaje)</li>
  <li>Ligera fatiga o somnolencia tras la sesión</li>
  <li>Enrojecimiento cutáneo leve y transitorio</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Mareo o hipotensión transitoria al incorporarse</li>
  <li>Molestia en zonas con ganglios sensibles</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Trombosis venosa profunda activa o antecedente reciente</li>
  <li>Insuficiencia cardíaca o renal descompensada</li>
  <li>Infecciones activas, fiebre o procesos inflamatorios agudos</li>
  <li>Cáncer activo (salvo autorización médica expresa)</li>
  <li>Embarazo de riesgo (valorar con el/la profesional)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Beber abundante agua tras la sesión para favorecer la eliminación de líquidos, y evitar comidas copiosas o alcohol en las horas siguientes.</p>

<h2>9. Alternativas</h2>
<p>Presoterapia, medias de compresión, ejercicio físico moderado, o valoración médica si la retención de líquidos es persistente o de causa no estética.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. PRESOTERAPIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_preso, 'Presoterapia', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Presoterapia',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>La presoterapia es una técnica que utiliza un equipo de compresión neumática secuencial, mediante botas y/o manguitos inflables, para estimular la circulación venosa y linfática de piernas, brazos y abdomen.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducción de la sensación de piernas cansadas, apoyo en el drenaje de líquidos, mejora del aspecto de la piel de naranja, y complemento de tratamientos reductores o reafirmantes.</p>

<h2>3. Cómo se realiza</h2>
<p>El cliente se coloca las botas o manguitos neumáticos conectados al equipo, que realiza ciclos de compresión y descompresión secuencial ajustados en presión e intensidad por el/la profesional. La sesión dura entre 20 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Sensación inmediata de ligereza en piernas</li>
  <li>Mejora de la circulación de retorno</li>
  <li>Efecto complementario en programas de reducción y firmeza corporal</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Sensación de hormigueo o adormecimiento transitorio en las extremidades</li>
  <li>Necesidad de orinar con mayor frecuencia tras la sesión</li>
  <li>Enrojecimiento cutáneo leve por la compresión</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Hematomas en pieles muy sensibles o con fragilidad capilar</li>
  <li>Molestia o dolor si la presión se ajusta demasiado alta</li>
  <li>Mareo transitorio al finalizar la sesión</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Trombosis venosa profunda, tromboflebitis activa o antecedente reciente</li>
  <li>Insuficiencia cardíaca o renal descompensada</li>
  <li>Embarazo (contraindicado salvo protocolo específico autorizado)</li>
  <li>Infecciones cutáneas activas, heridas abiertas o fracturas recientes en la zona</li>
  <li>Hipertensión no controlada</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Beber abundante agua tras la sesión y evitar prendas muy ajustadas en las horas siguientes.</p>

<h2>9. Alternativas</h2>
<p>Drenaje linfático manual, medias de compresión graduada, o ejercicio físico regular.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. MICRODERMOABRASIÓN ESTÉTICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_dermo, 'Microdermoabrasión Estética', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Microdermoabrasión Estética',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>La microdermoabrasión estética es una técnica de exfoliación mecánica superficial de la piel mediante un equipo de punta de diamante o microcristales, de uso cosmético y no médico, que elimina las células muertas de las capas más externas de la epidermis.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora de la textura y luminosidad de la piel, reducción de la apariencia de poros dilatados, líneas finas superficiales y marcas leves de acné, y renovación de la piel apagada.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional desliza el cabezal del equipo sobre la piel limpia, realizando una succión y exfoliación superficial controlada, seguida de la aplicación de sérum e hidratación. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Piel más lisa, luminosa y de textura uniforme</li>
  <li>Mejora de la apariencia de poros y marcas superficiales</li>
  <li>Mejor absorción de los productos cosméticos aplicados después</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento (eritema) durante varias horas tras el tratamiento</li>
  <li>Sensación de tirantez o sequedad cutánea los primeros días</li>
  <li>Sensibilidad aumentada al sol durante 48-72 horas</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Pequeñas irritaciones o microabrasiones en piel muy sensible o reactiva</li>
  <li>Hiperpigmentación postinflamatoria transitoria en fototipos altos</li>
  <li>Reactivación de herpes labial</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Rosácea inflamatoria activa, dermatitis o eccema en la zona</li>
  <li>Acné activo con lesiones inflamatorias o pústulas abiertas</li>
  <li>Uso de isotretinoína oral en los últimos 6 meses</li>
  <li>Exposición solar reciente sin fotoprotección o bronceado activo</li>
  <li>Herpes labial en fase activa</li>
  <li>Heridas abiertas o quemaduras en la zona a tratar</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Fotoprotección solar estricta (SPF 30+) durante al menos 2 semanas, evitar exfoliantes o ácidos durante 48-72 horas, y mantener la piel bien hidratada.</p>

<h2>9. Alternativas</h2>
<p>Peeling químico médico (en clínica), limpieza facial profunda, o dermapen/microagujas de uso médico.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 7. TRATAMIENTO REAFIRMANTE Y ANTICELULÍTICO (VACUOTERAPIA)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_reafirm, 'Tratamiento Reafirmante y Anticelulítico (Vacuoterapia)', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tratamiento Reafirmante y Anticelulítico',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento corporal de uso cosmético que combina succión-masaje (vacuoterapia) con productos reafirmantes y/o anticelulíticos, dirigido a mejorar el aspecto de la piel de naranja, la flacidez y la firmeza cutánea.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora del aspecto de la celulitis, estimulación de la microcirculación local, y mejora de la firmeza y tersura de la piel corporal. Se recomienda un programa de 8-12 sesiones para resultados óptimos.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional aplica el cabezal de vacuoterapia sobre la piel con aceite o crema conductora, realizando un masaje de succión controlada en las zonas a tratar, complementado con productos cosméticos reafirmantes. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora progresiva del aspecto de la piel de naranja</li>
  <li>Sensación de piel más firme y tersa</li>
  <li>Efecto relajante y estimulante de la circulación</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento y sensación de calor en la zona tratada</li>
  <li>Pequeños hematomas por la succión, especialmente en piel sensible (resolución en días)</li>
  <li>Molestia leve durante el tratamiento</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Hematomas más extensos en pieles con fragilidad capilar o tratamiento anticoagulante</li>
  <li>Reacción alérgica a los productos cosméticos aplicados</li>
  <li>Rotura de pequeños vasos capilares (petequias)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Trombosis venosa, varices severas o fragilidad capilar importante</li>
  <li>Embarazo</li>
  <li>Tratamiento anticoagulante</li>
  <li>Infecciones cutáneas activas, heridas abiertas o dermatitis en la zona</li>
  <li>Cáncer activo (salvo autorización médica expresa)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Beber abundante agua, evitar exposición solar directa en la zona tratada durante 24 horas, y mantener constancia en el programa de sesiones para optimizar resultados.</p>

<h2>9. Alternativas</h2>
<p>Presoterapia, drenaje linfático manual, radiofrecuencia estética cosmética, o cavitación médica (en clínica).</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 8. ELECTROESTIMULACIÓN MUSCULAR ESTÉTICA (EMS)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ems, 'Electroestimulación Muscular Estética (EMS)', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Electroestimulación Muscular Estética (EMS)',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>La electroestimulación muscular (EMS) de uso estético emplea corrientes eléctricas de baja/media frecuencia aplicadas mediante electrodos, chaleco o traje conductor, para provocar contracciones musculares involuntarias con fines de tonificación.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tonificación muscular, complemento de programas de ejercicio, y mejora del aspecto y firmeza de la musculatura tratada (abdomen, glúteos, brazos, piernas).</p>

<h2>3. Cómo se realiza</h2>
<p>El cliente se coloca el chaleco/traje o los electrodos en las zonas a tratar, y el/la profesional ajusta la intensidad de la corriente de forma progresiva y tolerable. La sesión, con o sin ejercicio activo simultáneo, dura entre 20 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Sensación de tonificación muscular</li>
  <li>Complemento eficaz a la actividad física convencional</li>
  <li>Ahorro de tiempo frente al entrenamiento tradicional</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Agujetas o dolor muscular tardío (24-48 horas), similar al ejercicio intenso</li>
  <li>Enrojecimiento cutáneo en la zona de los electrodos</li>
  <li>Fatiga muscular transitoria</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Irritación cutánea o quemadura leve por mal contacto del electrodo</li>
  <li>Rabdomiólisis por sobreentrenamiento o intensidad excesiva (muy infrecuente pero grave; requiere ajuste correcto de intensidad y progresión)</li>
  <li>Molestias en personas con baja tolerancia a la corriente eléctrica</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Portadores de marcapasos, desfibrilador u otros dispositivos electrónicos implantados</li>
  <li>Embarazo</li>
  <li>Epilepsia</li>
  <li>Enfermedades cardiovasculares graves o hipertensión no controlada</li>
  <li>Hernias abdominales o discales (según zona a tratar)</li>
  <li>Trombosis o problemas de coagulación</li>
  <li>Fiebre o infección activa</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Hidratarse adecuadamente tras la sesión, y respetar al menos 48 horas de descanso entre sesiones para permitir la recuperación muscular.</p>

<h2>9. Alternativas</h2>
<p>Entrenamiento físico convencional, tratamientos reafirmantes cosméticos, o electroestimulación de uso médico-rehabilitador (fisioterapia).</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 9. FOTOBIOMODULACIÓN / LED FACIAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_led, 'Fotobiomodulación / LED Facial', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fotobiomodulación / LED Facial',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>La fotobiomodulación con LED es un tratamiento cosmético no invasivo que emplea luz de baja intensidad en distintas longitudes de onda (roja, azul, amarilla, infrarroja) para estimular procesos celulares superficiales de la piel, sin generar calor ni dañar el tejido.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Luz roja/infrarroja: estimulación de colágeno y mejora del aspecto de la piel. Luz azul: acción calmante coadyuvante en pieles con tendencia acneica. Luz amarilla: calmar rojeces y mejorar la luminosidad.</p>

<h2>3. Cómo se realiza</h2>
<p>El cliente se coloca bajo una máscara o panel LED con los ojos protegidos mediante gafas opacas, durante sesiones de 15 a 20 minutos, habitualmente combinado con otros tratamientos faciales.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora progresiva del aspecto y luminosidad de la piel</li>
  <li>Efecto calmante y coadyuvante en pieles reactivas o con tendencia acneica</li>
  <li>Tratamiento indoloro y sin tiempo de recuperación</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento leve y transitorio tras la sesión</li>
  <li>Sensación de calor superficial durante el tratamiento</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Molestia ocular si no se usa correctamente la protección visual</li>
  <li>Reacción de fotosensibilidad en personas con tratamientos fotosensibilizantes</li>
  <li>Cefalea leve tras la exposición prolongada</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Epilepsia fotosensible</li>
  <li>Tratamiento farmacológico fotosensibilizante (algunos antibióticos, isotretinoína)</li>
  <li>Patología ocular activa sin protección adecuada</li>
  <li>Embarazo (precaución, sin evidencia de riesgo pero se recomienda valorar)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; se recomienda fotoprotección solar diaria como parte de la rutina cosmética habitual.</p>

<h2>9. Alternativas</h2>
<p>Mesoterapia facial, skin boosters, tratamientos cosméticos tópicos, o láser médico en clínica según el objetivo perseguido.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 10. IONTOFORESIS Y ELECTROPORACIÓN ESTÉTICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ionto, 'Iontoforesis y Electroporación Estética', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Iontoforesis y Electroporación Estética',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnicas cosméticas que emplean una corriente eléctrica de baja intensidad (iontoforesis) o pulsos eléctricos controlados (electroporación) para facilitar la penetración transdérmica de principios activos cosméticos, sin necesidad de agujas.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar la absorción de sérums y activos cosméticos (hidratantes, vitamínicos, despigmentantes) aplicados en el mismo tratamiento, potenciando su efecto respecto a la aplicación tópica convencional.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la profesional aplica el producto cosmético indicado y desliza el cabezal del equipo sobre la piel, generando una corriente de baja intensidad controlada y tolerable. La sesión dura entre 20 y 40 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mayor eficacia percibida de los activos cosméticos aplicados</li>
  <li>Tratamiento indoloro, sin agujas ni tiempo de recuperación</li>
  <li>Complemento habitual de tratamientos faciales</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Ligero hormigueo o sensación de corriente durante la aplicación</li>
  <li>Enrojecimiento cutáneo transitorio</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Irritación cutánea o pequeña quemadura por mal contacto del cabezal</li>
  <li>Reacción alérgica al producto cosmético vehiculizado</li>
  <li>Molestia en pieles con baja tolerancia a la corriente eléctrica</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Portadores de marcapasos, desfibrilador u otros dispositivos electrónicos implantados</li>
  <li>Embarazo</li>
  <li>Epilepsia</li>
  <li>Heridas abiertas, dermatitis activa o infección cutánea en la zona</li>
  <li>Metales u objetos metálicos implantados en la zona de tratamiento</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; se recomienda fotoprotección solar diaria como parte de la rutina cosmética habitual.</p>

<h2>9. Alternativas</h2>
<p>Mesoterapia facial (uso médico), aplicación cosmética tópica convencional, o microagujas/dermapen en clínica.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 11. DEPILACIÓN LÁSER ESTÉTICA (IPL)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ipl, 'Depilación Láser Estética (IPL)', 'centro_estetico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Depilación Láser Estética (IPL)',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>La depilación con luz pulsada intensa (IPL) es una técnica cosmética que emplea equipos de menor potencia que el láser de uso médico para debilitar progresivamente el folículo piloso mediante fototermólisis selectiva. <strong>Este tratamiento es distinto de la depilación láser médica</strong> (equipos de mayor potencia, aplicados en clínica bajo supervisión médica), que se ofrece como tratamiento independiente.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducción progresiva y duradera del vello corporal y facial no deseado. Se requieren habitualmente entre 6 y 10 sesiones espaciadas de 4-6 semanas, según la zona, el fototipo y el tipo de vello.</p>

<h2>3. Cómo se realiza</h2>
<p>Previo rasurado de la zona, el/la profesional aplica destellos de luz pulsada con el equipo IPL sobre la piel, protegiendo los ojos con gafas específicas. La sesión dura entre 15 y 60 minutos según la zona.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción progresiva de la cantidad y grosor del vello</li>
  <li>Vello más fino y de crecimiento más lento con las sesiones</li>
  <li>Alternativa a la depilación con cera o cuchilla a medio-largo plazo</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento y sensación de calor en la zona tratada (horas tras la sesión)</li>
  <li>Foliculitis leve o pequeñas costras en los folículos</li>
  <li>Sensación de escozor durante la aplicación</li>
</ul>

<h2>6. Riesgos poco frecuentes o raros</h2>
<ul>
  <li>Quemadura superficial o ampolla, especialmente en pieles bronceadas o fototipos altos</li>
  <li>Hiperpigmentación o hipopigmentación transitoria</li>
  <li>Foliculitis con infección secundaria</li>
  <li>Efecto paradójico: estimulación del crecimiento en vez de reducción (infrecuente, más habitual en vello fino/rubio)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo</li>
  <li>Bronceado reciente o piel expuesta al sol sin protección en las 2-4 semanas previas</li>
  <li>Fototipos muy altos (V-VI) o vello muy claro/blanco (menor eficacia y mayor riesgo, valorar con el/la profesional)</li>
  <li>Uso de fármacos fotosensibilizantes (isotretinoína, algunos antibióticos)</li>
  <li>Tatuajes o manchas oscuras en la zona a tratar (riesgo de quemadura)</li>
  <li>Infecciones cutáneas activas o heridas abiertas en la zona</li>
  <li>Epilepsia fotosensible</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Fotoprotección solar estricta (SPF 50+) durante al menos 2 semanas, no exponerse al sol ni a cabinas UV, evitar depilación con cera/pinzas entre sesiones (solo rasurado), e hidratar la piel.</p>

<h2>9. Alternativas</h2>
<p>Depilación láser médica (en clínica, mayor potencia y eficacia), depilación con cera o cuchilla, o electrólisis.</p>

' || format(v_img, '10') || '<h2>11. Declaración del cliente</h2>
<p>El/La cliente declara haber leído y comprendido la información anterior, incluida la diferencia con la depilación láser de uso médico y la necesidad de varias sesiones, haber tenido la oportunidad de formular preguntas al/a la profesional y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    category = EXCLUDED.category,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;

-- Desambiguar la plantilla médica existente frente a la nueva versión de
-- centro de estética (misma finalidad, tecnología de mayor potencia y uso
-- sanitario bajo supervisión médica).
UPDATE consent_templates
SET treatment_type = 'Depilación Láser Médica',
    content_json = jsonb_set(content_json, '{es-ES,title}', '"Consentimiento Informado — Depilación Láser Médica"')
WHERE id = '10000001-0000-0000-0000-000000000009'
  AND treatment_type = 'Depilación Láser';
