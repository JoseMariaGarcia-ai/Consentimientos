-- Consentimientos informados adicionales de Medicina Estética — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Medicina Estética (ampliación de las 20 plantillas existentes)

DO $$
DECLARE
  v_gluteos  UUID := '10000001-0000-0000-0000-000000000021';
  v_hiperhid UUID := '10000001-0000-0000-0000-000000000022';
  v_bruxismo UUID := '10000001-0000-0000-0000-000000000023';
  v_intimo   UUID := '10000001-0000-0000-0000-000000000024';
  v_exosomas UUID := '10000001-0000-0000-0000-000000000025';
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
  -- AUMENTO DE GLÚTEOS (BIOESTIMULADORES / ÁCIDO HIALURÓNICO)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_gluteos, 'Aumento de Glúteos (Bioestimuladores / Ácido Hialurónico)', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Aumento de Glúteos No Quirúrgico',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Inyección de ácido hialurónico de alta densidad, hidroxiapatita cálcica u otro bioestimulador en la región glútea, con el fin de aumentar el volumen y mejorar el contorno de forma no quirúrgica, como alternativa al lipofilling (transferencia de grasa) o los implantes.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aumentar el volumen glúteo, mejorar la proyección y corregir asimetrías, con resultado inmediato y sin cirugía ni periodo de baja laboral prolongado.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el médico inyecta el producto con cánula roma o aguja en el plano subcutáneo profundo o supramuscular, en varios puntos de entrada, siguiendo un plan de tratamiento individualizado. La sesión dura entre 45 y 90 minutos, pudiendo requerir varias sesiones para alcanzar el volumen deseado (grandes volúmenes de producto).</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aumento de volumen y mejora del contorno glúteo de forma inmediata</li>
  <li>Sin cirugía, anestesia general ni ingreso hospitalario</li>
  <li>Duración del efecto variable según el producto empleado (12-24 meses o más con bioestimuladores)</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Dolor, inflamación y hematomas en la zona (varios días)</li>
  <li>Asimetría o resultado subóptimo que requiera sesión adicional</li>
  <li>Molestia al sentarse los primeros días</li>
  <li>Nódulos o irregularidades palpables</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local o absceso</li>
  <li>Migración del producto</li>
  <li>Reacción inflamatoria tardía o granuloma</li>
  <li>Asimetría persistente que requiera corrección</li>
</ul>

<h2>7. Riesgos raros o excepcionales pero graves</h2>
<ul>
  <li><strong>Embolismo vascular (oclusión de vaso sanguíneo)</strong>: la región glútea presenta vasos de gran calibre; una inyección intravascular accidental puede provocar necrosis cutánea extensa o, en casos excepcionales, embolismo pulmonar. Este es el riesgo más grave asociado al procedimiento, y su prevención exige técnica con cánula roma, conocimiento anatómico experto y aspiración previa a la inyección.</li>
  <li>Necrosis tisular extensa que requiera manejo quirúrgico</li>
  <li>Reacción anafiláctica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedades autoinmunes activas o inmunosupresión severa</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Tratamiento con anticoagulantes</li>
  <li>Hipersensibilidad conocida a los componentes del producto</li>
  <li>Expectativas de volumen no realistas o desproporcionadas respecto a la anatomía del paciente</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>Lipofilling (transferencia de grasa propia mediante cirugía), implantes glúteos quirúrgicos, entrenamiento de fuerza específico, o combinación de tratamientos de menor volumen por sesión para minimizar el riesgo.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- TOXINA BOTULÍNICA PARA HIPERHIDROSIS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_hiperhid, 'Toxina Botulínica para Hiperhidrosis', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Toxina Botulínica para Hiperhidrosis',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Administración de toxina botulínica tipo A mediante microinyecciones intradérmicas en la zona con sudoración excesiva (axilas, palmas de las manos o plantas de los pies), bloqueando temporalmente la liberación del neurotransmisor responsable de la activación de las glándulas sudoríparas.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir significativamente la sudoración excesiva (hiperhidrosis) axilar, palmar o plantar, mejorando la calidad de vida del paciente en su día a día.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa aplicación de anestesia tópica y/o técnicas de enfriamiento local (la zona es sensible), el médico administra múltiples microinyecciones distribuidas de forma homogénea por toda la zona a tratar, siguiendo un patrón de cuadrícula. La sesión dura entre 20 y 45 minutos según la zona y extensión.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción significativa de la sudoración en la zona tratada (hasta un 80-90 % en la mayoría de pacientes)</li>
  <li>Mejora relevante de la calidad de vida y la confianza social</li>
  <li>Duración del efecto entre 6 y 9 meses</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Dolor durante la aplicación (zona sensible, especialmente palmas y plantas)</li>
  <li>Hematomas en los puntos de inyección</li>
  <li>Debilidad transitoria de la musculatura de la mano en tratamientos palmares (agarre)</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Sudoración compensatoria en otras zonas del cuerpo no tratadas</li>
  <li>Resultado subóptimo o de menor duración de lo esperado</li>
  <li>Molestia o debilidad prolongada en la musculatura de la mano (tratamiento palmar)</li>
