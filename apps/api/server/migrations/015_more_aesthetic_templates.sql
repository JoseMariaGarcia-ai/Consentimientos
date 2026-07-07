-- supabase/migrations/015_more_aesthetic_templates.sql
-- 12 nuevas plantillas de consentimiento informado de Medicina Estética,
-- con el mismo marco legal, estructura y nivel de detalle que las 7
-- plantillas de la migración 005, e incluyendo ya el apartado de "Sesión
-- de imágenes" (con las casillas de uso opcional DESMARCADAS por defecto,
-- ver migración 014) como penúltimo apartado de cada una.

DO $$
DECLARE
  v_laser  UUID := '10000001-0000-0000-0000-000000000008';
  v_depil  UUID := '10000001-0000-0000-0000-000000000009';
  v_hifu   UUID := '10000001-0000-0000-0000-000000000010';
  v_rf     UUID := '10000001-0000-0000-0000-000000000011';
  v_cavit  UUID := '10000001-0000-0000-0000-000000000012';
  v_plasma UUID := '10000001-0000-0000-0000-000000000013';
  v_prp    UUID := '10000001-0000-0000-0000-000000000014';
  v_thread UUID := '10000001-0000-0000-0000-000000000015';
  v_lipo   UUID := '10000001-0000-0000-0000-000000000016';
  v_carbo  UUID := '10000001-0000-0000-0000-000000000017';
  v_micro  UUID := '10000001-0000-0000-0000-000000000018';
  v_ceja   UUID := '10000001-0000-0000-0000-000000000019';
  v_peelest UUID := '10000001-0000-0000-0000-000000000020';
  v_legal  JSONB;
  v_img    TEXT := '<h2>11. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo médico realizará fotografías y/o vídeos de la zona tratada antes, durante y después del procedimiento. Estas imágenes tienen como finalidad principal documentar el estado clínico previo, valorar la evolución y el resultado del tratamiento, y forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>La toma de imágenes con fines clínicos es necesaria para la correcta prestación asistencial y no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

';
  v_declaracion TEXT := '<h2>12. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, incluidas las instrucciones de cuidado postprocedimiento, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';
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

  -- ─────────────────────────────────────────────────────────────
  -- 8. LÁSER / IPL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_laser, 'Láser / IPL (Fotorrejuvenecimiento y Lesiones Vasculares)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Láser / IPL',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El láser y la luz pulsada intensa (IPL) son tecnologías de fototerapia que emiten energía lumínica de longitudes de onda específicas, absorbida selectivamente por cromóforos de la piel (melanina, hemoglobina) mediante el principio de fototermólisis selectiva. Esta energía provoca la destrucción controlada de la lesión diana (vaso sanguíneo, mancha pigmentada) y estimula la renovación del colágeno dérmico.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de léntigos solares, manchas pigmentadas, melasma (con precaución), lesiones vasculares faciales (telangiectasias, rosácea, cuperosis), fotoenvejecimiento cutáneo, textura irregular y poros dilatados. Se recomiendan habitualmente entre 3 y 6 sesiones separadas por 3-4 semanas.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa limpieza de la piel y protección ocular con gafas específicas, el médico aplica los disparos de láser o IPL sobre la zona a tratar, con o sin gel conductor según el equipo. La sensación es de un pequeño pinchazo o calor tipo goma elástica. La sesión dura entre 15 y 30 minutos según la extensión.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aclaramiento y desaparición progresiva de manchas y lesiones vasculares</li>
  <li>Mejora del tono, textura y luminosidad cutánea</li>
  <li>Estimulación de colágeno y mejora de poros dilatados</li>
  <li>Procedimiento ambulatorio sin período de baja</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema y edema transitorio en la zona tratada (horas a 2-3 días)</li>
  <li>Sensación de calor o escozor durante y tras el tratamiento</li>
  <li>Oscurecimiento transitorio de las manchas tratadas antes de su desprendimiento (efecto pimienta)</li>
  <li>Costras superficiales en lesiones pigmentadas (resolución en 5-10 días)</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Quemaduras superficiales o ampollas</li>
  <li>Hiperpigmentación o hipopigmentación postinflamatoria, especialmente en fototipos altos (IV-VI)</li>
  <li>Infección local o reactivación de herpes simple</li>
  <li>Púrpura en tratamientos vasculares (equipos de colorante pulsado)</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Cicatrices permanentes</li>
  <li>Lesión ocular por exposición directa al haz sin protección adecuada</li>
  <li>Discromías permanentes</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo</li>
  <li>Bronceado activo o exposición solar reciente sin fotoprotección (últimas 4 semanas)</li>
  <li>Uso de fármacos fotosensibilizantes</li>
  <li>Melasma en fase activa sin control previo (valorar caso por caso)</li>
  <li>Fototipos altos (V-VI) para determinados equipos — mayor riesgo de discromía</li>
  <li>Infección activa o herpes en la zona</li>
  <li>Antecedentes de cicatrización queloide</li>
  <li>Uso de isotretinoína oral en los últimos 6 meses</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Fotoprotección solar estricta (SPF 50+) durante al menos 4 semanas</li>
  <li>No despegar ni rascar las costras que puedan formarse</li>
  <li>Aplicar productos calmantes/reparadores según indicación médica</li>
  <li>Evitar exposición al calor (sauna, agua muy caliente) 48 horas</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Peelings químicos, mesoterapia despigmentante, tratamientos tópicos médicos, radiofrecuencia, microagujas o camuflaje cosmético.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 9. DEPILACIÓN LÁSER
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_depil, 'Depilación Láser', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Depilación Láser',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La depilación láser utiliza energía lumínica selectivamente absorbida por la melanina del folículo piloso (fototermólisis selectiva), generando calor que daña el folículo y frena su capacidad de producir nuevo vello, de forma progresiva y acumulativa a lo largo de varias sesiones, respetando el ciclo de crecimiento del pelo (anágeno, catágeno, telógeno).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducción progresiva y duradera del vello no deseado en cualquier zona corporal (facial, axilas, ingles, piernas, espalda, línea alba, etc.). Se requieren habitualmente entre 6 y 10 sesiones separadas por 4-8 semanas según la zona y el tipo de vello, con sesiones de mantenimiento anuales.</p>

