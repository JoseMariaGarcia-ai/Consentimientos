-- Consentimientos informados de Odontología — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Odontología
--
-- A diferencia de Centro Estético, la odontología es ejercicio sanitario
-- (el/la odontólogo/a es personal médico colegiado), así que aplica el
-- mismo marco legal que Medicina Estética: Ley 41/2002 de autonomía del
-- paciente, "paciente"/"odontólogo" como terminología, e historia clínica.

DO $$
DECLARE
  v_extsimp UUID := '10000003-0000-0000-0000-000000000001';
  v_cordal  UUID := '10000003-0000-0000-0000-000000000002';
  v_endo    UUID := '10000003-0000-0000-0000-000000000003';
  v_implant UUID := '10000003-0000-0000-0000-000000000004';
  v_seno    UUID := '10000003-0000-0000-0000-000000000005';
  v_blanq   UUID := '10000003-0000-0000-0000-000000000006';
  v_ortodo  UUID := '10000003-0000-0000-0000-000000000007';
  v_protfij UUID := '10000003-0000-0000-0000-000000000008';
  v_protrem UUID := '10000003-0000-0000-0000-000000000009';
  v_caril   UUID := '10000003-0000-0000-0000-000000000010';
  v_perio   UUID := '10000003-0000-0000-0000-000000000011';
  v_cirperio UUID := '10000003-0000-0000-0000-000000000012';
  v_empaste UUID := '10000003-0000-0000-0000-000000000013';
  v_ferula  UUID := '10000003-0000-0000-0000-000000000014';
  v_sedac   UUID := '10000003-0000-0000-0000-000000000015';
  v_higiene UUID := '10000003-0000-0000-0000-000000000016';
  v_sellado UUID := '10000003-0000-0000-0000-000000000017';
  v_compos  UUID := '10000003-0000-0000-0000-000000000018';
  v_frenect UUID := '10000003-0000-0000-0000-000000000019';
  v_regener UUID := '10000003-0000-0000-0000-000000000020';
  v_allon4  UUID := '10000003-0000-0000-0000-000000000021';
  v_retenid UUID := '10000003-0000-0000-0000-000000000022';
  v_apicect UUID := '10000003-0000-0000-0000-000000000023';
  v_ortoinf UUID := '10000003-0000-0000-0000-000000000024';
  v_smile   UUID := '10000003-0000-0000-0000-000000000025';
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
      "dataClause": "Sus datos personales y de salud serán tratados por esta clínica con la finalidad exclusiva de gestionar su historia clínica dental, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  -- Adaptada a odontología: incluye fotografías, radiografías y registros
  -- digitales (escáner intraoral, modelos), parte de la historia clínica.
  v_img := '<h2>10. Sesión de imágenes (fotografías, radiografías y registros)</h2>