</ul>

<h2>7. Riesgos raros o excepcionales</h2>
<ul>
  <li>Resistencia al producto por formación de anticuerpos neutralizantes con tratamientos repetidos</li>
  <li>Reacción alérgica sistémica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedades neuromusculares (miastenia gravis, síndrome de Eaton-Lambert, ELA)</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Hipersensibilidad conocida a cualquier componente de la fórmula</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>Antitranspirantes de alta concentración de uso tópico, iontoforesis, simpatectomía quirúrgica (en casos severos y refractarios), o tratamiento farmacológico sistémico (anticolinérgicos orales).</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- TOXINA BOTULÍNICA PARA BRUXISMO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_bruxismo, 'Toxina Botulínica para Bruxismo', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Toxina Botulínica para Bruxismo',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Administración de toxina botulínica tipo A mediante inyección intramuscular en el músculo masetero (y, si procede, temporal), con el fin de reducir su hiperactividad y la fuerza de contracción asociada al bruxismo (apretamiento o rechinamiento dental).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir la tensión y sobrecarga muscular asociada al bruxismo, aliviar el dolor mandibular, la cefalea tensional y el desgaste dental asociados, y, como efecto estético secundario, conseguir un adelgazamiento del contorno mandibular en casos de hipertrofia del masetero.</p>

<h2>3. Cómo se realiza</h2>
<p>El médico localiza el músculo masetero mediante palpación (solicitando al paciente que apriete los dientes) y administra el producto en varios puntos del músculo. La sesión dura entre 15 y 30 minutos. El efecto máximo se aprecia entre 2 y 4 semanas después.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del dolor mandibular, la cefalea tensional y la sobrecarga articular asociados al bruxismo</li>
  <li>Menor desgaste dental por la reducción de la fuerza de apretamiento</li>
  <li>Efecto estético secundario de afinamiento del óvalo facial en casos de hipertrofia del masetero</li>
  <li>Duración del efecto entre 4 y 6 meses</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Dolor, hematoma o inflamación en el punto de inyección</li>
  <li>Debilidad temporal al masticar alimentos duros los primeros días</li>
  <li>Asimetría facial leve y transitoria</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Dificultad para masticar de forma más marcada y prolongada de lo esperado</li>
  <li>Sonrisa asimétrica por difusión del producto a músculos adyacentes (cigomático)</li>
  <li>Resultado estético no uniforme entre ambos lados</li>
</ul>