<h2>3. Cómo se realiza</h2>
<p>Previo rasurado de la zona (nunca depilación con cera o pinza), el médico aplica los disparos de láser con la potencia adecuada al fototipo cutáneo y el grosor del vello, con sistema de refrigeración simultánea de la piel. La sesión dura entre 10 y 60 minutos según la extensión de la zona.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción progresiva y duradera del vello (70-90 % tras el ciclo completo)</li>
  <li>Disminución del grosor y velocidad de crecimiento del vello residual</li>
  <li>Menor incidencia de pelos encarnados o foliculitis por depilación mecánica</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema y edema perifolicular transitorio (horas)</li>
  <li>Sensación de calor o escozor durante el disparo</li>
  <li>Foliculitis leve postratamiento</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Quemaduras superficiales o ampollas, especialmente en pieles bronceadas</li>
  <li>Hiperpigmentación o hipopigmentación postinflamatoria</li>
  <li>Foliculitis infecciosa</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Cicatrices</li>
  <li>Hipertricosis paradójica (estimulación paradójica del crecimiento piloso, más frecuente en zonas hormono-dependientes)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo</li>
  <li>Bronceado activo o exposición solar reciente</li>
  <li>Fármacos fotosensibilizantes</li>
  <li>Infección activa en la zona</li>
  <li>Tatuajes en la zona a tratar (riesgo de quemadura sobre el pigmento)</li>
  <li>Alteraciones hormonales no controladas (pueden limitar la eficacia)</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Fotoprotección solar estricta (SPF 50+) durante 2-4 semanas</li>
  <li>Evitar depilación con cera o pinza entre sesiones (solo rasurado)</li>
  <li>Evitar calor intenso (sauna, agua muy caliente) 24-48 horas</li>
  <li>Aplicar productos calmantes si hay irritación</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Depilación con luz pulsada (IPL), electrólisis, depilación mecánica convencional (cera, cuchilla) o tratamientos farmacológicos tópicos (eflornitina).</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 10. HIFU
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_hifu, 'HIFU — Ultrasonido Focalizado de Alta Intensidad', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — HIFU',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El HIFU (High Intensity Focused Ultrasound) emite energía ultrasónica focalizada que se concentra en un punto específico bajo la piel (dermis profunda, SMAS o tejido subcutáneo), generando un microcoágulo térmico controlado (60-70 °C) sin dañar la superficie cutánea. Esto estimula la retracción inmediata y la neocolagénesis progresiva de las fibras de colágeno y elastina.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Lifting facial no quirúrgico: flacidez de óvalo facial, papada, cejas caídas, líneas de marioneta y código de barras. Uso corporal: flacidez de abdomen, brazos, muslos y glúteos. Se realiza habitualmente en una sesión, con posible repetición a los 6-12 meses.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa limpieza y aplicación de gel conductor, el médico aplica el cabezal del equipo sobre la zona, emitiendo disparos de ultrasonido a diferentes profundidades (1,5 mm, 3 mm, 4,5 mm) según el objetivo. Puede emplearse anestesia tópica o analgesia oral previa por la sensación de calor/pinchazo. La sesión dura entre 30 y 90 minutos según la zona tratada.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Efecto lifting y tensado progresivo sin cirugía ni tiempo de recuperación</li>
  <li>Mejora de la flacidez y definición del contorno facial o corporal</li>
  <li>Resultados progresivos visibles entre 6 semanas y 3-6 meses</li>
  <li>Duración del efecto entre 12 y 18 meses</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema y edema transitorio (horas)</li>
  <li>Dolor moderado durante la aplicación (sensación de calor/pinchazo profundo)</li>
  <li>Sensibilidad al tacto en la zona tratada durante días</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Disestesia o adormecimiento transitorio</li>
  <li>Hematomas</li>
  <li>Pequeñas quemaduras o marcas lineales cutáneas por técnica incorrecta</li>
  <li>Edema prolongado</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Parálisis facial transitoria por afectación de ramas nerviosas periféricas (reversible en semanas)</li>
  <li>Necrosis grasa o cambios en el contorno por sobretratamiento</li>
  <li>Cicatrices</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo</li>
  <li>Implantes metálicos, marcapasos o dispositivos electrónicos activos en la zona</li>
  <li>Rellenos de relleno permanente o hilos tensores recientes en la zona (valorar caso por caso)</li>
  <li>Infección activa o lesiones cutáneas abiertas en la zona</li>
  <li>Enfermedades del colágeno o cicatrización anómala</li>
  <li>Flacidez muy severa (puede requerir cirugía en lugar de HIFU)</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Fotoprotección solar (SPF 30+)</li>
  <li>Evitar tratamientos térmicos o exfoliantes agresivos en la zona durante 1-2 semanas</li>
  <li>Hidratación cutánea habitual</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Radiofrecuencia, hilos tensores, rellenos de ácido hialurónico, biorrestimuladores o cirugía de estiramiento facial/corporal (ritidectomía, lifting).</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 11. RADIOFRECUENCIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_rf, 'Radiofrecuencia Facial y Corporal', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Radiofrecuencia Facial y Corporal',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La radiofrecuencia utiliza corriente eléctrica de alta frecuencia que, al atravesar los tejidos, genera calor por resistencia (efecto Joule) en la dermis profunda y el tejido subcutáneo, provocando contracción inmediata de las fibras de colágeno y estimulación progresiva de la neocolagénesis y neoelastogénesis, sin dañar la epidermis.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora de la flacidez facial y corporal, tensado cutáneo, reducción de la celulitis, mejora del contorno corporal y remodelación facial (óvalo, papada, cuello). Se recomiendan habitualmente entre 4 y 8 sesiones separadas por 1-2 semanas, con mantenimiento periódico.</p>