<p>Como parte del diagnóstico y seguimiento de este tratamiento, el equipo odontológico realizará fotografías intraorales/extraorales, radiografías y/o registros digitales (escáner intraoral, modelos de estudio) antes, durante y después del procedimiento. Estos registros forman parte de su historia clínica dental, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>El registro con fines diagnósticos y de seguimiento clínico es necesario para la correcta prestación asistencial y no requiere autorización adicional distinta de este consentimiento. El uso de fotografías con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis fotografías con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible salvo la zona bucal de interés clínico.</li>
  <li>☐ Autorizo el uso de mis fotografías con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la odontólogo/a y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. EXTRACCIÓN DENTAL SIMPLE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_extsimp, 'Extracción Dental Simple', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extracción Dental Simple',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La extracción dental simple consiste en la exodoncia de una pieza dental erupcionada, accesible y sin complicaciones anatómicas previsibles, mediante instrumental de luxación y extracción.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminación de una pieza dental no viable por caries extensa, fractura, enfermedad periodontal avanzada, o por indicación ortodóncica/protésica.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la odontólogo/a luxa la pieza con instrumental específico (botadores, fórceps) hasta su extracción completa. El procedimiento dura entre 10 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación del foco infeccioso o de dolor asociado a la pieza</li>
  <li>Resolución definitiva del problema dental que motiva la extracción</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor, inflamación y hematoma en la zona (2-5 días)</li>
  <li>Sangrado postoperatorio normal en las primeras horas</li>
  <li>Dificultad transitoria para masticar en el lado tratado</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Alveolitis seca (dolor intenso por pérdida del coágulo, 3-5 días tras la extracción)</li>
  <li>Infección postoperatoria</li>
  <li>Fractura radicular que requiera maniobras adicionales</li>
  <li>Lesión de dientes adyacentes</li>
  <li>Comunicación oro-sinusal (en molares superiores, infrecuente)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección aguda no controlada (valorar cobertura antibiótica previa)</li>
  <li>Coagulopatías no controladas o tratamiento anticoagulante sin ajuste médico</li>
  <li>Embarazo en primer o tercer trimestre (valorar urgencia)</li>
  <li>Osteoporosis en tratamiento con bifosfonatos (riesgo de osteonecrosis, valorar)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Morder gasa 30-45 minutos, no enjuagar ni escupir con fuerza en 24 horas, dieta blanda y fría, no fumar ni usar pajita, y tomar la medicación prescrita.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento conservador (endodoncia, obturación) si la pieza es recuperable, o mantenimiento con revisiones si no hay indicación urgente de extracción.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. EXTRACCIÓN QUIRÚRGICA DE CORDALES
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_cordal, 'Extracción Quirúrgica de Cordales (Muelas del Juicio)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extracción Quirúrgica de Cordales',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Cirugía oral menor para la extracción de terceros molares (cordales) incluidos, semi-incluidos o retenidos, que puede requerir colgajo mucoperióstico y osteotomía.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Prevención o tratamiento de infecciones, dolor, apiñamiento dental, quistes o daño a dientes adyacentes asociados a la retención del cordal.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local (y sedación si se acuerda), el/la odontólogo/a realiza una incisión, levanta un colgajo si es necesario, elimina hueso circundante y/o secciona la pieza para su extracción, y sutura la zona. La cirugía dura entre 20 y 60 minutos por pieza.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación del riesgo de infección, quiste o daño a dientes vecinos</li>
  <li>Resolución del dolor o pericoronaritis asociada</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematoma y trismo (dificultad para abrir la boca) durante varios días</li>
  <li>Dolor postoperatorio moderado, controlable con analgesia</li>
  <li>Sangrado en las primeras 24 horas</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Parestesia o disestesia</strong> del nervio dentario inferior o lingual (alteración temporal o, raramente, permanente de la sensibilidad de labio, mentón o lengua)</li>
  <li>Alveolitis seca</li>
  <li>Infección postquirúrgica</li>
  <li>Fractura mandibular (extremadamente infrecuente, cordales muy incluidos)</li>
  <li>Comunicación oro-sinusal (cordales superiores)</li>
  <li>Lesión de dientes adyacentes</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección aguda no controlada</li>
  <li>Coagulopatías no controladas</li>
  <li>Embarazo (valorar urgencia y trimestre)</li>
  <li>Patología sistémica descompensada que contraindique cirugía</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Frío local las primeras 24-48 horas, dieta blanda y fría, higiene suave con enjuagues indicados a partir de 24 horas, reposo relativo, y retirada de puntos (si no son reabsorbibles) a los 7-10 días.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Seguimiento periódico sin extracción si el cordal es asintomático y correctamente posicionado, o tratamiento conservador de la pericoronaritis con antibiótico si no hay indicación quirúrgica urgente.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. ENDODONCIA (TRATAMIENTO DE CONDUCTO)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_endo, 'Endodoncia (Tratamiento de Conducto)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Endodoncia (Tratamiento de Conducto)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La endodoncia consiste en la eliminación del tejido pulpar (nervio) infectado o inflamado del interior del diente, la limpieza y conformación de los conductos radiculares, y su posterior sellado hermético.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminar la infección o inflamación pulpar, aliviar el dolor y conservar la pieza dental evitando su extracción.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local y aislamiento con dique de goma, el/la odontólogo/a accede a la cámara pulpar, localiza e instrumenta los conductos con limas manuales o rotatorias, irriga con soluciones desinfectantes y obtura los conductos con gutapercha y cemento sellador. Puede requerir 1-3 sesiones.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación del dolor y la infección pulpar</li>
  <li>Conservación de la pieza dental natural</li>
  <li>Preparación de la pieza para su posterior restauración</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Molestia o dolor postoperatorio leve-moderado durante 2-4 días</li>
  <li>Sensibilidad a la masticación en los días siguientes</li>
  <li>Fragilidad de la pieza tras el tratamiento, requiriendo restauración adecuada</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Instrumento fracturado dentro del conducto (requiere manejo específico)</li>
  <li>Perforación radicular o de furca</li>
  <li>Fracaso del tratamiento con persistencia de la infección (puede requerir retratamiento, cirugía apical o extracción)</li>
  <li>Fractura dental posterior por debilitamiento de la estructura</li>
  <li>Extrusión de material de obturación más allá del ápice</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Pieza dental no restaurable o con fractura radicular vertical</li>
  <li>Soporte periodontal insuficiente que no justifique el tratamiento</li>
  <li>Imposibilidad de aislamiento o acceso adecuado a los conductos</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar masticar con la pieza tratada hasta su restauración definitiva, tomar la analgesia prescrita si hay molestia, y acudir a la cita de restauración (corona/obturación) en el plazo indicado para evitar fracturas.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Extracción de la pieza y su posterior sustitución (implante, puente o prótesis), o, si la afectación es mínima, seguimiento clínico sin tratamiento (no recomendado si hay infección activa).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. IMPLANTE DENTAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_implant, 'Implante Dental', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Implante Dental',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Colocación quirúrgica de un implante de titanio (o material biocompatible equivalente) en el hueso maxilar o mandibular, que actúa como raíz artificial para soportar posteriormente una corona, puente o prótesis.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Sustitución de una o varias piezas dentales ausentes, restaurando la función masticatoria y la estética, con una alternativa fija a la prótesis removible.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la odontólogo/a prepara el lecho óseo mediante fresado progresivo e inserta el implante, que puede cubrirse con un tornillo de cicatrización o dejarse sumergido según la técnica. Tras un periodo de oseointegración de 6 semanas a 6 meses, se coloca la prótesis definitiva sobre el implante.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Sustitución fija y estable de la pieza ausente</li>
  <li>Preservación del hueso alveolar frente a otras opciones</li>
  <li>Función masticatoria y estética comparable al diente natural</li>
  <li>Alta tasa de éxito a largo plazo (>90-95% según localización y condiciones)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematoma y molestia postoperatoria (varios días)</li>
  <li>Sangrado en las primeras 24 horas</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Fracaso de oseointegración</strong> y pérdida del implante (requiere su retirada y valoración de nuevo intento)</li>
  <li>Periimplantitis (infección/inflamación del tejido alrededor del implante a medio-largo plazo)</li>
  <li>Lesión del nervio dentario inferior con parestesia (mandíbula) o comunicación con el seno maxilar (maxilar superior)</li>
  <li>Infección postquirúrgica</li>
  <li>Fractura del implante o de componentes protésicos (infrecuente)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Volumen óseo insuficiente sin regeneración previa</li>
  <li>Diabetes mal controlada, inmunosupresión severa</li>
  <li>Tabaquismo intenso (aumenta significativamente el riesgo de fracaso, se recomienda reducir/cesar)</li>
  <li>Bifosfonatos intravenosos u osteonecrosis maxilar previa</li>
  <li>Enfermedad periodontal activa no tratada</li>
  <li>Embarazo (valorar posponer)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Higiene meticulosa de la zona, dieta blanda los primeros días, no fumar durante el proceso de cicatrización, y acudir a las revisiones periódicas de mantenimiento periimplantario.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Prótesis fija convencional (puente) sobre dientes adyacentes, prótesis removible, o no reponer la pieza ausente (con riesgo de migración dental y pérdida de función).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. ELEVACIÓN DE SENO MAXILAR
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_seno, 'Elevación de Seno Maxilar (Cirugía Pre-implantológica)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Elevación de Seno Maxilar',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica quirúrgica que consiste en elevar la membrana que recubre el seno maxilar y rellenar el espacio resultante con material de injerto óseo, para aumentar la altura de hueso disponible antes o durante la colocación de implantes en el maxilar posterior.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Ganar volumen óseo suficiente en zonas donde la altura ósea es insuficiente para colocar implantes dentales con garantías de éxito.</p>

