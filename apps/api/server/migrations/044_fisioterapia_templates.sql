-- Consentimientos informados de Fisioterapia — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Fisioterapia (el/la fisioterapeuta es personal sanitario
-- colegiado, mismo marco legal que Medicina Estética/Odontología/Capilar).

DO $$
DECLARE
  v_manual  UUID := '10000006-0000-0000-0000-000000000001';
  v_puncion UUID := '10000006-0000-0000-0000-000000000002';
  v_electro UUID := '10000006-0000-0000-0000-000000000003';
  v_ondas   UUID := '10000006-0000-0000-0000-000000000004';
  v_ejerc   UUID := '10000006-0000-0000-0000-000000000005';
  v_respir  UUID := '10000006-0000-0000-0000-000000000006';
  v_neuro   UUID := '10000006-0000-0000-0000-000000000007';
  v_kines   UUID := '10000006-0000-0000-0000-000000000008';
  v_deport  UUID := '10000006-0000-0000-0000-000000000009';
  v_drenaje UUID := '10000006-0000-0000-0000-000000000010';
  v_pelvico UUID := '10000006-0000-0000-0000-000000000011';
  v_miofasc UUID := '10000006-0000-0000-0000-000000000012';
  v_hidro   UUID := '10000006-0000-0000-0000-000000000013';
  v_pediat  UUID := '10000006-0000-0000-0000-000000000014';
  v_epte    UUID := '10000006-0000-0000-0000-000000000015';
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
      "dataClause": "Sus datos personales y de salud serán tratados por este centro con la finalidad exclusiva de gestionar su historia clínica de fisioterapia, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>10. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo de fisioterapia podrá realizar fotografías y/o vídeos de la zona tratada o de la ejecución de los ejercicios, antes, durante y después del proceso, con el fin de documentar el estado funcional previo y valorar la evolución. Estos registros forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>El registro con fines de seguimiento clínico no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible salvo que sea clínicamente relevante.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales del centro), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito al centro, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al equipo de fisioterapia y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del tratamiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. FISIOTERAPIA MANUAL / TERAPIA MANUAL ORTOPÉDICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_manual, 'Fisioterapia Manual / Terapia Manual Ortopédica', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fisioterapia Manual',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Conjunto de técnicas manuales aplicadas por el/la fisioterapeuta sobre articulaciones, músculos y tejidos blandos (movilizaciones articulares, manipulaciones, masoterapia, estiramientos) para el tratamiento de disfunciones del aparato locomotor.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir el dolor, mejorar la movilidad articular, disminuir la tensión muscular y restaurar la función normal de la zona afectada.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta aplica las técnicas manuales indicadas según la valoración previa, ajustando la intensidad a la tolerancia del paciente. La sesión dura entre 30 y 60 minutos, con un número de sesiones variable según la evolución.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del dolor y la tensión muscular</li>
  <li>Mejora de la movilidad articular</li>
  <li>Recuperación funcional de la zona tratada</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia o dolor leve-moderado durante o tras la sesión (24-48 horas)</li>
  <li>Sensación de cansancio o agujetas en la zona tratada</li>
  <li>Enrojecimiento cutáneo transitorio</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Empeoramiento transitorio de los síntomas tras la manipulación (infrecuente, generalmente autolimitado)</li>
  <li>Lesión de tejidos blandos por técnica de alta velocidad en pacientes con fragilidad ósea no detectada</li>
  <li>Complicaciones vasculares en manipulaciones cervicales de alta velocidad (extremadamente infrecuente, se realiza cribado previo de factores de riesgo)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Fracturas recientes no consolidadas en la zona a tratar</li>
  <li>Osteoporosis severa o fragilidad ósea no controlada</li>
  <li>Procesos infecciosos o inflamatorios agudos en la zona</li>
  <li>Patología vascular no controlada (especialmente relevante en técnicas cervicales)</li>
  <li>Neoplasia activa en la zona a tratar</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Aplicar frío o calor local según indicación, evitar esfuerzos intensos en las horas siguientes, e informar al fisioterapeuta de cualquier molestia inusual antes de la siguiente sesión.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Electroterapia, ejercicio terapéutico, punción seca, u otras técnicas de fisioterapia según la valoración individual del caso.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. PUNCIÓN SECA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_puncion, 'Punción Seca', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Punción Seca',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica invasiva de fisioterapia que consiste en la introducción de una aguja de acupuntura (sin infiltrar ninguna sustancia) en puntos gatillo miofasciales u otras estructuras musculares, con el fin de provocar una respuesta de relajación de la fibra muscular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Desactivar puntos gatillo miofasciales causantes de dolor referido, tensión muscular y limitación funcional.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta localiza el punto gatillo mediante palpación e introduce la aguja estéril de un solo uso hasta obtener una respuesta de espasmo local. La sesión dura entre 15 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del dolor miofascial y la tensión muscular</li>
  <li>Mejora de la movilidad y la función muscular</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor local durante y después de la punción (24-72 horas), similar a una agujeta intensa</li>
  <li>Pequeño hematoma en el punto de punción</li>
  <li>Sensación de mareo leve o vasovagal durante la técnica (infrecuente pero conocido, se realiza en posición segura)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Neumotórax</strong>: en punciones de la musculatura torácica o cervical baja, riesgo infrecuente pero grave, minimizado con técnica y anatomía adecuadas</li>
  <li>Lesión nerviosa o vascular en la zona de punción</li>
  <li>Infección local (excepcional con técnica aséptica y material estéril de un solo uso)</li>
  <li>Síncope vasovagal</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Fobia a las agujas no controlada</li>
  <li>Coagulopatías no controladas o tratamiento anticoagulante (valorar)</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Embarazo (contraindicado en determinados puntos, valorar con el fisioterapeuta)</li>
  <li>Linfedema en la extremidad a tratar</li>
  <li>Menores de edad (salvo valoración específica y autorización de tutor legal)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Aplicar calor local si hay molestia, mantener hidratación adecuada, evitar ejercicio intenso el mismo día, y esperar la resolución de la posible agujeta en 1-3 días.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Terapia manual, electroterapia, o estiramientos, con eficacia habitualmente menor sobre el punto gatillo específico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. ELECTROTERAPIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_electro, 'Electroterapia (TENS, Corrientes Interferenciales)', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Electroterapia',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Aplicación de corrientes eléctricas terapéuticas de baja o media frecuencia (TENS, corrientes interferenciales, entre otras) mediante electrodos sobre la piel, con fines analgésicos o de estimulación muscular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir el dolor, disminuir la inflamación, o estimular la musculatura según el tipo de corriente y protocolo empleado.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta coloca los electrodos en la zona a tratar y ajusta la intensidad de la corriente de forma progresiva y tolerable. La sesión dura entre 15 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del dolor mediante mecanismos de modulación nerviosa</li>
  <li>Efecto antiinflamatorio y relajante muscular según el tipo de corriente</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Sensación de hormigueo o contracción muscular durante la aplicación</li>
  <li>Enrojecimiento cutáneo leve en la zona de los electrodos</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Irritación o quemadura cutánea leve por mal contacto del electrodo o intensidad excesiva</li>
  <li>Reacción alérgica al gel conductor o al adhesivo del electrodo</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Portadores de marcapasos, desfibrilador u otros dispositivos electrónicos implantados</li>
  <li>Embarazo (contraindicado en zona abdominal/lumbar)</li>
  <li>Epilepsia</li>
  <li>Heridas abiertas, infecciones cutáneas o dermatitis activa en la zona</li>
  <li>Trombosis venosa profunda o problemas circulatorios activos en la zona</li>
  <li>Zonas con sensibilidad cutánea alterada (riesgo de quemadura no percibida)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; comunicar al fisioterapeuta cualquier molestia o irritación cutánea persistente.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Terapia manual, ejercicio terapéutico, u otras modalidades físicas (calor, frío, ultrasonido terapéutico) según el objetivo del tratamiento.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. TERAPIA CON ONDAS DE CHOQUE
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ondas, 'Terapia con Ondas de Choque (Shockwave)', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Terapia con Ondas de Choque',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica que aplica ondas acústicas de alta energía sobre tejidos con patología crónica (tendinopatías, fascitis, puntos gatillo), con el fin de estimular los procesos naturales de curación y reducir el dolor.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de tendinopatías crónicas (epicondilitis, tendinopatía rotuliana, fascitis plantar, tendinopatía de Aquiles, entre otras), estimulando la regeneración tisular y reduciendo el dolor crónico.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta aplica el cabezal del equipo con gel conductor sobre la zona a tratar, administrando los impulsos de onda de choque a la intensidad tolerada por el paciente. La sesión dura entre 10 y 20 minutos, con un protocolo habitual de 3-5 sesiones semanales.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del dolor crónico en tendinopatías resistentes a otros tratamientos</li>
  <li>Estimulación de la regeneración del tejido tendinoso</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor durante la aplicación, proporcional a la intensidad empleada</li>
  <li>Enrojecimiento y sensibilidad en la zona tratada durante 24-48 horas</li>
  <li>Empeoramiento transitorio del dolor tras la sesión (efecto esperado, mejora en días)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Hematoma o petequias en la zona tratada</li>
  <li>Rotura tendinosa en tendones muy debilitados (extremadamente infrecuente, se valora el estado del tendón previamente)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo</li>
  <li>Trastornos de la coagulación o tratamiento anticoagulante</li>
  <li>Tumores en la zona a tratar</li>
  <li>Infección activa en la zona</li>
  <li>Aplicación sobre zonas de crecimiento óseo en niños (cartílagos de crecimiento)</li>
  <li>Marcapasos (en aplicaciones próximas al tórax)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar esfuerzos intensos con la zona tratada las 48 horas siguientes, aplicar frío local si hay molestia, y mantener el programa completo de sesiones para valorar correctamente el resultado.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Terapia manual, ejercicio excéntrico, electroterapia, o infiltraciones (tratamiento médico) según indicación.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. EJERCICIO TERAPÉUTICO / REEDUCACIÓN FUNCIONAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ejerc, 'Ejercicio Terapéutico / Reeducación Funcional', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Ejercicio Terapéutico',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Programa individualizado de ejercicios activos y/o asistidos, dirigido por el/la fisioterapeuta, orientado a la recuperación de la fuerza, movilidad, control motor y funcionalidad tras una lesión, cirugía o patología musculoesquelética.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar la fuerza, la movilidad y el control motor de la zona afectada, prevenir recidivas y devolver al paciente a su nivel de actividad previo o al máximo funcional posible.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta diseña y supervisa un programa progresivo de ejercicios adaptado a la fase de recuperación del paciente, con reevaluaciones periódicas para ajustar la carga y progresión. La duración del programa varía según el objetivo, desde varias semanas hasta meses.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Recuperación de la fuerza y la movilidad</li>
  <li>Mejora del control motor y la estabilidad</li>
  <li>Reducción del riesgo de recidiva de la lesión</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Fatiga muscular o agujetas tras las sesiones, especialmente al inicio del programa</li>
  <li>Molestia leve durante la progresión de cargas</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Reagudización de la lesión si la progresión de ejercicios no se respeta o el paciente realiza el ejercicio de forma incorrecta fuera de sesión</li>
  <li>Lesión de otra estructura por sobrecarga compensatoria</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Fase aguda de inflamación o lesión no estabilizada según criterio del fisioterapeuta</li>
  <li>Patología cardiovascular no controlada que contraindique el ejercicio (valorar autorización médica)</li>
  <li>Fracturas no consolidadas en la zona a movilizar</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Realizar los ejercicios domiciliarios pautados con la técnica indicada, respetar los tiempos de descanso entre sesiones, y comunicar cualquier dolor inusual o que no mejore con el reposo habitual.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Terapia manual, electroterapia u otras modalidades pasivas como complemento, aunque el ejercicio terapéutico activo es habitualmente la base del tratamiento a medio-largo plazo en la mayoría de patologías musculoesqueléticas.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. FISIOTERAPIA RESPIRATORIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_respir, 'Fisioterapia Respiratoria', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fisioterapia Respiratoria',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Conjunto de técnicas manuales e instrumentales (drenaje de secreciones, ejercicios de expansión torácica, reeducación diafragmática, entre otras) dirigidas a mejorar la función respiratoria del paciente.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Facilitar la eliminación de secreciones bronquiales, mejorar la ventilación pulmonar, y optimizar el patrón respiratorio en patologías respiratorias agudas o crónicas.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta aplica técnicas manuales de drenaje postural, percusión/vibración torácica, y ejercicios respiratorios activos, adaptados a la edad y patología del paciente. La sesión dura entre 20 y 40 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora del drenaje de secreciones y la ventilación</li>
  <li>Reducción de la disnea y mejora de la tolerancia al esfuerzo</li>
  <li>Prevención de complicaciones respiratorias (atelectasias, infecciones)</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Tos productiva aumentada durante y después de la sesión (efecto esperado y buscado)</li>
  <li>Fatiga tras la sesión</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Desaturación transitoria de oxígeno durante técnicas intensas en pacientes con patología respiratoria severa (monitorizado en pacientes de riesgo)</li>
  <li>Broncoespasmo reactivo en pacientes con hiperreactividad bronquial</li>
  <li>Fractura costal en pacientes con osteoporosis severa durante técnicas de percusión (extremadamente infrecuente, se ajusta la técnica al estado óseo)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Neumotórax no drenado</li>
  <li>Hemoptisis activa (sangrado por vías respiratorias)</li>
  <li>Inestabilidad hemodinámica o respiratoria aguda no controlada</li>
  <li>Fracturas costales recientes no consolidadas (para técnicas de percusión)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Hidratación adecuada para favorecer la fluidificación de secreciones, continuar los ejercicios respiratorios pautados en domicilio, y contactar con el equipo si aparece dificultad respiratoria significativa.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Dispositivos de presión espiratoria positiva (PEP) de uso domiciliario como complemento, según indicación del equipo médico/fisioterapéutico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 7. FISIOTERAPIA NEUROLÓGICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_neuro, 'Fisioterapia Neurológica', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fisioterapia Neurológica',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Conjunto de técnicas específicas de neurorrehabilitación (facilitación neuromuscular, reeducación del equilibrio y la marcha, estimulación sensoriomotora, entre otras) dirigidas a pacientes con afectación del sistema nervioso central o periférico.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Recuperar o compensar la función motora, el equilibrio y la marcha afectados por la patología neurológica (ictus, lesión medular, esclerosis múltiple, Parkinson, u otra), mejorando la autonomía funcional del paciente.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta aplica un programa individualizado de técnicas de neurorrehabilitación, adaptado a la fase y el pronóstico de la patología, con reevaluaciones periódicas del progreso funcional. Las sesiones duran entre 30 y 60 minutos, con una frecuencia y duración de tratamiento variables según el caso.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora o mantenimiento de la función motora, el equilibrio y la marcha</li>
  <li>Mayor autonomía en las actividades de la vida diaria</li>
  <li>Prevención de complicaciones secundarias (contracturas, caídas, atrofia por desuso)</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Fatiga tras la sesión, habitual en patología neurológica</li>
  <li>Molestia muscular por el esfuerzo del ejercicio</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Caídas</strong> durante ejercicios de equilibrio o marcha, minimizado con supervisión directa y medidas de seguridad (barras, cinturón de marcha)</li>
  <li>Descompensación de la patología de base (crisis, alteración de la tensión arterial) durante el esfuerzo, en pacientes con comorbilidad no estabilizada</li>
  <li>Progresión limitada o ausencia de mejoría, dependiente del pronóstico propio de la patología neurológica de base y no del tratamiento en sí</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Inestabilidad médica aguda no controlada (crisis epiléptica reciente no controlada, inestabilidad cardiovascular)</li>
  <li>Fase aguda no estabilizada de la patología neurológica, salvo indicación específica de movilización precoz</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Continuar los ejercicios domiciliarios pautados con las medidas de seguridad indicadas, adaptar el entorno del hogar según las recomendaciones para prevenir caídas, y mantener la continuidad del tratamiento, especialmente relevante en patología neurológica crónica.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Terapia ocupacional complementaria, logopedia si hay afectación asociada, o dispositivos de ayuda técnica (bastones, andadores, órtesis) según el grado de afectación funcional.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 8. VENDAJE NEUROMUSCULAR (KINESIOTAPING)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_kines, 'Vendaje Neuromuscular (Kinesiotaping)', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Vendaje Neuromuscular (Kinesiotaping)',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Aplicación de una cinta elástica adhesiva (kinesiotape) sobre la piel, siguiendo patrones específicos, con el fin de proporcionar soporte muscular o articular, favorecer el drenaje o modular la percepción del dolor, sin restringir el movimiento.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Complementar otras técnicas de fisioterapia proporcionando soporte muscular/articular, favoreciendo el drenaje de edemas, o modulando la percepción del dolor durante la actividad diaria entre sesiones.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta aplica la cinta con la tensión y el patrón específico según el objetivo terapéutico, sobre piel limpia y seca. El vendaje puede mantenerse colocado entre 3 y 5 días.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Soporte muscular/articular sin restricción de movimiento</li>
  <li>Efecto complementario en el manejo del dolor y el edema</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Picor o sensación de tirantez leve en la piel</li>
  <li>Marca cutánea temporal al retirar la cinta</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Reacción alérgica o dermatitis de contacto al adhesivo</li>
  <li>Irritación cutánea si se mantiene colocado más tiempo del recomendado o en pieles muy sensibles</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alergia conocida a adhesivos</li>
  <li>Heridas abiertas, infecciones cutáneas o dermatitis activa en la zona</li>
  <li>Trombosis venosa profunda en la zona de aplicación</li>
  <li>Piel muy frágil (edad avanzada, tratamiento con corticoides tópicos prolongado)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar frotar la zona al ducharse, secar sin frotar tras el contacto con agua, y retirar la cinta con cuidado, en dirección del crecimiento del vello, si aparece irritación.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Vendaje funcional convencional, ortesis de soporte, u otras técnicas de fisioterapia sin uso de cinta adhesiva.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 9. FISIOTERAPIA DEPORTIVA / READAPTACIÓN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_deport, 'Fisioterapia Deportiva / Readaptación', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fisioterapia Deportiva',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Programa de tratamiento y readaptación físico-deportiva dirigido a deportistas, que combina técnicas de fisioterapia con ejercicios progresivos de readaptación específicos del gesto deportivo, orientado a la vuelta segura a la actividad tras una lesión.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Recuperar la funcionalidad completa tras una lesión deportiva y preparar al deportista para el retorno seguro a su actividad, minimizando el riesgo de recidiva.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta diseña un programa progresivo que combina técnicas manuales, ejercicio terapéutico y trabajo específico del gesto deportivo, con criterios objetivos de progresión (tests funcionales) antes de autorizar cada fase de vuelta a la actividad.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Recuperación funcional completa orientada al deporte específico</li>
  <li>Reducción del riesgo de recidiva mediante progresión controlada</li>
  <li>Vuelta a la competición con criterios objetivos de seguridad</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Fatiga muscular tras las sesiones de mayor intensidad</li>
  <li>Molestia durante la progresión de cargas específicas del deporte</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Recidiva de la lesión si se fuerza la progresión sin cumplir los criterios funcionales establecidos</li>
  <li>Lesión de otra estructura por sobrecarga compensatoria durante el proceso de readaptación</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Lesión no estabilizada o en fase aguda según criterio del fisioterapeuta</li>
  <li>Falta de autorización médica para el ejercicio de alta intensidad cuando esté clínicamente indicada</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Respetar estrictamente la progresión y los criterios de paso de fase establecidos, no adelantar la vuelta a la competición sin autorización, y mantener el trabajo preventivo indicado tras el alta.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Reposo deportivo prolongado sin readaptación específica (mayor riesgo de recidiva o pérdida de condición física al volver), o derivación a medicina deportiva si se requiere valoración médica complementaria.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 10. DRENAJE LINFÁTICO TERAPÉUTICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_drenaje, 'Drenaje Linfático Terapéutico', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Drenaje Linfático Terapéutico',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica manual específica de fisioterapia dirigida al tratamiento de linfedemas y edemas de origen médico o postquirúrgico (p. ej., tras cirugía de mama con vaciamiento ganglionar), distinta del drenaje de finalidad estética.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir el volumen del linfedema o edema, prevenir su progresión, y mejorar la sintomatología asociada (pesadez, tensión, limitación funcional), habitualmente como parte de una terapia descongestiva compleja que incluye vendaje compresivo y ejercicios.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta realiza maniobras manuales específicas siguiendo el trayecto de los colectores linfáticos, habitualmente combinadas con vendaje multicapa compresivo y ejercicios descongestivos. El tratamiento inicial suele ser intensivo (varias sesiones semanales) seguido de una fase de mantenimiento.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción del volumen del edema/linfedema</li>
  <li>Mejora de la sintomatología asociada y la funcionalidad de la extremidad</li>
  <li>Prevención de complicaciones (fibrosis, infecciones de repetición)</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Necesidad de orinar con mayor frecuencia tras la sesión (efecto esperado del drenaje)</li>
  <li>Cansancio tras el tratamiento</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Molestia por la compresión del vendaje si se aplica con tensión excesiva</li>
  <li>Reacción cutánea al material del vendaje compresivo</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección activa (celulitis, erisipela) en la extremidad afectada — se pospone hasta su resolución</li>
  <li>Insuficiencia cardíaca descompensada</li>
  <li>Trombosis venosa profunda activa</li>
  <li>Neoplasia activa no controlada en la zona (valorar con el equipo médico oncológico)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener el vendaje o prenda de compresión indicada, elevar la extremidad afectada cuando sea posible, cuidar la piel para prevenir infecciones, y mantener el programa de ejercicios descongestivos pautado.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Presoterapia médica, prendas de compresión sin drenaje manual, o tratamiento quirúrgico en casos seleccionados de linfedema avanzado, según valoración del equipo médico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 11. FISIOTERAPIA DE SUELO PÉLVICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_pelvico, 'Fisioterapia de Suelo Pélvico', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fisioterapia de Suelo Pélvico',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Valoración y tratamiento especializado de la musculatura del suelo pélvico, que puede incluir valoración manual externa e interna (vaginal o rectal, con consentimiento específico previo a cada tipo de valoración), biofeedback, electroestimulación y ejercicios específicos.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratar disfunciones del suelo pélvico como incontinencia urinaria o fecal, dolor pélvico, prolapsos, o preparación/recuperación del suelo pélvico en el periodo perinatal.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta realiza una valoración inicial (externa y, si es necesario y se autoriza expresamente, interna) para diseñar un plan de tratamiento individualizado que puede combinar ejercicios de Kegel, biofeedback, electroestimulación y terapia manual. <strong>La valoración o tratamiento por vía interna (vaginal/rectal) requiere siempre autorización expresa y específica del paciente, quien puede rechazarla optando por técnicas exclusivamente externas.</strong></p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora del control y la fuerza de la musculatura del suelo pélvico</li>
  <li>Reducción de los episodios de incontinencia</li>
  <li>Mejora del dolor pélvico y la función sexual asociada en casos seleccionados</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia leve durante la valoración manual, especialmente en la modalidad interna</li>
  <li>Fatiga muscular tras los ejercicios específicos</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Malestar emocional asociado a la naturaleza íntima de la valoración/tratamiento, por lo que se garantiza en todo momento la posibilidad de detener la sesión</li>
  <li>Irritación local con el uso de electroestimulación intracavitaria</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Infección genitourinaria activa (para la valoración/tratamiento por vía interna)</li>
  <li>Embarazo, según la técnica y el trimestre (valorar individualmente)</li>
  <li>Negativa del paciente a la valoración/tratamiento por vía interna, en cuyo caso se ofrecerá abordaje exclusivamente externo</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Realizar los ejercicios domiciliarios pautados con la técnica correcta, y comunicar cualquier molestia o duda al fisioterapeuta antes de la siguiente sesión.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento exclusivamente con técnicas externas y ejercicios si el paciente no autoriza la valoración/tratamiento interno, o derivación a valoración médica (urología/ginecología) si se considera necesario.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 12. TERAPIA MANUAL MIOFASCIAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_miofasc, 'Terapia Manual Miofascial', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Terapia Manual Miofascial',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnicas manuales específicas dirigidas al sistema fascial (tejido conectivo que envuelve músculos y órganos), mediante presiones mantenidas, deslizamientos y estiramientos, con el fin de liberar restricciones de movilidad del tejido fascial.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir restricciones de movilidad del tejido fascial, disminuir el dolor asociado a patrones de tensión miofascial, y mejorar la calidad del movimiento global.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta aplica presiones mantenidas y técnicas de deslizamiento sobre las cadenas miofasciales relacionadas con la disfunción, ajustando la intensidad a la tolerancia del paciente. La sesión dura entre 30 y 60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción de la tensión y el dolor miofascial</li>
  <li>Mejora de la movilidad y la calidad del movimiento</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia o dolor durante y después de la técnica, transitorio (24-48 horas)</li>
  <li>Enrojecimiento cutáneo en la zona tratada</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Hematoma en pieles sensibles o con fragilidad capilar</li>
  <li>Empeoramiento transitorio de los síntomas tras la sesión (infrecuente, autolimitado)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Procesos infecciosos o inflamatorios agudos en la zona</li>
  <li>Trombosis venosa profunda</li>
  <li>Fracturas recientes no consolidadas en la zona a tratar</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Hidratación adecuada, evitar esfuerzos intensos en las horas siguientes, y aplicar calor local si hay molestia.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Terapia manual ortopédica convencional, punción seca, o ejercicio terapéutico, según el objetivo del tratamiento.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 13. HIDROTERAPIA / FISIOTERAPIA ACUÁTICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_hidro, 'Hidroterapia / Fisioterapia Acuática', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Hidroterapia / Fisioterapia Acuática',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento de fisioterapia realizado en el medio acuático (piscina terapéutica climatizada), aprovechando las propiedades físicas del agua (flotabilidad, resistencia, presión hidrostática) para facilitar el movimiento con menor carga articular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Facilitar la movilización y el ejercicio terapéutico en pacientes para quienes el ejercicio en tierra es doloroso o limitado, mejorando la fuerza, la movilidad y la función con menor impacto articular.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta dirige la sesión dentro de la piscina terapéutica, con ejercicios y técnicas adaptadas al medio acuático y a la patología del paciente. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Ejercicio con menor carga e impacto articular</li>
  <li>Mejora de la fuerza, la movilidad y la función</li>
  <li>Efecto relajante y analgésico del agua caliente</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Fatiga tras la sesión, mayor de lo esperado por el esfuerzo cardiovascular añadido del medio acuático</li>
  <li>Piel reseca o irritada por el cloro del agua</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Mareo o hipotensión por el calor del agua, especialmente al salir de la piscina</li>
  <li>Reacción alérgica al cloro u otros productos de tratamiento del agua</li>
  <li>Riesgo de infección en heridas abiertas no correctamente protegidas</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Heridas abiertas no cicatrizadas o infecciones cutáneas activas</li>
  <li>Incontinencia urinaria/fecal no controlada</li>
  <li>Patología cardiovascular severa no controlada (el agua caliente exige mayor esfuerzo cardíaco)</li>
  <li>Fiebre o infección activa</li>
  <li>Epilepsia no controlada (valorar supervisión adicional)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Ducharse tras la sesión para retirar el cloro, hidratar la piel, y descansar adecuadamente dado el mayor esfuerzo cardiovascular del ejercicio en agua caliente.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Ejercicio terapéutico en seco adaptado a baja carga, si el medio acuático no está disponible o contraindicado.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 14. FISIOTERAPIA PEDIÁTRICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_pediat, 'Fisioterapia Pediátrica', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fisioterapia Pediátrica',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Valoración y tratamiento de fisioterapia adaptado a niños y niñas, dirigido a trastornos del desarrollo motor, patología musculoesquelética, respiratoria o neurológica propia de la edad pediátrica.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Favorecer el desarrollo motor adecuado, tratar alteraciones posturales o musculoesqueléticas, y abordar patología respiratoria o neurológica pediátrica mediante técnicas y juegos terapéuticos adaptados a la edad del menor.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta emplea técnicas manuales suaves, ejercicios y actividades lúdicas adaptadas a la edad y capacidad de colaboración del menor, con la participación activa de los padres/tutores en la sesión y en las pautas domiciliarias. La duración y frecuencia de las sesiones se adapta a cada caso.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Estimulación y mejora del desarrollo motor</li>
  <li>Corrección o mejora de alteraciones posturales o musculoesqueléticas</li>
  <li>Mejora de la función respiratoria en patología respiratoria pediátrica</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Llanto o rechazo inicial del menor a la manipulación, especialmente en las primeras sesiones</li>
  <li>Molestia leve durante técnicas de movilización</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Lesión de tejidos blandos por manipulación en técnicas mal toleradas (infrecuente, técnica adaptada a la fragilidad pediátrica)</li>
  <li>Falta de colaboración del menor que limite la eficacia de determinadas técnicas, requiriendo adaptación del enfoque terapéutico</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Procesos infecciosos o inflamatorios agudos en la zona a tratar</li>
  <li>Fracturas recientes no consolidadas</li>
  <li>Patología sistémica descompensada que contraindique el ejercicio</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Realizar los ejercicios o pautas domiciliarias indicadas por el fisioterapeuta con la supervisión de los padres/tutores, y mantener la constancia y regularidad del tratamiento, especialmente relevante en el desarrollo motor infantil.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Seguimiento del desarrollo sin intervención si la alteración es leve y de resolución espontánea esperable, o derivación a otros especialistas (pediatría, neuropediatría) si se considera necesario.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 15. ELECTRÓLISIS PERCUTÁNEA TERAPÉUTICA (EPTE)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_epte, 'Electrólisis Percutánea Terapéutica (EPTE)', 'fisioterapia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Electrólisis Percutánea Terapéutica (EPTE)',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Técnica invasiva de fisioterapia que combina la punción ecoguiada con la aplicación de una corriente galvánica de baja intensidad a través de una aguja, generando un proceso electroquímico local que estimula la regeneración del tejido tendinoso o muscular dañado.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de tendinopatías crónicas y lesiones musculares mediante la estimulación de los procesos de reparación tisular en el tejido diana, localizado con ayuda de ecografía.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la fisioterapeuta localiza la lesión mediante ecografía y aplica la corriente galvánica a través de una aguja de punción seca sobre el tejido diana, con la intensidad y tiempo de aplicación ajustados al caso. La sesión dura entre 15 y 30 minutos, con un protocolo habitual de varias sesiones separadas por 1-2 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Estimulación del proceso de regeneración del tejido tendinoso/muscular dañado</li>
  <li>Reducción del dolor crónico asociado a la lesión</li>
  <li>Localización precisa de la lesión mediante control ecográfico</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor durante y después de la aplicación, más intenso que en la punción seca convencional</li>
  <li>Hematoma en el punto de punción</li>
  <li>Inflamación local durante 24-72 horas (parte del proceso terapéutico buscado)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Quemadura eléctrica local por mal contacto o intensidad excesiva (infrecuente con técnica y equipo adecuados)</li>
  <li>Lesión nerviosa o vascular en la zona de punción</li>
  <li>Infección local (excepcional con técnica aséptica)</li>
  <li>Síncope vasovagal durante la técnica</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Portadores de marcapasos u otros dispositivos electrónicos implantados</li>
  <li>Embarazo</li>
  <li>Coagulopatías no controladas o tratamiento anticoagulante</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Fobia a las agujas no controlada</li>
  <li>Menores de edad (salvo valoración específica y autorización de tutor legal)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Aplicar frío local las primeras 24-48 horas, evitar esfuerzo intenso de la zona tratada durante 48-72 horas, y mantener el programa completo de sesiones para valorar correctamente el resultado.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Punción seca convencional, terapia con ondas de choque, o tratamiento conservador con ejercicio excéntrico y terapia manual.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