<h2>3. Cómo se realiza</h2>
<p>El médico aplica el cabezal del equipo (monopolar, bipolar o fraccionado según el equipo) sobre la piel con gel conductor, realizando movimientos continuos mientras controla la temperatura cutánea (habitualmente 40-42 °C) mediante sensores o retroalimentación térmica. La sesión dura entre 20 y 60 minutos según la zona.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Efecto tensor inmediato y progresivo de la piel</li>
  <li>Mejora de la textura y firmeza cutánea</li>
  <li>Reducción de la apariencia de la celulitis</li>
  <li>Sin período de recuperación</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema transitorio (horas)</li>
  <li>Sensación de calor intenso durante el tratamiento</li>
  <li>Resultado variable y dependiente de varias sesiones</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Quemaduras superficiales por exceso de temperatura o técnica incorrecta</li>
  <li>Edema persistente</li>
  <li>Hiperpigmentación postinflamatoria</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Quemaduras profundas o necrosis grasa</li>
  <li>Lesión nerviosa periférica transitoria</li>
  <li>Paniculitis (inflamación del tejido graso subcutáneo)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo</li>
  <li>Marcapasos, desfibriladores o implantes metálicos/electrónicos en la zona</li>
  <li>Infección activa o lesiones cutáneas en la zona</li>
  <li>Enfermedades del tejido conectivo</li>
  <li>Trombosis venosa profunda reciente (uso corporal)</li>
  <li>Cáncer activo</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Hidratación cutánea habitual</li>
  <li>Fotoprotección solar</li>
  <li>Evitar exposición a fuentes de calor adicionales las 24 horas siguientes</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>HIFU, hilos tensores, mesoterapia, rellenos y biorrestimuladores, o cirugía de estiramiento.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 12. CAVITACIÓN Y CRIOLIPÓLISIS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_cavit, 'Cavitación y Criolipólisis (Reducción de Grasa Localizada)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Cavitación y Criolipólisis',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Se engloban aquí dos técnicas no invasivas de reducción de grasa localizada: la <strong>cavitación ultrasónica</strong>, que emite ultrasonidos de baja frecuencia que provocan microburbujas dentro del adipocito hasta romper su membrana (lipólisis mecánica), liberando su contenido para ser metabolizado y eliminado por el sistema linfático; y la <strong>criolipólisis</strong>, que aplica frío controlado (aproximadamente -5 a -11 °C) de forma localizada, provocando apoptosis selectiva de los adipocitos (más sensibles al frío que otras células), que son eliminados de forma natural en las semanas siguientes.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducción de acumulaciones de grasa localizada resistentes a dieta y ejercicio (abdomen, flancos, muslos, papada, brazos). No sustituye a una dieta equilibrada ni al ejercicio físico y no es un tratamiento para la obesidad. Habitualmente se requieren de 1 a 3 sesiones de criolipólisis por zona (separadas 6-8 semanas) o de 6 a 10 sesiones de cavitación (2 por semana).</p>