<h2>3. Cómo se realiza</h2>
<p>Mediante técnica lateral (ventana ósea) o técnica de abordaje crestal, el/la odontólogo/a accede al suelo del seno maxilar, eleva la membrana sinusal (Schneideriana) y coloca el material de injerto (óseo, sustituto óseo o mixto). Puede realizarse de forma simultánea al implante o en un tiempo previo, según el volumen óseo remanente. La cirugía dura entre 45 y 90 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aumento del volumen óseo disponible para la colocación de implantes</li>
  <li>Mayor previsibilidad y éxito a largo plazo del implante en maxilar posterior</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y hematoma facial en la zona (varios días)</li>
  <li>Congestión nasal o sensación de presión sinusal transitoria</li>
  <li>Sangrado nasal leve postoperatorio</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Perforación de la membrana sinusal</strong> durante la elevación (la complicación más frecuente de esta técnica; puede requerir manejo específico o suspender el injerto)</li>
  <li>Sinusitis maxilar postoperatoria</li>
  <li>Pérdida parcial o total del material de injerto</li>
  <li>Infección del injerto</li>
  <li>Comunicación oroantral</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Sinusitis maxilar activa o patología sinusal no tratada</li>
  <li>Tabaquismo intenso (mayor riesgo de fracaso del injerto)</li>
  <li>Radioterapia previa en la zona</li>
  <li>Enfermedades sistémicas que comprometan la cicatrización ósea</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No sonarse la nariz ni estornudar con la boca cerrada durante 2-3 semanas, evitar viajar en avión o bucear hasta autorización, dieta blanda, y no fumar durante el proceso de cicatrización del injerto.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Implantes cortos que no requieran elevación de seno (si el volumen óseo lo permite), técnicas de regeneración ósea alternativas, o prótesis removible/fija convencional sin implantes.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. BLANQUEAMIENTO DENTAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_blanq, 'Blanqueamiento Dental', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Blanqueamiento Dental',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica cosmético-dental que emplea agentes blanqueadores a base de peróxido de hidrógeno o peróxido de carbamida para aclarar el color del esmalte y la dentina subyacente.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aclarar el tono dental por motivos estéticos, ya sea mediante blanqueamiento en clínica (con o sin activación lumínica) o mediante férulas de blanqueamiento domiciliario supervisado.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa protección de encías y tejidos blandos, se aplica el gel blanqueador sobre las piezas dentales, en clínica (sesión de 30-60 minutos, pudiendo repetirse) y/o mediante férulas personalizadas para uso nocturno en domicilio durante 1-3 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aclaramiento visible del tono dental, habitualmente varios tonos según la escala de color</li>
  <li>Mejora estética de la sonrisa sin desgaste de estructura dental</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensibilidad dental al frío/calor durante el tratamiento y los días posteriores</li>
  <li>Irritación gingival leve por contacto con el gel</li>
  <li>Resultado no uniforme en dientes con manchas intrínsecas o restauraciones previas (que no blanquean igual que el diente natural)</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Quemadura química de la encía por mal aislamiento o uso incorrecto de la férula</li>
  <li>Hipersensibilidad dental persistente</li>
  <li>Reabsorción cervical externa (muy infrecuente, asociada a sobreuso)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Menores de 16 años</li>
  <li>Embarazo o lactancia</li>
  <li>Caries activas no tratadas o hipersensibilidad dental severa preexistente</li>
  <li>Restauraciones extensas visibles (el resultado será desigual, se recomienda valorar previamente)</li>
  <li>Alergia conocida al peróxido de hidrógeno o carbamida</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar alimentos y bebidas con pigmentos (café, vino tinto, cúrcuma) y tabaco durante 48 horas ("dieta blanca"), y usar pasta dental desensibilizante si aparece sensibilidad.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Carillas dentales o coronas estéticas si se busca un cambio de color más marcado o permanente, o mantenimiento del color actual sin tratamiento.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 7. ORTODONCIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ortodo, 'Ortodoncia (Brackets / Alineadores Invisibles)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Ortodoncia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Tratamiento dental que emplea aparatología fija (brackets metálicos o estéticos) o removible (alineadores transparentes) para desplazar progresivamente las piezas dentales y corregir su posición y la oclusión.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corrección del apiñamiento, espaciamiento, maloclusión o mala posición dental, mejorando la función masticatoria, la higiene oral y la estética de la sonrisa.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a coloca los brackets y arcos (que se ajustan periódicamente cada 4-8 semanas) o entrega una secuencia de alineadores transparentes que se cambian cada 1-2 semanas según planificación digital previa. El tratamiento completo dura habitualmente entre 12 y 30 meses.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Alineación dental progresiva y mejora de la oclusión</li>
  <li>Mejora de la estética de la sonrisa</li>
  <li>Facilita la higiene oral al reducir el apiñamiento</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Molestia o dolor dental los primeros días tras cada ajuste/cambio de alineador</li>
  <li>Rozaduras o irritación de mucosas por los brackets</li>
  <li>Dificultad de higiene que aumenta el riesgo de caries o gingivitis si no se mantiene una higiene meticulosa</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Reabsorción radicular externa (acortamiento de la raíz dental, generalmente leve y sin repercusión clínica)</li>
  <li>Recesión gingival en dientes con soporte óseo fino</li>
  <li>Descalcificación del esmalte por higiene deficiente durante el tratamiento</li>
  <li>Recidiva (retorno parcial a la posición inicial) si no se usa la contención tras finalizar</li>
  <li>Anquilosis dental no detectada que impida el movimiento previsto</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Enfermedad periodontal activa no controlada</li>
  <li>Higiene oral deficiente no corregida antes de iniciar</li>
  <li>Patología ósea o articular que contraindique el movimiento dental</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Higiene oral meticulosa tras cada comida, evitar alimentos muy duros o pegajosos, acudir a todas las citas de control, y usar la retención (fija o removible) indicada tras finalizar el tratamiento activo, de forma indefinida o según pauta, para evitar la recidiva.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Otro sistema de ortodoncia (fija vs. alineadores, según el caso lo permita), tratamiento protésico/restaurador de camuflaje, o no tratar si la maloclusión es leve y no funcional.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 8. PRÓTESIS DENTAL FIJA (CORONA / PUENTE)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_protfij, 'Prótesis Dental Fija (Corona / Puente)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Prótesis Dental Fija (Corona / Puente)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Restauración protésica cementada o atornillada, de forma permanente, sobre un diente tallado (corona) o sobre dientes/implantes pilares para sustituir una o varias piezas ausentes (puente).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la función masticatoria y la estética de piezas muy dañadas, endodonciadas o ausentes, mediante una solución fija no removible por el paciente.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a talla la(s) pieza(s) pilar, toma registros/escaneado digital, coloca una restauración provisional, y cementa o atornilla la pieza definitiva (metal-cerámica, disilicato de litio o zirconio) una vez fabricada en laboratorio. El proceso requiere 2-4 citas en 2-4 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Restauración fija y duradera de la función masticatoria</li>
  <li>Resultado estético natural</li>
  <li>Protección de la pieza dañada frente a fractura</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensibilidad dental tras el tallado, especialmente al frío</li>
  <li>Molestia con la provisional hasta la colocación de la definitiva</li>
  <li>Necesidad de ajuste de la mordida tras la cementación</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Necesidad de endodoncia posterior si el diente tallado desarrolla afectación pulpar</li>
  <li>Descementado de la prótesis</li>
  <li>Fractura de la cerámica o del pilar dental</li>
  <li>Caries recurrente en el margen de la corona por higiene deficiente</li>
  <li>Fracaso de un pilar en un puente, comprometiendo toda la estructura</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Soporte periodontal insuficiente del/de los diente(s) pilar(es)</li>
  <li>Higiene oral deficiente no corregida</li>
  <li>Bruxismo severo no controlado (valorar protección adicional)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Higiene meticulosa del margen protésico, uso de cepillo interdental o irrigador en puentes, evitar morder objetos duros, y uso de férula de descarga si hay bruxismo asociado.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Implante dental (en caso de pieza ausente, evita tallar dientes sanos adyacentes), prótesis removible, o mantener la pieza sin restaurar si es funcionalmente viable.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 9. PRÓTESIS DENTAL REMOVIBLE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_protrem, 'Prótesis Dental Removible', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Prótesis Dental Removible',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Restauración protésica que el propio paciente puede colocar y retirar, de tipo parcial (con ganchos o attachments sobre dientes remanentes) o completa (para maxilar/mandíbula totalmente desdentados).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la función masticatoria, fonética y estética en pacientes con ausencia de múltiples piezas dentales, como alternativa más económica y menos invasiva que la prótesis fija o los implantes.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a toma impresiones/escaneado de las arcadas, realiza pruebas de ajuste y montaje de dientes, y entrega la prótesis definitiva tras los ajustes necesarios. El proceso requiere entre 3 y 5 citas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Restauración de la función masticatoria y estética</li>
  <li>Solución removible, más económica que otras alternativas</li>
  <li>No requiere cirugía</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Molestias, rozaduras o llagas durante el periodo de adaptación (1-4 semanas)</li>
  <li>Sensación de cuerpo extraño y aumento inicial de salivación</li>
  <li>Dificultad inicial para hablar y masticar con normalidad</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Reabsorción progresiva del hueso alveolar con el uso prolongado, requiriendo rebases o nuevas prótesis</li>
  <li>Estomatitis protésica (inflamación de la mucosa bajo la prótesis) por higiene inadecuada</li>
  <li>Fractura de la prótesis</li>
  <li>Sobrecarga y daño a los dientes remanentes que sujetan la prótesis parcial</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alergia conocida a los materiales de la prótesis (resina acrílica, metales)</li>
  <li>Reflejo nauseoso muy intenso no controlable (valorar diseño alternativo)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Retirar y limpiar la prótesis diariamente con cepillo específico, no dormir con ella puesta salvo indicación expresa, guardarla en agua o líquido específico cuando no se use, y acudir a revisiones periódicas para valorar ajustes.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Prótesis fija sobre dientes o implantes, sobredentadura implantosoportada, o no reponer las piezas ausentes.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 10. CARILLAS DENTALES
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_caril, 'Carillas Dentales', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Carillas Dentales',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Láminas finas de cerámica (porcelana, disilicato de litio) o composite, cementadas sobre la cara vestibular del diente, con mínimo o nulo desgaste de la estructura dental, para modificar su forma, color o alineación aparente.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora estética de la sonrisa: corrección de color, forma, pequeñas malposiciones o diastemas (espacios entre dientes), sin necesidad de ortodoncia.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a realiza un diseño de sonrisa previo (mock-up), talla mínimamente el esmalte si es necesario, toma registros/escaneado, coloca carillas provisionales, y cementa las carillas definitivas fabricadas en laboratorio. El proceso requiere 2-4 citas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora estética significativa con mínima invasión</li>
  <li>Resultado predecible gracias al diseño de sonrisa previo</li>
  <li>Resistencia y estabilidad de color a largo plazo (carillas de cerámica)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensibilidad dental transitoria tras el tallado</li>
  <li>Necesidad de ajuste de la mordida tras la cementación</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Fractura o desprendimiento de la carilla</li>
  <li>Filtración marginal con manchado del margen a largo plazo</li>
  <li>Necesidad de endodoncia posterior si el tallado afecta la pulpa (infrecuente en carillas mínimamente invasivas)</li>
  <li>Resultado estético no satisfactorio que requiera repetición</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Bruxismo severo no controlado (alto riesgo de fractura, valorar protección con férula)</li>
  <li>Caries activas o enfermedad periodontal no tratada</li>
  <li>Estructura dental insuficiente para la adhesión</li>
  <li>Hábitos parafuncionales no controlados (onicofagia, morder objetos)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar morder objetos duros o alimentos muy duros directamente con las carillas, higiene habitual con cepillo no abrasivo, y uso de férula de descarga nocturna si existe bruxismo.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Blanqueamiento dental (si solo se busca cambio de color), coronas de recubrimiento total (si el daño estructural es mayor), u ortodoncia (si el problema es de posición dental).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 11. PERIODONCIA (TRATAMIENTO DE ENCÍAS)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_perio, 'Periodoncia (Tratamiento de Encías / Curetaje)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Periodoncia (Curetaje)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Raspado y alisado radicular (curetaje) realizado bajo anestesia local por cuadrantes, para eliminar el sarro y las bacterias acumuladas por debajo de la línea de la encía, en pacientes con enfermedad periodontal (periodontitis).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Detener la progresión de la enfermedad periodontal, reducir la profundidad de las bolsas periodontales, y preservar el soporte óseo y dental a largo plazo.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local por cuadrante, el/la odontólogo/a o higienista realiza el raspado y alisado radicular con instrumental manual y/o ultrasónico, eliminando el cálculo subgingival y alisando la superficie radicular. Se realiza en 2-4 sesiones según la extensión.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción de la inflamación gingival y el sangrado</li>
  <li>Disminución de la profundidad de las bolsas periodontales</li>
  <li>Freno de la progresión de la pérdida ósea</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensibilidad dental al frío tras el tratamiento, especialmente en raíces expuestas</li>
  <li>Ligero sangrado y molestia durante 24-48 horas</li>
  <li>Retracción gingival visible al desinflamarse el tejido (efecto esperado, no una complicación)</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Movilidad dental transitoria aumentada</li>
  <li>Persistencia o progresión de la enfermedad si no se mantiene el mantenimiento periodontal</li>
  <li>Necesidad de cirugía periodontal si el curetaje no es suficiente</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección aguda no controlada (valorar cobertura previa)</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Higiene meticulosa con técnica indicada, uso de colutorio antiséptico si se prescribe, y acudir al programa de mantenimiento periodontal periódico (cada 3-6 meses) para evitar la recidiva.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Cirugía periodontal si el curetaje no reduce suficientemente las bolsas, o extracción de piezas con pronóstico irrecuperable.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 12. CIRUGÍA PERIODONTAL (INJERTO DE ENCÍA)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_cirperio, 'Cirugía Periodontal (Injerto de Encía)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Cirugía Periodontal (Injerto de Encía)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Cirugía periodontal que consiste en la obtención de tejido gingival (habitualmente del paladar) o el uso de sustitutos de tejido, para cubrir recesiones gingivales o aumentar el grosor/altura de encía queratinizada.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Cubrir raíces dentales expuestas por recesión gingival, reducir la sensibilidad dental asociada, mejorar la estética y prevenir la progresión de la recesión.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la odontólogo/a obtiene el injerto de la zona donante (habitualmente el paladar) o utiliza matriz de tejido sustitutiva, y lo sutura sobre la zona receptora preparada. La cirugía dura entre 45 y 90 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Cobertura de la raíz expuesta y reducción de la sensibilidad</li>
  <li>Aumento del grosor de encía queratinizada, protegiendo el diente a largo plazo</li>
  <li>Mejora estética de la línea gingival</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor e inflamación en la zona donante (paladar) y receptora durante varios días</li>
  <li>Sangrado postoperatorio</li>
  <li>Molestia al comer alimentos duros o calientes en la zona donante</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Necrosis parcial o pérdida del injerto</li>
  <li>Cobertura radicular incompleta (resultado parcial respecto al objetivo)</li>
  <li>Infección postoperatoria</li>
  <li>Cicatriz visible en la zona donante</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección o inflamación aguda no controlada en la zona</li>
  <li>Tabaquismo intenso (compromete significativamente la cicatrización)</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Dieta blanda y fría los primeros días, no cepillar directamente la zona intervenida hasta autorización, uso de colutorio antiséptico indicado, y no fumar durante el proceso de cicatrización.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento restaurador de la sensibilidad sin cirugía (selladores, barnices desensibilizantes), o seguimiento sin tratamiento si la recesión es leve y estable.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 13. EMPASTE / OBTURACIÓN DENTAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_empaste, 'Empaste / Obturación Dental', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Empaste / Obturación Dental',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Eliminación del tejido dental cariado y restauración de la cavidad resultante con material de obturación (composite, ionómero de vidrio u otro material adhesivo).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminar la caries dental, detener su progresión, y restaurar la forma, función y estética de la pieza afectada.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local si es necesaria, el/la odontólogo/a elimina el tejido cariado con instrumental rotatorio, prepara la cavidad y aplica el material de obturación por capas, fotopolimerizando y ajustando la oclusión. El procedimiento dura entre 20 y 45 minutos por pieza.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación de la caries y detención de su progresión</li>
  <li>Restauración de la función masticatoria y la estética</li>
  <li>Prevención de complicaciones mayores (afectación pulpar, fractura)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensibilidad dental al frío/calor los días posteriores</li>
  <li>Molestia leve al masticar hasta el ajuste completo de la mordida</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Afectación pulpar no detectada que requiera endodoncia posterior</li>
  <li>Fractura del empaste o de la pieza dental</li>
  <li>Filtración marginal con caries recurrente si no se mantiene buena higiene</li>
  <li>Reacción alérgica a algún componente del material (infrecuente)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Caries muy extensa que comprometa la viabilidad de la pieza (valorar endodoncia o extracción)</li>
  <li>Alergia conocida a los materiales de obturación empleados</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar masticar con la pieza tratada hasta que ceda el efecto anestésico (riesgo de mordedura de mejilla/labio), y mantener higiene habitual.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Incrustación cerámica (inlay/onlay) si la cavidad es muy extensa, corona si el remanente dental es insuficiente, o extracción si la pieza no es restaurable.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 14. FÉRULA DE DESCARGA (BRUXISMO)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ferula, 'Férula de Descarga (Bruxismo)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Férula de Descarga',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Dispositivo removible de resina acrílica, fabricado a medida a partir de un registro/escaneado de la arcada dental, que se coloca sobre los dientes (habitualmente por la noche) para proteger el esmalte y reducir la sobrecarga muscular y articular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Proteger las piezas dentales del desgaste por bruxismo (apretamiento o rechinamiento), y aliviar la sobrecarga de la musculatura masticatoria y la articulación temporomandibular (ATM).</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a toma un registro/escaneado de la arcada dental, y tras su fabricación en laboratorio, ajusta la férula en boca verificando el contacto oclusal uniforme. Requiere 2 citas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Protección del esmalte dental frente al desgaste</li>
  <li>Reducción de la tensión muscular y las molestias asociadas al bruxismo</li>
  <li>Alivio de síntomas de la articulación temporomandibular</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensación de cuerpo extraño e hipersalivación los primeros días</li>
  <li>Molestia leve en la mandíbula durante el periodo de adaptación</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Cambios leves y transitorios en la posición dental o la mordida con el uso prolongado sin control</li>
  <li>Rotura de la férula por bruxismo muy intenso</li>
  <li>Persistencia de los síntomas si el bruxismo tiene un componente de estrés no abordado</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alergia conocida a la resina acrílica</li>
  <li>Patología dental activa no tratada que deba resolverse antes (caries, infección)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Limpiar la férula diariamente con cepillo y agua fría (nunca agua caliente, deforma el material), guardarla en su estuche cuando no se use, y acudir a revisión periódica para valorar el desgaste y ajuste.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Técnicas de manejo del estrés o fisioterapia miofuncional si el bruxismo tiene componente psicológico/muscular, o toxina botulínica en musculatura masticatoria (tratamiento de medicina estética) como complemento en casos severos.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 15. SEDACIÓN CONSCIENTE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_sedac, 'Sedación Consciente', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Sedación Consciente',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica farmacológica (óxido nitroso inhalado y/o sedación intravenosa con benzodiacepinas) que induce un estado de relajación y disminución de la ansiedad, manteniendo la respiración espontánea y la capacidad de respuesta del paciente a estímulos verbales.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir la ansiedad y mejorar la tolerancia del paciente durante procedimientos dentales largos, complejos o en pacientes con fobia dental, reflejo nauseoso intenso o necesidades especiales.</p>