<h2>7. Riesgos raros o excepcionales</h2>
<ul>
  <li>Disfagia (dificultad para tragar) por difusión del producto a musculatura profunda relacionada con la deglución</li>
  <li>Reacción anafiláctica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedades neuromusculares (miastenia gravis, síndrome de Eaton-Lambert, ELA)</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Hipersensibilidad conocida a cualquier componente de la fórmula</li>
  <li>Patología témporo-mandibular no diagnosticada (se recomienda valoración previa)</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>Férula de descarga dental (tratamiento odontológico complementario o alternativo), técnicas de manejo del estrés, fisioterapia miofuncional, u otros tratamientos del bruxismo según su origen.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- REJUVENECIMIENTO ÍNTIMO NO QUIRÚRGICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_intimo, 'Rejuvenecimiento Íntimo No Quirúrgico', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Rejuvenecimiento Íntimo No Quirúrgico',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Tratamiento médico no quirúrgico de la zona genital externa femenina mediante láser (CO₂ fraccionado o Er:YAG) o radiofrecuencia, dirigido a estimular la producción de colágeno y mejorar el tono y la elasticidad de los tejidos vaginales y vulvares.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora de la laxitud vaginal, sequedad, atrofia genitourinaria (especialmente en la menopausia), y síntomas asociados como la incontinencia urinaria leve de esfuerzo, además de mejora estética de la zona vulvar en casos seleccionados.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa valoración ginecológica y explicación detallada del procedimiento, el médico aplica el dispositivo de láser o radiofrecuencia sobre la mucosa vaginal y/o la zona vulvar externa, según el objetivo del tratamiento. La sesión dura entre 15 y 30 minutos, con un protocolo habitual de 3 sesiones separadas por 4-6 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la sequedad, la laxitud y la elasticidad de los tejidos tratados</li>
  <li>Mejora de la sintomatología de la atrofia genitourinaria en mujeres menopáusicas</li>
  <li>Posible mejora de la incontinencia urinaria leve de esfuerzo</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Molestia o sensación de calor durante y después del tratamiento</li>
  <li>Enrojecimiento e inflamación leve de la mucosa tratada</li>
  <li>Flujo vaginal aumentado en los días posteriores</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local</li>
  <li>Molestia o dolor durante las relaciones sexuales en los días posteriores al tratamiento</li>
  <li>Resultado subóptimo o insuficiente respecto a las expectativas</li>
</ul>

<h2>7. Riesgos raros o excepcionales</h2>
<ul>
  <li>Quemadura de la mucosa por parámetros inadecuados del equipo</li>
  <li>Cicatrización anómala de la mucosa tratada</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Infección genital activa (vaginosis, infección de transmisión sexual)</li>
  <li>Sangrado vaginal activo no diagnosticado</li>
  <li>Neoplasia genital activa</li>
  <li>Prolapso genital severo no valorado previamente</li>
  <li>Portadoras de dispositivo intrauterino con hilos visibles en el campo de tratamiento (valorar con el médico)</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Evitar relaciones sexuales y el uso de tampones durante las 48-72 horas siguientes a cada sesión, mantener una higiene íntima suave con productos neutros, y acudir a la revisión de seguimiento programada.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- EXOSOMAS FACIALES
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_exosomas, 'Exosomas Faciales', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Exosomas Faciales',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Tratamiento médico regenerativo de última generación que emplea exosomas (vesículas extracelulares ricas en factores de crecimiento, proteínas y ARN mensajero, de origen no celular) aplicados en el rostro mediante microinyecciones y/o técnicas de microneedling, para estimular la regeneración cutánea.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar la calidad, luminosidad y firmeza de la piel del rostro, estimular la producción de colágeno, y favorecer la recuperación cutánea tras otros tratamientos estéticos (láser, peeling, microagujas), mediante señalización celular avanzada.</p>

<h2>3. Cómo se realiza</h2>
<p>El médico aplica los exosomas mediante microinyecciones intradérmicas y/o tras microneedling para favorecer su penetración en la piel del rostro. La sesión dura entre 30 y 45 minutos, con un protocolo habitual de 3-4 sesiones separadas por 2-4 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la luminosidad, textura y firmeza de la piel</li>
  <li>Estimulación de la producción de colágeno</li>
  <li>Producto no celular, con menor riesgo inmunológico que otras terapias celulares</li>
  <li>Complemento eficaz para acelerar la recuperación tras otros tratamientos estéticos</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema, edema y molestia en el rostro tras la sesión</li>
  <li>Dolor durante la aplicación, especialmente si se combina con microneedling</li>
  <li>Pequeños hematomas en los puntos de inyección</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Reacción alérgica o de hipersensibilidad al producto</li>
  <li>Infección local</li>
  <li>Respuesta clínica variable, al tratarse de una técnica relativamente reciente con menor volumen de evidencia científica a largo plazo que otras terapias más establecidas (PRP, mesoterapia)</li>
</ul>

<h2>7. Riesgos raros o excepcionales</h2>
<ul>
  <li>Reacción inflamatoria tardía</li>
  <li>Reacción anafiláctica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedad oncológica activa</li>
  <li>Infección o dermatosis activa en la zona a tratar</li>
  <li>Alergia conocida a alguno de los componentes del producto</li>
  <li>Enfermedades autoinmunes activas (valorar individualmente)</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>PRP facial, mesoterapia facial con vitaminas, skin boosters de ácido hialurónico, o tratamientos tópicos de cosmética médica.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