<h2>3. Cómo se realiza</h2>
<p><strong>Cavitación:</strong> el médico aplica un cabezal de ultrasonidos sobre la zona con gel conductor, realizando movimientos continuos durante 20-30 minutos, habitualmente seguido de drenaje linfático manual o presoterapia. <strong>Criolipólisis:</strong> se coloca un aplicador con succión sobre el pliegue graso durante 35-60 minutos, con sensación inicial de frío intenso que se atenúa por adormecimiento local progresivo.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción progresiva del pliegue graso localizado (20-25 % por sesión de criolipólisis)</li>
  <li>Mejora del contorno corporal sin cirugía ni anestesia</li>
  <li>Sin período de baja laboral</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema, edema y hematomas en la zona (días)</li>
  <li>Sensación de adormecimiento, hormigueo o disestesia transitoria (criolipólisis, hasta varias semanas)</li>
  <li>Dolor o molestia moderada durante y tras la sesión</li>
  <li>Resultado variable según la respuesta individual</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Quemaduras por frío o paniculitis (criolipólisis)</li>
  <li>Hiperpigmentación transitoria</li>
  <li>Induración o nódulos palpables en la zona tratada</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li><strong>Hiperplasia adiposa paradójica</strong>: aumento visible y progresivo del volumen graso en la zona tratada meses después de la criolipólisis, de causa no completamente aclarada, que puede requerir corrección quirúrgica</li>
  <li>Necrosis grasa</li>
  <li>Lesión nerviosa periférica prolongada</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Crioglobulinemia, hemoglobinuria paroxística por frío o urticaria por frío (criolipólisis)</li>
  <li>Hernias en la zona a tratar</li>
  <li>Alteraciones de la sensibilidad cutánea en la zona</li>
  <li>Insuficiencia hepática o renal grave (cavitación, por sobrecarga metabólica de los lípidos liberados)</li>
  <li>Marcapasos o implantes metálicos (cavitación)</li>
  <li>Trastornos de la coagulación</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Hidratación abundante para facilitar la eliminación metabólica de los lípidos</li>
  <li>Actividad física moderada recomendada</li>
  <li>Drenaje linfático o masaje según indicación médica</li>
  <li>Evitar alcohol y comidas copiosas los días posteriores</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Radiofrecuencia, mesoterapia lipolítica, lipólisis inyectable, dieta y ejercicio dirigido, o liposucción quirúrgica en casos de grasa resistente.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 13. PLASMA PEN / FIBROBLAST
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_plasma, 'Plasma Pen / Fibroblast', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Plasma Pen / Fibroblast',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El Plasma Pen (fibroblast therapy) es un dispositivo que genera un arco de plasma (cuarto estado de la materia) mediante ionización del aire entre la punta del dispositivo y la piel, sin llegar a tocarla, produciendo micropuntos de sublimación controlada en la epidermis superficial. Esto provoca una contracción inmediata del tejido y estimula la producción de colágeno y elastina en las semanas siguientes.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Blefaroplastia no quirúrgica (exceso de piel en párpado superior), líneas periorales y peribucales, arrugas finas, flacidez leve-moderada de cuello y escote, cicatrices y estrías. No sustituye a la cirugía en casos de exceso cutáneo severo.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica intensiva (30-45 minutos de aplicación), el médico aplica micropuntos de plasma sobre la zona a tratar, dejando pequeños puntos de carbonización superficial (costras) que se desprenden en 5-7 días. La sesión dura entre 30 y 60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Efecto tensor inmediato y progresivo sin cirugía ni incisiones</li>
  <li>Mejora significativa del exceso cutáneo palpebral</li>
  <li>Estimulación de colágeno con resultados progresivos hasta los 3 meses</li>
  <li>Resultado duradero (varios años)</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Edema, especialmente periorbitario (puede ser marcado los primeros 2-4 días)</li>
  <li>Formación de costras puntiformes (carbon dots) en cada punto de aplicación (5-7 días)</li>
  <li>Eritema prolongado (semanas)</li>
  <li>Dolor o escozor tras el efecto anestésico</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Hiperpigmentación postinflamatoria, especialmente en fototipos altos</li>
  <li>Infección local</li>
  <li>Hipopigmentación en el punto de aplicación</li>
  <li>Milia (pequeños quistes) tras la reepitelización</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Cicatrices permanentes o retráctiles</li>
  <li>Lesión ocular en tratamientos periorbitarios sin protección adecuada</li>
  <li>Discromía permanente</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Fototipos altos (V-VI) — mayor riesgo de discromía, valorar caso por caso</li>
  <li>Infección activa o herpes en la zona</li>
  <li>Tendencia a cicatrices queloides o hipertróficas</li>
  <li>Diabetes descompensada o inmunosupresión</li>
  <li>Exposición solar reciente o bronceado activo</li>
  <li>Uso de isotretinoína oral en los últimos 6 meses</li>
</ul>

<h2>9. Cuidados postprocedimiento (imprescindibles)</h2>
<ul>
  <li>No mojar ni maquillar la zona hasta el desprendimiento completo de las costras</li>
  <li><strong>No despegar ni rascar las costras</strong> bajo ningún concepto: aumenta el riesgo de cicatriz e hiperpigmentación</li>
  <li>Fotoprotección solar estricta (SPF 50+) durante al menos 4-6 semanas</li>
  <li>Aplicar los productos cicatrizantes prescritos por el médico</li>
  <li>Dormir semiincorporado los primeros días si se trata la zona periorbitaria (reduce el edema)</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Blefaroplastia quirúrgica, láser fraccionado ablativo, radiofrecuencia, hilos tensores o toxina botulínica (según la zona).</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 14. PRP FACIAL Y CAPILAR
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_prp, 'Plasma Rico en Plaquetas (PRP) Facial y Capilar', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Plasma Rico en Plaquetas (PRP)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El Plasma Rico en Plaquetas (PRP) es una técnica autóloga que consiste en la extracción de una muestra de sangre del propio paciente, su centrifugación para concentrar las plaquetas y los factores de crecimiento que contienen, y su posterior infiltración en la zona a tratar. Los factores de crecimiento liberados estimulan la regeneración tisular, la neocolagénesis y, en el caso capilar, la actividad del folículo piloso.</p>