<h2>3. Cómo se realiza</h2>
<p>Un/a profesional cualificado administra el óxido nitroso mediante mascarilla nasal (con monitorización continua) y/o el sedante por vía intravenosa, ajustando la dosis según la respuesta del paciente. Se requiere monitorización de constantes vitales durante todo el procedimiento.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción significativa de la ansiedad y el malestar durante el tratamiento</li>
  <li>Mejor tolerancia a procedimientos largos o invasivos</li>
  <li>Recuperación rápida (especialmente con óxido nitroso)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Náuseas o mareo leve durante o tras la sedación</li>
  <li>Somnolencia residual (sedación intravenosa) durante varias horas</li>
  <li>Cefalea leve postsedación</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Depresión respiratoria (más relevante en sedación intravenosa, requiere monitorización y personal cualificado)</li>
  <li>Reacción alérgica al fármaco sedante</li>
  <li>Hipotensión o alteración del ritmo cardíaco</li>
  <li>Aspiración en caso de vómito durante la sedación (riesgo minimizado con ayuno previo)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo (óxido nitroso, salvo indicación específica)</li>
  <li>Enfermedad respiratoria obstructiva severa (contraindicación relativa para óxido nitroso)</li>
  <li>Alergia conocida a las benzodiacepinas u otros sedantes empleados</li>
  <li>No haber cumplido el ayuno indicado antes de sedación intravenosa</li>
  <li>Ausencia de acompañante mayor de edad para el traslado tras sedación intravenosa</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Tras sedación intravenosa, no conducir, manejar maquinaria ni firmar documentos legales durante 24 horas, y permanecer acompañado. Tras óxido nitroso, se recomienda un breve periodo de recuperación con oxígeno antes de abandonar la clínica.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Anestesia local convencional sin sedación, técnicas de manejo de la ansiedad (relajación, distracción), o anestesia general en medio hospitalario para casos muy complejos.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 16. HIGIENE DENTAL PROFESIONAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_higiene, 'Higiene Dental Profesional (Limpieza Bucal)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Higiene Dental Profesional',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Eliminación profesional de placa bacteriana y cálculo (sarro) supragingival mediante instrumental ultrasónico y/o manual, seguida de pulido dental.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Prevención de caries y enfermedad periodontal, eliminación de manchas superficiales, y mantenimiento de la salud bucodental general.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la higienista o odontólogo/a elimina el cálculo con ultrasonidos y/o instrumental manual, y finaliza con pulido con pasta profiláctica. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción de la inflamación gingival y el sangrado</li>
  <li>Prevención de caries y enfermedad periodontal</li>
  <li>Dientes más limpios y libres de manchas superficiales</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensibilidad dental transitoria al frío</li>
  <li>Ligero sangrado gingival durante el procedimiento en encías inflamadas</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Molestia en restauraciones o márgenes protésicos por el instrumental ultrasónico</li>
  <li>Sensibilidad persistente en raíces expuestas</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Portadores de marcapasos sin autorización médica para el uso de ultrasonidos (valorar alternativa manual)</li>
  <li>Infección aguda que requiera tratamiento previo</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar alimentos y bebidas con pigmentos en las horas siguientes si se ha realizado pulido, y mantener la rutina de higiene diaria con cepillo y uso de hilo/cepillo interdental.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>No existe alternativa equivalente para la eliminación de cálculo subgingival ya formado; la prevención con buena higiene diaria reduce su acumulación.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 17. SELLADO DE FISURAS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_sellado, 'Sellado de Fisuras (Odontopediatría Preventiva)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Sellado de Fisuras',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Aplicación de una resina fluida sobre las fosas y fisuras de las caras masticatorias de molares y premolares (habitualmente en dentición infantil), sellándolas para evitar la acumulación de placa bacteriana.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Prevención de caries en las superficies masticatorias de mayor riesgo, especialmente en niños y adolescentes con molares definitivos recién erupcionados.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a limpia y graba la superficie dental, aplica el sellador líquido en las fisuras y lo fotopolimeriza. El procedimiento es indoloro, sin necesidad de anestesia, y dura 5-10 minutos por pieza.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción significativa del riesgo de caries en la superficie sellada</li>
  <li>Procedimiento rápido, indoloro y no invasivo</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensación de mordida ligeramente alta hasta el ajuste (poco frecuente)</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Desprendimiento parcial o total del sellador con el tiempo, requiriendo reaplicación</li>
  <li>Caries no detectada bajo el sellador si existía previamente sin diagnosticar (riesgo minimizado con correcto diagnóstico previo)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Caries ya establecida en la superficie a sellar (requiere tratamiento restaurador, no sellado)</li>
  <li>Alergia conocida a los materiales de resina empleados</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; se recomienda revisión periódica para comprobar la integridad del sellador.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Aplicación tópica de flúor como medida preventiva complementaria, o control mediante revisiones periódicas sin sellado (con mayor riesgo de caries en fisuras profundas).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 18. RECONSTRUCCIÓN CON COMPOSITE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_compos, 'Reconstrucción Dental con Composite', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Reconstrucción con Composite',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica restauradora estética que emplea resina compuesta (composite) aplicada directamente en boca por capas, para reconstruir la forma de dientes fracturados, desgastados o con defectos estéticos, sin necesidad de prótesis de laboratorio.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la forma, función y estética de piezas dentales fracturadas, desgastadas o con diastemas, de forma conservadora y en una sola sesión.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a prepara mínimamente la superficie dental, aplica el composite por capas con técnica de estratificación, esculpiendo la forma deseada, y fotopolimeriza y pule cada capa. El procedimiento dura entre 30 y 90 minutos según la complejidad.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resultado estético inmediato en una única sesión</li>
  <li>Técnica conservadora, con mínimo desgaste de estructura dental</li>
  <li>Reversible o modificable en el futuro si es necesario</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Sensibilidad dental transitoria</li>
  <li>Necesidad de pulido/ajuste adicional en citas posteriores</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Fractura o desgaste del composite con el tiempo (menor resistencia que la cerámica, requiere mantenimiento periódico)</li>
  <li>Manchado o cambio de color del material a largo plazo</li>
  <li>Filtración marginal con caries secundaria si no se mantiene buena higiene</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Bruxismo severo no controlado (mayor riesgo de fractura del material)</li>
  <li>Alergia conocida a los componentes de la resina</li>
  <li>Defecto muy extenso donde el composite no ofrezca suficiente resistencia (valorar carilla o corona)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar morder objetos duros directamente con la reconstrucción, higiene con cepillo no abrasivo, y revisiones periódicas para valorar el estado del material y repulirlo si es necesario.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Carilla o corona cerámica (mayor resistencia y estabilidad de color a largo plazo, pero más invasiva y costosa), u ortodoncia si el problema es de posición dental.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 19. FRENECTOMÍA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_frenect, 'Frenectomía (Cirugía de Frenillo Labial/Lingual)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Frenectomía',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Cirugía oral menor que consiste en la eliminación o reposicionamiento quirúrgico del frenillo labial o lingual, mediante bisturí convencional o láser, cuando su inserción es anómala y provoca alteraciones funcionales o estéticas.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corregir un frenillo con inserción baja que provoque diastema (espacio) entre incisivos, recesión gingival, o limitación de movimiento (anquiloglosia/"lengua anclada") que dificulte el habla, la lactancia o la higiene.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la odontólogo/a secciona o reposiciona el frenillo mediante bisturí o láser, suturando si es necesario. El procedimiento dura entre 15 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación de la limitación funcional (habla, lactancia, movimiento lingual)</li>
  <li>Prevención o corrección de diastema y recesión gingival asociados</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor e inflamación leve-moderada durante varios días</li>
  <li>Molestia al hablar o comer en los primeros días</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Sangrado postoperatorio</li>
  <li>Cicatrización con reinserción parcial del frenillo (recidiva), pudiendo requerir ejercicios miofuncionales o reintervención</li>
  <li>Infección de la zona intervenida</li>
  <li>Cicatriz que limite parcialmente el resultado funcional esperado</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección activa en la zona</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Dieta blanda y fría los primeros días, higiene suave de la zona, ejercicios de movilización indicados (especialmente en frenectomía lingual, para evitar reinserción), y seguimiento por logopedia si procede en casos de anquiloglosia.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Seguimiento sin cirugía si la afectación funcional es mínima, o terapia miofuncional/logopédica como complemento o alternativa en casos leves.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 20. REGENERACIÓN ÓSEA GUIADA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_regener, 'Regeneración Ósea Guiada (Injerto Óseo)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Regeneración Ósea Guiada',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica quirúrgica que emplea material de injerto óseo (autólogo, heterólogo, sintético o mixto) y, habitualmente, una membrana de barrera, para regenerar hueso perdido o insuficiente antes o durante la colocación de un implante dental.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aumentar el volumen óseo disponible en zonas con defectos óseos, reabsorción tras extracción, o pérdida ósea periodontal, para permitir la colocación de implantes con garantías o mejorar el soporte de dientes existentes.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la odontólogo/a accede a la zona a regenerar, coloca el material de injerto y, si procede, una membrana de barrera fijada con pines o suturas, cerrando el colgajo. La cirugía dura entre 45 y 90 minutos, con un periodo de maduración de 4 a 9 meses antes de continuar el tratamiento.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Ganancia de volumen óseo que permite tratamientos posteriores previamente inviables</li>
  <li>Mejora del pronóstico a largo plazo del implante o la pieza dental</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y hematoma en la zona (varios días)</li>
  <li>Dolor postoperatorio moderado</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Exposición o pérdida parcial/total del material de injerto o la membrana</li>
  <li>Infección del injerto</li>
  <li>Regeneración ósea insuficiente que no permita el tratamiento planificado</li>
  <li>Dehiscencia (apertura) de la sutura</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección activa no controlada en la zona</li>
  <li>Tabaquismo intenso (compromete significativamente el éxito de la regeneración)</li>
  <li>Enfermedades sistémicas que comprometan la cicatrización ósea</li>
  <li>Higiene oral deficiente no corregida</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No ejercer presión sobre la zona (evitar prótesis removibles sobre el injerto salvo autorización), dieta blanda, no fumar durante todo el proceso de maduración, e higiene suave con enjuagues indicados.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Implantes cortos o angulados que eviten la necesidad de regeneración (si el caso lo permite), u opciones protésicas sin implante (prótesis removible o fija convencional).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 21. PRÓTESIS SOBRE IMPLANTES (REHABILITACIÓN COMPLETA)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_allon4, 'Prótesis Sobre Implantes (Rehabilitación Completa tipo All-on-4)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Prótesis Sobre Implantes (Rehabilitación Completa)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Rehabilitación protésica completa de una arcada total o parcialmente desdentada, fijada sobre un número reducido de implantes (habitualmente 4 a 6) estratégicamente posicionados, que soportan una prótesis fija o híbrida atornillada.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la función masticatoria y estética completa en pacientes desdentados o con dentición muy deteriorada, mediante una solución fija, evitando en muchos casos la necesidad de injertos óseos previos gracias a la angulación estratégica de los implantes.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a coloca los implantes (con extracción previa de las piezas remanentes si procede, en la misma cirugía o en tiempos diferidos), y coloca una prótesis provisional fija el mismo día o en las 24-48 horas siguientes ("carga inmediata"). La prótesis definitiva se fabrica y coloca tras el periodo de oseointegración (3-6 meses).</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Rehabilitación fija de toda la arcada, evitando la prótesis removible completa</li>
  <li>Función masticatoria y estética recuperadas de forma significativa</li>
  <li>Posibilidad de provisional fija desde el primer día en muchos casos</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematoma y molestia postquirúrgica importante durante la primera semana</li>
  <li>Dificultad de adaptación fonética y masticatoria inicial con la provisional</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Fracaso de oseointegración de uno o varios implantes (puede comprometer la carga inmediata)</li>
  <li>Lesión nerviosa con parestesia</li>
  <li>Fractura de la estructura protésica provisional o definitiva</li>
  <li>Periimplantitis a medio-largo plazo</li>
  <li>Necesidad de retratamiento si la carga inmediata no consigue la estabilidad necesaria</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Volumen óseo insuficiente incluso con angulación de implantes (valorar regeneración previa)</li>
  <li>Diabetes mal controlada, inmunosupresión severa</li>
  <li>Tabaquismo intenso</li>
  <li>Bruxismo muy severo no controlado (mayor riesgo de sobrecarga y fractura protésica)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Dieta blanda estricta durante el periodo de oseointegración, higiene meticulosa con cepillo e irrigador específicos, no fumar, y acudir a las revisiones periódicas de mantenimiento y ajuste oclusal.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Rehabilitación con mayor número de implantes convencionales (sin angulación) tras regeneración ósea previa, prótesis removible completa, o sobredentadura implantosoportada con menor número de implantes.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 22. EXTRACCIÓN DE DIENTE INCLUIDO/RETENIDO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_retenid, 'Extracción de Diente Incluido o Retenido', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extracción de Diente Incluido/Retenido',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Cirugía oral para la extracción de una pieza dental que no ha erupcionado o lo ha hecho parcialmente (distinta de los terceros molares/cordales), como caninos, premolares o supernumerarios retenidos en el hueso.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminar una pieza retenida que provoca dolor, infección, quiste, reabsorción de raíces vecinas, o que interfiere con un tratamiento ortodóncico o protésico planificado.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la odontólogo/a realiza una incisión, levanta un colgajo mucoperióstico, elimina el hueso necesario para acceder a la pieza, y la extrae completa o seccionada, suturando posteriormente. La cirugía dura entre 30 y 75 minutos según la complejidad.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación del riesgo de infección, quiste o daño a estructuras vecinas</li>
  <li>Permite continuar con el tratamiento ortodóncico/protésico planificado</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematoma y trismo durante varios días</li>
  <li>Dolor postoperatorio moderado</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Lesión de nervios sensitivos con parestesia (según localización)</li>
  <li>Lesión de dientes o estructuras vecinas durante el acceso quirúrgico</li>
  <li>Infección postquirúrgica</li>
  <li>Fractura ósea si la extracción es muy compleja</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección aguda no controlada</li>
  <li>Coagulopatías no controladas</li>
  <li>Patología sistémica descompensada que contraindique la cirugía</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Frío local las primeras 24-48 horas, dieta blanda, higiene suave con enjuagues indicados a partir de 24 horas, y retirada de puntos a los 7-10 días si no son reabsorbibles.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tracción ortodóncica de la pieza retenida (si es viable en vez de extraerla), o seguimiento sin intervención si la pieza es asintomática y no interfiere con otros tratamientos.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 23. APICECTOMÍA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_apicect, 'Apicectomía', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Apicectomía',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Cirugía periapical que consiste en el acceso quirúrgico a la raíz dental, la resección de su extremo (ápice) y de la lesión periapical asociada, y el sellado retrógrado del conducto, cuando una endodoncia previa no ha resuelto la infección.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminar una infección periapical persistente tras un tratamiento de conducto (endodoncia) previo, cuando el retratamiento endodóncico convencional no es viable o no ha sido efectivo, evitando la extracción de la pieza.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la odontólogo/a realiza una incisión y levanta un colgajo, accede al hueso sobre el ápice radicular, elimina la lesión y el extremo de la raíz, sella el conducto de forma retrógrada, y sutura la zona. La cirugía dura entre 45 y 90 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resolución de la infección periapical persistente</li>
  <li>Conservación de la pieza dental evitando su extracción</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y hematoma en la zona durante varios días</li>
  <li>Dolor postoperatorio moderado</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Lesión de estructuras vecinas (nervios, seno maxilar) según la localización</li>
  <li>Fracaso del tratamiento con persistencia de la infección, pudiendo requerir extracción</li>
  <li>Infección postquirúrgica</li>
  <li>Recesión gingival o cicatriz visible en la zona</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Soporte periodontal insuficiente de la pieza a tratar</li>
  <li>Fractura radicular vertical (contraindica el tratamiento, indica extracción)</li>
  <li>Infección aguda no controlada</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Frío local las primeras 24-48 horas, dieta blanda, higiene suave con enjuagues indicados, y retirada de puntos a los 7-10 días si no son reabsorbibles.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Retratamiento endodóncico convencional (si es viable), o extracción de la pieza y su posterior sustitución (implante, puente o prótesis).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 24. ORTODONCIA INFANTIL / ORTOPEDIA MAXILAR
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ortoinf, 'Ortodoncia Infantil / Ortopedia Maxilar (Interceptiva)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Ortodoncia Infantil / Ortopedia Maxilar',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Tratamiento de ortodoncia interceptiva realizado en dentición temporal o mixta (niños), mediante aparatología removible o fija, dirigido a guiar el crecimiento óseo maxilar/mandibular y corregir hábitos o maloclusiones en desarrollo.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corregir precozmente problemas de crecimiento óseo (mordida cruzada, deficiencia transversal o sagital), eliminar hábitos perjudiciales (succión digital, deglución atípica), y crear espacio para la erupción correcta de la dentición definitiva.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a coloca aparatología removible (placas expansoras, disyuntores) o fija según el diagnóstico, con ajustes periódicos cada 4-8 semanas. El tratamiento interceptivo dura habitualmente entre 6 y 18 meses, y puede requerir una segunda fase de ortodoncia en dentición definitiva.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Corrección temprana de problemas de crecimiento, aprovechando el potencial de desarrollo óseo del niño</li>
  <li>Reducción de la complejidad o duración de un eventual tratamiento posterior en dentición definitiva</li>
  <li>Eliminación de hábitos perjudiciales para el desarrollo dental y facial</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Molestia o dolor tras la activación de la aparatología expansora</li>
  <li>Dificultad inicial de fonación o adaptación al aparato</li>
  <li>Necesidad de colaboración del menor para el uso correcto (aparatos removibles)</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Resultado incompleto por falta de colaboración/uso insuficiente del aparato removible</li>
  <li>Necesidad de una segunda fase de tratamiento en dentición definitiva pese al tratamiento interceptivo</li>
  <li>Rotura o pérdida del aparato removible</li>
  <li>Irritación de mucosas por la aparatología</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Falta de colaboración previsible que impida el uso correcto del aparato (valorar alternativa fija)</li>
  <li>Patología ósea o sistémica que contraindique el tratamiento (valorar con el/la odontólogo/a)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Uso del aparato según la pauta horaria indicada (esencial para el éxito del tratamiento), higiene meticulosa del aparato y la boca, y acudir a todas las citas de control y activación.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Posponer el tratamiento hasta la dentición definitiva (con posible mayor complejidad del tratamiento posterior), u observación periódica sin tratamiento si la maloclusión es leve.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 25. DISEÑO DE SONRISA DIGITAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_smile, 'Diseño de Sonrisa Digital (Smile Design)', 'odontologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Diseño de Sonrisa Digital',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Planificación estética digital previa a un tratamiento restaurador (carillas, coronas, ortodoncia o combinación de tratamientos), que emplea fotografías, escaneado intraoral y software específico para diseñar y previsualizar el resultado final antes de iniciar cualquier tratamiento.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Planificar de forma predecible el resultado estético de la sonrisa, permitiendo al paciente visualizar y validar el diseño (mock-up) antes de comprometerse con el tratamiento definitivo.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la odontólogo/a toma fotografías y un escaneado digital de la boca del paciente, diseña digitalmente la nueva sonrisa con software específico, y habitualmente fabrica una prueba física (mock-up) para que el paciente visualice el resultado en boca antes de decidir el tratamiento definitivo (carillas, composite, ortodoncia u otra combinación).</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Visualización previa del resultado estético antes de iniciar el tratamiento</li>
  <li>Mayor predictibilidad y satisfacción con el resultado final</li>
  <li>Permite decidir con información visual el tratamiento restaurador más adecuado</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>El mock-up es una previsualización aproximada; el resultado definitivo puede variar ligeramente según el material y técnica final empleados</li>
  <li>Sensación temporal extraña con la prueba de mock-up en boca</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Expectativas no ajustadas a la viabilidad clínica real del caso, por lo que el diseño final se ajusta siempre a lo clínicamente posible</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología dental o periodontal activa no tratada, que debe resolverse antes del diseño definitivo</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; este procedimiento es diagnóstico/de planificación, no invasivo por sí mismo (salvo el tratamiento restaurador que se decida posteriormente, que llevará su propio consentimiento específico).</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Planificación tradicional sin herramientas digitales, o inicio directo del tratamiento restaurador sin fase de diseño previo (menor predictibilidad del resultado).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