<h2>2. Objetivo del tratamiento</h2>
<ul>
  <li><strong>Facial:</strong> mejora de la calidad, textura y luminosidad cutánea, rejuvenecimiento facial, cicatrices de acné, ojeras</li>
  <li><strong>Capilar:</strong> tratamiento de la alopecia androgenética y otras formas de caída del cabello, estimulando el crecimiento y grosor capilar</li>
</ul>
<p>Se recomiendan habitualmente entre 3 y 4 sesiones separadas por 4-6 semanas, con mantenimiento posterior cada 6-12 meses.</p>

<h2>3. Cómo se realiza</h2>
<p>Se extrae una muestra de sangre venosa (10-20 ml habitualmente) que se centrifuga en el propio centro para obtener el concentrado plaquetario. Previa anestesia tópica si se considera necesaria, el médico infiltra el PRP mediante microinyecciones en la zona a tratar (dermis facial o cuero cabelludo). La sesión completa dura entre 45 y 60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora progresiva y natural de la calidad cutánea o de la densidad capilar</li>
  <li>Producto 100 % autólogo: mínimo riesgo de reacción alérgica o rechazo</li>
  <li>Estimulación biológica de la regeneración tisular</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Dolor durante la extracción sanguínea y la infiltración</li>
  <li>Eritema, edema y hematomas en la zona infiltrada (2-5 días)</li>
  <li>Sensación de tensión o pesadez en el cuero cabelludo (uso capilar)</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local en el punto de venopunción o de infiltración</li>
  <li>Mareo o síncope vasovagal durante la extracción</li>
  <li>Resultado subóptimo o ausencia de respuesta</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Hematoma extenso</li>
  <li>Reacción inflamatoria local intensa</li>
  <li>Error en el manejo o etiquetado de la muestra (mitigado por protocolos de identificación del paciente)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Trastornos de la coagulación o plaquetopenia severa</li>
  <li>Enfermedades hematológicas activas</li>
  <li>Infección activa o sepsis</li>
  <li>Tratamiento anticoagulante (valorar caso por caso)</li>
  <li>Cáncer activo</li>
  <li>Anemia severa</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Evitar maquillaje 12-24 horas (uso facial)</li>
  <li>No lavar el cabello con agua muy caliente las primeras 24 horas (uso capilar)</li>
  <li>Evitar exposición solar directa y actividad física intensa 24 horas</li>
  <li>No tomar antiinflamatorios no esteroideos (AINE) los días previos y posteriores salvo indicación médica, ya que pueden interferir con la acción del PRP</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Mesoterapia, skin boosters, minoxidil y finasteride (uso capilar), trasplante capilar, biorrestimuladores o tratamientos tópicos médicos.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 15. HILOS TENSORES (PDO)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_thread, 'Hilos Tensores (PDO)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Hilos Tensores (PDO)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Los hilos tensores son suturas reabsorbibles (habitualmente de polidioxanona, PDO, o ácido poliláctico/policaprolactona) que se insertan en el tejido subcutáneo mediante cánulas o agujas romas, dotadas de espículas o conos bidireccionales que anclan el tejido y producen un efecto de tracción y sujeción inmediato, además de estimular la producción de colágeno alrededor del hilo a medida que este se reabsorbe (6-12 meses según el material).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Lifting no quirúrgico de óvalo facial, cejas, mejillas, papada y cuello. Mejora de la flacidez leve-moderada y redefinición de contornos faciales sin cirugía.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el médico introduce los hilos a través de pequeños puntos de entrada con aguja o cánula, siguiendo vectores de tracción previamente diseñados, y realiza la tracción y anclaje del tejido antes de cortar el sobrante del hilo. El procedimiento dura entre 30 y 60 minutos según el número de hilos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Efecto lifting y redefinición de contornos inmediato</li>
  <li>Estimulación progresiva de colágeno con mejora de la firmeza cutánea</li>
  <li>Alternativa mínimamente invasiva a la cirugía de estiramiento facial</li>
  <li>Duración del efecto entre 12 y 18 meses</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Edema, eritema y hematomas en los puntos de entrada y trayecto del hilo (1-2 semanas)</li>
  <li>Dolor o molestia al masticar, sonreír o mover la zona tratada (días)</li>
  <li>Sensación de tirantez o pequeñas ondulaciones cutáneas transitorias</li>
  <li>Asimetría leve inicial</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Extrusión o exposición del hilo a través de la piel</li>
  <li>Infección en el trayecto del hilo</li>
  <li>Palpación o visibilidad del hilo bajo la piel</li>
  <li>Asimetría persistente que requiera retoque</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Lesión de ramas nerviosas periféricas (parálisis facial transitoria)</li>
  <li>Lesión vascular</li>
  <li>Granuloma de cuerpo extraño</li>
  <li>Migración del hilo</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Enfermedades autoinmunes activas</li>
  <li>Tratamiento anticoagulante (valorar caso por caso)</li>
  <li>Flacidez cutánea severa (candidato preferente a cirugía)</li>
  <li>Hipersensibilidad conocida al material del hilo</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Evitar movimientos faciales bruscos, masajes o tratamientos odontológicos durante 2-4 semanas</li>
  <li>Dormir boca arriba, evitando presión sobre la zona tratada, durante 1-2 semanas</li>
  <li>No frotar ni presionar intensamente la zona</li>
  <li>Evitar actividad física intensa durante 1 semana</li>
  <li>Aplicar frío local los primeros días si hay edema</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>HIFU, radiofrecuencia, rellenos de ácido hialurónico, biorrestimuladores o cirugía de estiramiento facial (ritidectomía).</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 16. LIPÓLISIS INYECTABLE (ÁCIDO DESOXICÓLICO)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_lipo, 'Lipólisis Inyectable (Ácido Desoxicólico)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Lipólisis Inyectable',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La lipólisis inyectable consiste en la infiltración de ácido desoxicólico (un ácido biliar sintético que existe de forma natural en el organismo y que participa en la digestión y absorción de las grasas) directamente en el tejido adiposo subcutáneo. Este producto destruye la membrana de los adipocitos (adipocitolisis), cuyo contenido es posteriormente eliminado por el sistema linfático y metabolizado de forma natural.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducción de la grasa localizada, especialmente indicada para la papada (grasa submentoniana), aunque también se emplea en flancos, rodillas y otras zonas de acúmulo graso localizado y moderado. No es un tratamiento para la obesidad ni sustituye a la liposucción en grandes volúmenes.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica o local, el médico realiza microinyecciones del producto distribuidas de forma homogénea por toda la zona a tratar (rejilla de puntos), respetando estructuras anatómicas de riesgo (nervio marginal mandibular en el caso de la papada). Se requieren habitualmente entre 2 y 4 sesiones separadas por 4-6 semanas. La sesión dura entre 20 y 40 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción progresiva y permanente del volumen graso localizado tratado</li>
  <li>Mejora del contorno y definición del óvalo facial (papada) o de la zona corporal tratada</li>
  <li>Sin necesidad de cirugía ni anestesia general</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Edema marcado en la zona (puede durar de 1 a 3 semanas, especialmente intenso en papada)</li>
  <li>Eritema, hematomas y dolor en la zona de inyección</li>
  <li>Induración o sensación de bultos palpables durante la fase de reabsorción</li>
  <li>Sensación de adormecimiento u hormigueo transitorio</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Asimetría</li>
  <li>Alopecia localizada transitoria en la zona tratada (por edema/presión, en casos de papada)</li>
  <li>Infección local</li>
  <li>Nódulos persistentes</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Lesión del nervio marginal mandibular con paresia de la comisura labial (transitoria, en tratamientos de papada)</li>
  <li>Necrosis cutánea por afectación vascular</li>
  <li>Disfagia u odinofagia transitoria (edema profundo en cuello)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Trastornos de la coagulación</li>
  <li>Hipersensibilidad conocida al ácido desoxicólico</li>
  <li>Alteraciones anatómicas relevantes en la zona (valorar individualmente)</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Aplicar frío local las primeras 24-48 horas para reducir el edema</li>
  <li>Es normal y esperable un edema marcado que puede alterar temporalmente la apariencia — planificar el tratamiento evitando compromisos sociales inmediatos</li>
  <li>Evitar masajear la zona salvo indicación médica</li>
  <li>Mantener la cabeza elevada al dormir los primeros días (papada)</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Mesoterapia lipolítica, criolipólisis, cavitación, radiofrecuencia o liposucción quirúrgica.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 17. CARBOXITERAPIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_carbo, 'Carboxiterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Carboxiterapia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La carboxiterapia consiste en la administración subcutánea de dióxido de carbono (CO₂) medicinal mediante microinyecciones. El gas produce un efecto Bohr local (mayor liberación de oxígeno de la hemoglobina a los tejidos), vasodilatación y neoangiogénesis, mejorando la microcirculación y favoreciendo la lipólisis y la regeneración del tejido conectivo.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de la celulitis, ojeras y bolsas periorbitarias, estrías, flacidez cutánea leve, y mejora de la circulación en zonas con grasa localizada. Se recomiendan habitualmente entre 8 y 15 sesiones, 1-2 por semana.</p>

<h2>3. Cómo se realiza</h2>
<p>El médico infiltra el gas de CO₂ medicinal mediante una aguja fina conectada a un equipo regulador de flujo y presión, en el tejido subcutáneo de la zona a tratar. Se percibe una sensación de distensión y crepitación bajo la piel (enfisema subcutáneo controlado) que se reabsorbe en minutos. La sesión dura entre 15 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la circulación local y el aspecto de la piel de naranja</li>
  <li>Reducción del volumen y mejora de la calidad cutánea en la celulitis</li>
  <li>Mejora de ojeras y estrías con tratamiento continuado</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Enfisema subcutáneo (crepitación palpable), que se reabsorbe en minutos u horas</li>
  <li>Equimosis y hematomas en los puntos de inyección</li>
  <li>Dolor o molestia leve-moderada durante la infiltración</li>
  <li>Sensación de distensión o tirantez en la zona</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local</li>
  <li>Reacción vasovagal durante el procedimiento</li>
  <li>Enfisema subcutáneo prolongado o extenso</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Embolia gaseosa (extremadamente rara con equipos médicos calibrados y técnica correcta)</li>
  <li>Necrosis cutánea</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedad pulmonar obstructiva crónica (EPOC) grave o insuficiencia respiratoria</li>
  <li>Insuficiencia cardíaca o cardiopatía grave</li>
  <li>Trastornos graves de la coagulación</li>
  <li>Infección activa en la zona</li>
  <li>Gangrena o vasculopatía periférica severa</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Hidratación adecuada</li>
  <li>Actividad física ligera recomendada para favorecer la circulación</li>
  <li>Evitar prendas muy ajustadas en la zona tratada el mismo día</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Mesoterapia, radiofrecuencia, presoterapia, drenaje linfático manual o cavitación.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 18. MICROAGUJAS / DERMAPEN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_micro, 'Microagujas / Dermapen', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Microagujas / Dermapen',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La terapia de microagujas (microneedling o dermapen) utiliza un dispositivo con múltiples agujas muy finas que crean microperforaciones controladas en la epidermis y dermis superficial, desencadenando una respuesta natural de reparación de la piel (liberación de factores de crecimiento y estimulación de colágeno y elastina), sin destrucción térmica del tejido. Puede combinarse con la aplicación de PRP o principios activos tópicos.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora de cicatrices de acné, poros dilatados, arrugas finas, estrías, textura irregular y flacidez leve. Se recomiendan habitualmente entre 3 y 6 sesiones separadas por 4 semanas.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa aplicación de anestesia tópica (30-45 minutos), el médico desliza el dispositivo de microagujas sobre la piel a la profundidad indicada (0,5-2,5 mm según la zona e indicación), pudiendo aplicar PRP o sérums específicos inmediatamente después de las microperforaciones. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora progresiva de cicatrices, textura y poros</li>
  <li>Estimulación natural de colágeno sin daño térmico</li>
  <li>Apto para todos los fototipos cutáneos, con bajo riesgo de discromía</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema tipo quemadura solar durante 24-72 horas</li>
  <li>Sensación de tirantez o descamación fina los días posteriores</li>
  <li>Pequeños puntos de sangrado durante el procedimiento</li>
  <li>Sequedad cutánea transitoria</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local</li>
  <li>Hiperpigmentación postinflamatoria</li>
  <li>Reacción alérgica a los productos tópicos aplicados tras el procedimiento</li>
  <li>Formación de milia</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Cicatrices (por técnica inadecuada o infección no tratada)</li>
  <li>Reactivación de herpes simple diseminada</li>
  <li>Granulomas por productos tópicos inadecuados infiltrados con las agujas</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo (valorar caso por caso)</li>
  <li>Infección activa, herpes o acné inflamatorio agudo en la zona</li>
  <li>Tendencia a cicatrices queloides</li>
  <li>Tratamiento con isotretinoína oral en los últimos 6 meses</li>
  <li>Trastornos de la coagulación no controlados</li>
  <li>Enfermedades cutáneas activas (psoriasis, eccema en la zona)</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Evitar maquillaje durante 24 horas</li>
  <li>Fotoprotección solar estricta (SPF 50+) durante 2 semanas</li>
  <li>No exponerse a piscinas, saunas o agua muy caliente 48 horas</li>
  <li>Aplicar únicamente los productos reparadores recomendados por el médico</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Peelings químicos, láser fraccionado, PRP, mesoterapia o radiofrecuencia fraccionada.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 19. MICROPIGMENTACIÓN DE CEJAS (MICROBLADING)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_ceja, 'Micropigmentación de Cejas (Microblading)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Micropigmentación de Cejas',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La micropigmentación de cejas (microblading o técnica de pelo a pelo) es una técnica de maquillaje semipermanente que consiste en la implantación de pigmento en la dermis superficial mediante una fina cuchilla compuesta por múltiples microagujas o un dispositivo de rotación (máquina de micropigmentación), dibujando trazos que simulan el vello natural de la ceja.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corrección estética de cejas escasas, asimétricas o despobladas (por depilación excesiva, alopecia, quimioterapia u otras causas), aportando definición, densidad y simetría de forma semipermanente (duración de 1 a 3 años según el tipo de piel y técnica).</p>

<h2>3. Cómo se realiza</h2>
<p>Tras el diseño y perfilado de la ceja consensuado con la paciente, y la aplicación de anestesia tópica, el profesional implanta el pigmento en la dermis papilar mediante trazos finos que imitan el pelo natural. Se realiza habitualmente una sesión inicial y una sesión de retoque a las 4-6 semanas para ajustar color e intensidad. La sesión dura entre 90 y 150 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resultado natural que simula pelo a pelo</li>
  <li>Ahorro de tiempo en la rutina diaria de maquillaje</li>
  <li>Corrección de asimetrías y aporte de densidad</li>
  <li>Duración semipermanente de 1 a 3 años</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema y edema leve en la zona (24-48 horas)</li>
  <li>Costras superficiales muy finas durante la cicatrización (5-7 días)</li>
  <li>El color resultará más intenso los primeros días y se aclarará durante la cicatrización (hasta un 30-40 %)</li>
  <li>Molestias o escozor leve durante el procedimiento</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local por cuidados postprocedimiento inadecuados</li>
  <li>Reacción alérgica al pigmento</li>
  <li>Pérdida prematura o irregular del pigmento</li>
  <li>Asimetría o resultado no satisfactorio que requiera corrección</li>
  <li>Cambios de tonalidad del pigmento con el tiempo (viraje a tonos rojizos o azulados)</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Cicatrices o queloides</li>
  <li>Granulomas por cuerpo extraño</li>
  <li>Reacción alérgica sistémica grave</li>
  <li>Transmisión de infecciones por incumplimiento de protocolos de bioseguridad (mitigado mediante material estéril de un solo uso)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo y lactancia</li>
  <li>Diabetes descompensada</li>
  <li>Trastornos de la coagulación o tratamiento anticoagulante no controlado</li>
  <li>Enfermedades cutáneas activas en la zona (dermatitis, psoriasis)</li>
  <li>Hipersensibilidad conocida a pigmentos o anestésicos tópicos</li>
  <li>Tratamiento con isotretinoína oral reciente</li>
  <li>Tendencia a cicatrices queloides</li>
  <li>Infección activa (herpes, etc.) en la zona</li>
</ul>

<h2>9. Cuidados postprocedimiento (imprescindibles)</h2>
<ul>
  <li>No mojar la zona durante las primeras 24 horas</li>
  <li>Aplicar la pomada cicatrizante prescrita según pauta</li>
  <li>No exponerse al sol, piscina, sauna o gimnasio durante 7-10 días</li>
  <li><strong>No rascar ni despegar las costras</strong>: puede provocar pérdida irregular del pigmento y cicatrices</li>
  <li>Evitar maquillaje en la zona hasta la cicatrización completa</li>
  <li>Acudir a la sesión de retoque programada para optimizar el resultado final</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Maquillaje convencional diario, tinte de cejas, extensiones de pelo a pelo no permanentes, o trasplante de cejas (en casos de alopecia extensa).</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 20. PEELING QUÍMICO ESTÉTICO (SUPERFICIAL)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_peelest, 'Peeling Químico Estético (Superficial)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Peeling Químico Estético',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El peeling químico estético consiste en la aplicación de agentes exfoliantes de baja concentración (ácido glicólico, ácido mandélico, ácido láctico, ácido salicílico u otros alfa/beta-hidroxiácidos en concentraciones cosméticas) sobre la capa más superficial de la epidermis, favoreciendo la renovación celular y mejorando el aspecto general de la piel. A diferencia del peeling químico médico (de profundidad media o profunda), este procedimiento actúa exclusivamente a nivel epidérmico superficial.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora de la luminosidad y textura cutánea, reducción de imperfecciones superficiales, control del exceso de sebo y poro dilatado, prevención del envejecimiento cutáneo y preparación de la piel para tratamientos posteriores. Se recomiendan habitualmente entre 4 y 8 sesiones separadas por 1-2 semanas.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa limpieza y desengrasado de la piel, se aplica el agente exfoliante de forma homogénea con pincel, gasa o algodón durante el tiempo indicado según el producto y la tolerancia cutánea, neutralizándose posteriormente si el protocolo lo requiere. La sesión dura entre 20 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Renovación celular suave y progresiva</li>
  <li>Mejora de la luminosidad, textura y uniformidad del tono de la piel</li>
  <li>Sin tiempo de recuperación significativo</li>
  <li>Compatible con rutinas de mantenimiento periódico</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema leve y sensación de tirantez (horas)</li>
  <li>Sensación de calor o escozor durante la aplicación</li>
  <li>Descamación fina en los días posteriores</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Hiperpigmentación postinflamatoria transitoria, especialmente en pieles con exposición solar reciente</li>
  <li>Irritación o dermatitis de contacto</li>
  <li>Reactivación de herpes labial</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Quemadura química por aplicación incorrecta o tiempo de exposición excesivo</li>
  <li>Reacción alérgica al producto</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia (valorar con el médico)</li>
  <li>Piel con heridas, infección activa, herpes o dermatitis en la zona</li>
  <li>Exposición solar reciente o bronceado activo</li>
  <li>Hipersensibilidad conocida a alguno de los componentes</li>
  <li>Uso de isotretinoína oral en los últimos 6 meses</li>
  <li>Rosácea inflamatoria activa (valorar caso por caso)</li>
</ul>
<p><strong>Nota importante:</strong> este procedimiento se limita a peelings de profundidad superficial. Ante cualquier indicio de necesitar un peeling de profundidad media o profunda (manchas resistentes, cicatrices de acné marcadas, fotoenvejecimiento avanzado), la clínica derivará a valoración médica para el Peeling Químico Médico.</p>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Fotoprotección solar diaria (SPF 50+) durante el tratamiento y las semanas siguientes</li>
  <li>No exfoliar la piel ni usar productos irritantes adicionales entre sesiones</li>
  <li>Hidratación cutánea reforzada</li>
  <li>Evitar exposición solar directa las 24-48 horas siguientes</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Peeling químico médico (profundidad media/profunda), microdermoabrasión, microagujas, o tratamientos cosméticos tópicos de mantenimiento.</p>

' || v_img || v_declaracion
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
