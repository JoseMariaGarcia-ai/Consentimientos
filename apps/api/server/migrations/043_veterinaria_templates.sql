-- Consentimientos informados de Veterinaria — Legalidad española
-- Conforme a: Ley 7/2023 de protección de los derechos y el bienestar de los
-- animales · Código Deontológico veterinario · RGPD (UE) 2016/679 ·
-- LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Veterinaria
--
-- Diferencia clave frente al resto de categorías: quien firma no es el
-- "paciente" (el animal no tiene capacidad legal para consentir), sino
-- su responsable/propietario/a. La base legal tampoco es la Ley 41/2002
-- (exclusiva de pacientes humanos), sino la normativa de bienestar animal
-- y el código deontológico veterinario.

DO $$
DECLARE
  v_esteril UUID := '10000005-0000-0000-0000-000000000001';
  v_cirgen  UUID := '10000005-0000-0000-0000-000000000002';
  v_anest   UUID := '10000005-0000-0000-0000-000000000003';
  v_limdent UUID := '10000005-0000-0000-0000-000000000004';
  v_extdent UUID := '10000005-0000-0000-0000-000000000005';
  v_eutan   UUID := '10000005-0000-0000-0000-000000000006';
  v_vacuna  UUID := '10000005-0000-0000-0000-000000000007';
  v_chip    UUID := '10000005-0000-0000-0000-000000000008';
  v_ortop   UUID := '10000005-0000-0000-0000-000000000009';
  v_tumor   UUID := '10000005-0000-0000-0000-000000000010';
  v_cesarea UUID := '10000005-0000-0000-0000-000000000011';
  v_imagen  UUID := '10000005-0000-0000-0000-000000000012';
  v_hospit  UUID := '10000005-0000-0000-0000-000000000013';
  v_legal   JSONB;
  v_img     TEXT;
BEGIN

  v_legal := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 7/2023, de 28 de marzo, de protección de los derechos y el bienestar de los animales, y Código Deontológico de la profesión veterinaria",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 18,
      "witnessRequired": false,
      "retentionYears": 5,
      "introText": "De conformidad con el Código Deontológico veterinario, usted tiene derecho a recibir información completa, comprensible y veraz sobre el procedimiento propuesto para su animal antes de decidir si autoriza o no su realización.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del procedimiento, sin que ello suponga perjuicio alguno en la atención veterinaria que se preste al animal.",
      "dataClause": "Sus datos personales serán tratados por esta clínica veterinaria con la finalidad exclusiva de gestionar su ficha como responsable del animal y la historia clínica de este, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014, por el/la responsable legal del animal."
    }
  }'::JSONB;

  v_img := '<h2>10. Sesión de imágenes (fotografías y/o vídeos)</h2>
<p>Como parte del seguimiento clínico de este procedimiento, el equipo veterinario podrá realizar fotografías y/o vídeos del animal antes, durante y después del mismo, con el fin de documentar su estado y valorar la evolución. Estas imágenes forman parte de la historia clínica del animal, con el mismo nivel de confidencialidad que el resto de su documentación, conforme al RGPD (UE) 2016/679 y la LOPDGDD 3/2018.</p>
<p>El uso de estas imágenes con fines distintos al seguimiento clínico (formativos, científicos, publicitarios o de difusión) requiere su autorización expresa, específica y separada como responsable del animal, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención veterinaria que reciba el animal:</p>
<ul>
  <li>☐ Autorizo el uso de imágenes de mi animal con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia).</li>
  <li>☐ Autorizo el uso de imágenes de mi animal con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica).</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del responsable del animal</h2>
<p>El/La abajo firmante declara ser responsable legal del animal descrito, haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al equipo veterinario y haberlas recibido contestadas de forma satisfactoria. Autoriza voluntariamente la realización del procedimiento descrito, conociendo que puede revocar esta autorización en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. ESTERILIZACIÓN / CASTRACIÓN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_esteril, 'Esterilización / Castración', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Esterilización / Castración',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica bajo anestesia general que consiste en la extirpación de los órganos reproductores: ovariohisterectomía (extirpación de ovarios y útero) en hembras u orquiectomía (extirpación testicular) en machos.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Evitar la reproducción no deseada, prevenir enfermedades del aparato reproductor (piometra, tumores mamarios, testiculares o prostáticos), y reducir determinados comportamientos asociados al celo o al instinto reproductivo.</p>

<h2>3. Cómo se realiza</h2>
<p>Previo ayuno indicado, el animal recibe anestesia general y, si procede, analgesia preventiva. El equipo veterinario realiza la intervención quirúrgica en quirófano bajo monitorización de constantes vitales. La duración varía entre 20 y 90 minutos según especie, sexo y tamaño del animal.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación del riesgo de gestaciones no deseadas</li>
  <li>Prevención de patologías del aparato reproductor a medio-largo plazo</li>
  <li>Reducción de comportamientos asociados al celo (marcaje, agresividad, fugas)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y molestia en la zona de la incisión durante varios días</li>
  <li>Somnolencia y disminución del apetito en las horas posteriores a la anestesia</li>
  <li>Posible aumento de peso a medio plazo si no se ajusta la alimentación tras la intervención</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la anestesia general (reacción adversa, complicación cardiorrespiratoria), minimizados con valoración preanestésica</li>
  <li>Hemorragia intra o postoperatoria</li>
  <li>Infección de la herida quirúrgica</li>
  <li>Dehiscencia (apertura) de la sutura, especialmente si el animal se lame o muerde la zona</li>
  <li>Incontinencia urinaria a largo plazo (infrecuente, más descrita en hembras de razas grandes)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Animal con patología sistémica descompensada que contraindique la anestesia general (valorar con analítica preanestésica)</li>
  <li>Gestación avanzada (valorar riesgo/beneficio de forma individualizada)</li>
  <li>Edad o estado de salud no aptos según valoración veterinaria</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Uso del collar isabelino o prenda postquirúrgica indicada para evitar que el animal se lama la herida, reposo relativo durante 7-10 días, control de la herida a diario, y acudir a la revisión de retirada de puntos si no son reabsorbibles.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Métodos anticonceptivos no quirúrgicos (de eficacia y seguridad limitadas a largo plazo), o no intervenir, asumiendo el riesgo reproductivo y de patologías asociadas del aparato reproductor no esterilizado.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. CIRUGÍA GENERAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_cirgen, 'Cirugía General', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Cirugía General',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica bajo anestesia general para resolver una patología que lo requiera (extracción de cuerpo extraño digestivo, herniorrafia, cierre de heridas complejas, u otra indicación quirúrgica no clasificada en un procedimiento específico).</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Resolver quirúrgicamente la patología diagnosticada, según la indicación específica comunicada verbalmente por el equipo veterinario para el caso concreto del animal.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa valoración preanestésica, el animal recibe anestesia general y el equipo veterinario realiza la intervención en quirófano bajo monitorización continua de constantes vitales. La duración y técnica varían según la patología a tratar.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resolución de la patología que motiva la cirugía</li>
  <li>Alivio de los síntomas asociados (dolor, obstrucción, disfunción del órgano afectado)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, dolor y molestia postoperatoria en la zona intervenida</li>
  <li>Somnolencia y disminución del apetito tras la anestesia</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la anestesia general, minimizados con valoración preanestésica y monitorización</li>
  <li>Hemorragia intra o postoperatoria</li>
  <li>Infección de la herida quirúrgica</li>
  <li>Dehiscencia de sutura</li>
  <li>Complicaciones específicas derivadas de la patología concreta a tratar, que el equipo veterinario detallará de forma individualizada antes de la intervención</li>
  <li>Necesidad de reintervención si la resolución no es completa</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica descompensada que contraindique la anestesia general</li>
  <li>Estado del animal no apto para cirugía según valoración veterinaria (a estabilizar previamente si es posible)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Uso de collar isabelino o prenda postquirúrgica si se indica, reposo relativo, control de la herida, cumplimiento de la pauta de medicación prescrita, y acudir a las revisiones programadas.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento médico conservador si la patología lo permite, u otra técnica quirúrgica alternativa, según valoración individualizada del caso por el equipo veterinario.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. ANESTESIA GENERAL / SEDACIÓN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_anest, 'Anestesia General / Sedación', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Anestesia General / Sedación',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Administración de fármacos anestésicos o sedantes para inducir un estado de inconsciencia (anestesia general) o de relajación con disminución de la respuesta a estímulos (sedación), necesario para realizar procedimientos diagnósticos o terapéuticos de forma segura y sin estrés ni dolor para el animal.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Permitir la realización de exploraciones, curas, pruebas diagnósticas o intervenciones que requieran inmovilidad, ausencia de dolor o de estrés en el animal.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa valoración preanestésica (exploración física y, si procede, analítica sanguínea), el equipo veterinario administra el protocolo anestésico/sedante más adecuado según especie, edad, peso y estado de salud del animal, con monitorización continua de constantes vitales durante todo el procedimiento y la recuperación.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Realización del procedimiento sin dolor ni estrés para el animal</li>
  <li>Inmovilidad y seguridad necesarias para procedimientos diagnósticos o quirúrgicos</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Somnolencia y desorientación durante la recuperación</li>
  <li>Disminución transitoria del apetito y la actividad</li>
  <li>Temblores o hipotermia leve durante la recuperación (control con manta térmica)</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Riesgo anestésico</strong>: aunque infrecuente con protocolos y monitorización adecuados, existe un riesgo inherente de complicación cardiorrespiratoria grave, mayor en animales geriátricos, con patología previa o de razas braquicéfalas</li>
  <li>Reacción alérgica a alguno de los fármacos empleados</li>
  <li>Regurgitación o aspiración (minimizado con el ayuno previo indicado)</li>
  <li>Recuperación prolongada o excitación paradójica en la fase de despertar</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología cardiorrespiratoria o sistémica severa no controlada (valorar riesgo/beneficio)</li>
  <li>Incumplimiento del ayuno indicado (riesgo de regurgitación, salvo procedimiento urgente)</li>
  <li>Alergia conocida a los fármacos anestésicos habituales (valorar protocolo alternativo)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener al animal en un lugar tranquilo y templado durante la recuperación, reintroducir el agua y la comida de forma progresiva según indicación veterinaria, y vigilar la aparición de vómitos, letargia excesiva o dificultad respiratoria en las horas siguientes, contactando con la clínica si aparecen.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Contención física sin fármacos (solo viable en procedimientos muy breves y animales colaboradores), o posponer el procedimiento si el riesgo anestésico se considera desproporcionado para el caso concreto.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. LIMPIEZA DENTAL CON ANESTESIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_limdent, 'Limpieza Dental con Anestesia', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Limpieza Dental con Anestesia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Eliminación profesional de placa bacteriana y sarro (cálculo dental) mediante ultrasonidos, seguida de pulido dental, realizada bajo anestesia general para permitir una limpieza completa y segura, incluida la zona subgingival.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Prevención y tratamiento de la enfermedad periodontal, eliminación del mal aliento asociado, y preservación de la salud bucodental del animal a largo plazo.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa valoración preanestésica, el animal recibe anestesia general y el equipo veterinario realiza la limpieza con ultrasonidos por encima y por debajo de la línea de la encía, pulido dental, y una exploración completa de la cavidad oral para detectar posibles piezas afectadas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación de la placa y el cálculo dental</li>
  <li>Reducción de la inflamación gingival y el mal aliento</li>
  <li>Detección precoz de patología dental oculta bajo sedación (imposible de valorar completamente en consulta con el animal despierto)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Molestia leve en la cavidad oral tras el procedimiento</li>
  <li>Ligero sangrado gingival durante la limpieza en encías inflamadas</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la anestesia general (ver consentimiento específico de anestesia)</li>
  <li>Hallazgo durante la exploración de piezas dentales que requieran extracción, en cuyo caso se contactará con el responsable si no se ha autorizado previamente</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia general</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Dieta blanda los primeros días si se han realizado extracciones, y seguimiento de la pauta de higiene dental de mantenimiento recomendada (cepillado, dieta específica o productos dentales) para prolongar el resultado.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Higiene dental doméstica de mantenimiento (insuficiente por sí sola si ya existe cálculo formado), o limpieza sin anestesia (desaconsejada por la profesión veterinaria: no permite limpieza subgingival ni es segura para el animal).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. EXTRACCIÓN DENTAL VETERINARIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_extdent, 'Extracción Dental Veterinaria', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extracción Dental Veterinaria',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Extracción quirúrgica, bajo anestesia general, de una o varias piezas dentales no viables por enfermedad periodontal avanzada, fractura, reabsorción dental u otra patología.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Eliminar el foco de dolor o infección asociado a la(s) pieza(s) dental(es) afectada(s), mejorando el bienestar y la salud bucodental del animal.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general, el equipo veterinario extrae la(s) pieza(s) afectada(s), pudiendo requerir la elevación de un colgajo gingival y sutura posterior según la complejidad. La duración depende del número de piezas y su localización.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación del dolor y la infección asociados a la pieza afectada</li>
  <li>Mejora del bienestar general y del apetito del animal</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y molestia en la zona durante varios días</li>
  <li>Sangrado leve postoperatorio</li>
  <li>Dificultad transitoria para comer alimento duro</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la anestesia general</li>
  <li>Fractura radicular que complique la extracción</li>
  <li>Infección postoperatoria</li>
  <li>Comunicación oronasal en extracciones de piezas superiores (infrecuente)</li>
  <li>Fractura mandibular en extracciones complejas de animales con hueso muy debilitado por enfermedad periodontal severa (raro, más descrito en razas pequeñas con patología avanzada)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia general</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Dieta blanda durante 7-10 días, evitar juguetes duros o masticables durante la cicatrización, y cumplir la pauta de analgesia y/o antibiótico prescrita.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento periodontal conservador si la pieza es recuperable, o mantenimiento con revisiones si no hay indicación urgente de extracción.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. EUTANASIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_eutan, 'Eutanasia', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Eutanasia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La eutanasia es el acto veterinario mediante el cual se pone fin a la vida de un animal de forma indolora y humanitaria, mediante la administración de fármacos específicos que inducen primero una sedación profunda y, a continuación, el cese de la función cardiorrespiratoria.</p>

<h2>2. Justificación del procedimiento</h2>
<p>Conforme a la Ley 7/2023, de protección de los derechos y el bienestar de los animales, la eutanasia debe realizarse por causa justificada, habitualmente por motivos de salud, bienestar o sufrimiento del animal, valorados y documentados por el equipo veterinario junto con el/la responsable. La causa concreta que motiva esta decisión ha sido explicada verbalmente por el equipo veterinario.</p>

<h2>3. Cómo se realiza</h2>
<p>El equipo veterinario administra en primer lugar una sedación profunda para asegurar que el animal esté completamente inconsciente y libre de dolor o ansiedad, y a continuación un fármaco eutanásico específico por vía intravenosa que produce el cese de la función cardíaca y respiratoria de forma rápida e indolora. El equipo confirmará el fallecimiento antes de finalizar el procedimiento.</p>

<h2>4. Consideraciones para el/la responsable</h2>
<ul>
  <li>Se le informará, si lo desea, sobre la posibilidad de acompañar al animal durante el procedimiento</li>
  <li>El proceso es irreversible una vez iniciado</li>
  <li>Puede solicitar información sobre las opciones de despedida y gestión de los restos (entierro, cremación individual o colectiva) antes de proceder</li>
</ul>

<h2>5. Efectos que pueden observarse durante el procedimiento</h2>
<ul>
  <li>Movimientos musculares reflejos o suspiros tras el fallecimiento, que no indican consciencia ni sufrimiento</li>
  <li>Relajación de esfínteres, un efecto fisiológico normal tras el fallecimiento</li>
</ul>

<h2>6. Alternativas consideradas</h2>
<p>Antes de tomar esta decisión, se han valorado con el/la responsable las alternativas terapéuticas o paliativas disponibles para la situación clínica del animal, así como el pronóstico y la calidad de vida esperada, confirmando que la eutanasia es la opción considerada más adecuada para el bienestar del animal en las circunstancias actuales.</p>

<h2>7. Gestión de los restos</h2>
<p>El/la responsable indicará su decisión sobre la gestión de los restos del animal (cremación individual, cremación colectiva, u otra opción disponible en la clínica), quedando reflejada por separado en el servicio correspondiente.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 7. VACUNACIÓN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_vacuna, 'Vacunación', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Vacunación',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Administración de una o varias vacunas mediante inyección, destinadas a estimular el sistema inmunitario del animal frente a enfermedades infecciosas relevantes según su especie, edad, estilo de vida y zona geográfica.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Prevenir enfermedades infecciosas graves (parvovirosis, moquillo, rabia, leucemia felina, entre otras según especie y protocolo vacunal indicado), protegiendo la salud individual del animal y contribuyendo a la salud pública en el caso de zoonosis como la rabia.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa exploración física para confirmar que el animal está sano en el momento de la vacunación, el equipo veterinario administra la(s) vacuna(s) por vía subcutánea o intramuscular, según el protocolo correspondiente a la edad y el calendario vacunal del animal.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Protección frente a enfermedades infecciosas graves, algunas de ellas potencialmente mortales</li>
  <li>Cumplimiento de la normativa vigente en el caso de vacunas obligatorias (p. ej., rabia, según normativa autonómica)</li>
  <li>Requisito habitual para el acceso a residencias, guarderías, viajes o exposiciones</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia local, inflamación leve o pequeño bulto en el punto de inyección durante unos días</li>
  <li>Decaimiento leve o disminución del apetito en las 24-48 horas siguientes</li>
  <li>Febrícula transitoria</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Reacción alérgica o anafiláctica</strong> (infrecuente, pero puede requerir atención veterinaria urgente; se recomienda observar al animal en la clínica durante los minutos posteriores a la vacunación)</li>
  <li>Sarcoma en el punto de inyección (extremadamente infrecuente, descrito principalmente en gatos)</li>
  <li>Reacción local más intensa (absceso estéril) en casos aislados</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Enfermedad activa o fiebre en el momento de la vacunación (se pospondrá hasta la recuperación)</li>
  <li>Reacción alérgica grave conocida a vacunaciones previas</li>
  <li>Inmunosupresión severa (valorar individualmente)</li>
  <li>Gestación, según el tipo de vacuna (valorar con el equipo veterinario)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Evitar ejercicio intenso y contacto con otros animales no vacunados en las 24-48 horas siguientes (especialmente en cachorros con pauta incompleta), y contactar con la clínica si se observa decaimiento intenso, vómitos, hinchazón facial o dificultad respiratoria.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Valoración mediante serología (titulación de anticuerpos) en lugar de revacunación sistemática para determinadas vacunas, según criterio veterinario; no vacunar implica asumir el riesgo de contraer las enfermedades que se pretenden prevenir.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 8. MICROCHIP DE IDENTIFICACIÓN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_chip, 'Microchip de Identificación', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Microchip de Identificación',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Implantación subcutánea de un microchip de identificación electrónica, normalizado y homologado, que contiene un código único de identificación del animal, de acuerdo con la normativa vigente de identificación animal.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Identificación permanente e inequívoca del animal, obligatoria por normativa en perros, gatos y hurones (y recomendable en otras especies), que facilita su recuperación en caso de pérdida o robo y es requisito para el registro censal, pasaporte y viajes.</p>

<h2>3. Cómo se realiza</h2>
<p>El equipo veterinario implanta el microchip mediante una inyección subcutánea, habitualmente en la zona del cuello, con un aplicador estéril de un solo uso. El procedimiento es rápido (segundos) y no requiere anestesia, aunque puede realizarse aprovechando otra intervención bajo anestesia si el animal ya la requiere por otro motivo.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Identificación permanente e inalterable del animal</li>
  <li>Cumplimiento de la normativa de identificación y registro obligatorios</li>
  <li>Facilita la recuperación del animal en caso de pérdida</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia breve en el momento de la implantación, similar a una inyección</li>
  <li>Pequeño bulto palpable transitorio en el punto de implantación</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Migración del microchip desde el punto de implantación original (infrecuente, no afecta a su funcionamiento ni lectura)</li>
  <li>Infección local en el punto de implantación (excepcional con técnica aséptica)</li>
  <li>Fallo de lectura del microchip (muy infrecuente con dispositivos homologados)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>No existen contraindicaciones relevantes salvo infección activa en la zona de implantación habitual</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>No se requieren cuidados especiales; se recomienda comprobar la correcta lectura del microchip en la propia consulta tras la implantación.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>No existe alternativa equivalente de identificación permanente; el tatuaje identificativo ha quedado en desuso frente al microchip por su mayor fiabilidad y permanencia.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 9. CIRUGÍA ORTOPÉDICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ortop, 'Cirugía Ortopédica (Fractura / Ligamento Cruzado)', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Cirugía Ortopédica',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica bajo anestesia general para la reparación de una lesión del sistema musculoesquelético: fractura ósea (mediante fijación interna con placas/tornillos o fijación externa) o rotura del ligamento cruzado craneal (mediante técnica extracapsular o de osteotomía correctora, según indicación).</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Restaurar la estabilidad y funcionalidad de la articulación o hueso afectado, aliviar el dolor asociado, y prevenir complicaciones a largo plazo como la artrosis secundaria.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general y con apoyo de estudios de imagen previos (radiografía), el equipo veterinario realiza la reparación quirúrgica mediante la técnica más adecuada al caso (osteosíntesis, técnica extracapsular, osteotomía, u otra), con monitorización continua durante la intervención. La duración varía según la complejidad, habitualmente entre 45 y 120 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Restauración de la estabilidad y función del miembro afectado</li>
  <li>Alivio del dolor asociado a la lesión</li>
  <li>Prevención de artrosis secundaria y compensaciones posturales en otras extremidades</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, dolor y cojera durante el postoperatorio y el periodo de recuperación (semanas)</li>
  <li>Atrofia muscular del miembro durante la fase de reposo, recuperable con fisioterapia progresiva</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la anestesia general</li>
  <li>Infección del implante quirúrgico (placa, tornillos, sutura de sujeción)</li>
  <li>Fallo o rotura del material de osteosíntesis, especialmente si no se respeta el reposo indicado</li>
  <li>Retardo o ausencia de consolidación ósea (no unión)</li>
  <li>Rotura del ligamento cruzado contralateral en el futuro (predisposición conocida en la patología de ligamento cruzado)</li>
  <li>Artrosis progresiva a largo plazo, en menor grado que sin tratamiento quirúrgico</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia general</li>
  <li>Estado del animal no apto para cirugía según valoración veterinaria</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Reposo estricto según el periodo indicado (habitualmente 6-8 semanas, con restricción progresiva de actividad), control radiográfico de la evolución, fisioterapia de rehabilitación si se recomienda, y uso de collar isabelino si es necesario para evitar que el animal se lama la herida.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento conservador (reposo, antiinflamatorios, fisioterapia) en casos seleccionados de menor gravedad o cuando la cirugía no sea viable, con resultado funcional habitualmente inferior al quirúrgico en fracturas inestables o rotura de ligamento cruzado.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 10. EXTIRPACIÓN DE TUMORES / BIOPSIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_tumor, 'Extirpación de Tumores / Biopsia', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extirpación de Tumores / Biopsia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica bajo anestesia general (o sedación profunda, según localización y tamaño) para la extirpación completa o parcial (biopsia) de una masa o tumoración, con el fin de su análisis histopatológico y/o tratamiento definitivo.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Obtener un diagnóstico histopatológico preciso de la naturaleza de la masa (benigna o maligna) y, cuando sea posible, su extirpación completa con márgenes de seguridad adecuados como tratamiento definitivo.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general, el equipo veterinario extirpa la masa completa (exéresis) o una porción representativa de la misma (biopsia incisional), remitiendo la muestra a un laboratorio de anatomía patológica para su análisis. La duración depende del tamaño y localización de la lesión.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Diagnóstico histopatológico definitivo de la naturaleza de la masa</li>
  <li>Eliminación de la tumoración cuando la extirpación es completa</li>
  <li>Base para planificar tratamientos complementarios si el resultado histológico lo requiere (quimioterapia, radioterapia, ampliación de márgenes)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y molestia postoperatoria en la zona intervenida</li>
  <li>Hematoma local</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la anestesia general o sedación</li>
  <li>Márgenes de extirpación incompletos, especialmente en tumores infiltrantes, pudiendo requerir una segunda intervención de ampliación según el resultado histopatológico</li>
  <li>Infección de la herida quirúrgica</li>
  <li>Dehiscencia de sutura</li>
  <li>Resultado histopatológico de malignidad, que puede requerir tratamiento oncológico complementario y modificar el pronóstico del animal</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia</li>
  <li>Extensión de la enfermedad (metástasis) que haga desaconsejable la cirugía sin estudio de extensión previo, según valoración veterinaria</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Uso de collar isabelino, control de la herida, cumplimiento de la pauta de analgesia prescrita, y acudir a la revisión donde se comunicará el resultado histopatológico y, si procede, se planificará el tratamiento complementario.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Punción con aguja fina (citología) como primera aproximación diagnóstica menos invasiva pero menos concluyente que la biopsia, seguimiento sin intervención (con el riesgo de progresión si la masa es maligna), o derivación a un centro especializado en oncología veterinaria según el caso.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 11. CESÁREA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_cesarea, 'Cesárea', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Cesárea',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica de urgencia o programada, bajo anestesia general, que consiste en la extracción de las crías a través de una incisión en el abdomen y el útero, indicada cuando el parto natural no es posible o supone un riesgo para la madre y/o las crías.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Resolver una distocia (dificultad de parto) o realizar una cesárea programada por indicación específica (razas braquicéfalas, camada única de gran tamaño, antecedente de cesárea previa, entre otras), preservando la vida y el bienestar de la madre y de las crías.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general (con protocolo ajustado para minimizar el paso de fármacos a las crías), el equipo veterinario realiza una incisión abdominal y uterina para extraer a las crías, que son reanimadas de inmediato por personal auxiliar mientras se completa la cirugía en la madre, incluyendo la esterilización si así se ha acordado previamente.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Resolución segura del parto cuando la vía natural no es posible o es de alto riesgo</li>
  <li>Mayor tasa de supervivencia de las crías respecto a un parto distócico no resuelto a tiempo</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y molestia postoperatoria en la madre</li>
  <li>Recuperación de las crías: puede requerir maniobras de reanimación (estimulación, aspiración de vías respiratorias)</li>
  <li>Somnolencia y sedación leve transitoria en las crías por el paso de fármacos anestésicos</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la anestesia general, con consideraciones específicas por la gestación</li>
  <li>Hemorragia intraoperatoria (mayor riesgo que en cirugía abdominal no gestacional)</li>
  <li><strong>Mortalidad neonatal</strong> de una o varias crías, especialmente si la cirugía se realiza de urgencia tras distocia prolongada</li>
  <li>Infección postoperatoria</li>
  <li>Complicaciones futuras en la capacidad reproductiva de la madre si no se esteriliza en el mismo acto</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>No aplica en sentido estricto al ser habitualmente un procedimiento de urgencia vital; se valorará el riesgo/beneficio individualizado en cada caso</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Vigilancia estrecha de la madre y las crías en las horas posteriores, favorecer el inicio de la lactancia lo antes posible, control de la herida quirúrgica, y contactar con la clínica ante cualquier signo de alarma en la madre o las crías.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Parto natural asistido (solo si es clínicamente viable y no hay signos de distocia grave), o inducción farmacológica del parto en casos seleccionados, según valoración veterinaria del riesgo para la madre y las crías.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 12. DIAGNÓSTICO POR IMAGEN CON SEDACIÓN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_imagen, 'Diagnóstico por Imagen con Sedación (Radiografía/Ecografía)', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Diagnóstico por Imagen con Sedación',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Realización de pruebas de diagnóstico por imagen (radiografía, ecografía u otra técnica) que requieren sedación del animal para garantizar la inmovilidad necesaria, obtener imágenes de calidad diagnóstica y evitar el estrés o dolor asociado a la manipulación.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Obtener imágenes diagnósticas de calidad para valorar el estado de los órganos, huesos o tejidos blandos del animal, en un contexto en el que la contención sin fármacos no sea viable o segura (dolor, agresividad, necesidad de posiciones forzadas).</p>

<h2>3. Cómo se realiza</h2>
<p>El equipo veterinario administra una sedación de intensidad ajustada al procedimiento (leve a profunda) para inmovilizar al animal el tiempo necesario para obtener las imágenes, con monitorización de sus constantes durante el proceso y la recuperación.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Imágenes diagnósticas de mayor calidad y precisión</li>
  <li>Procedimiento sin dolor ni estrés para el animal</li>
  <li>Mayor seguridad para el personal durante la manipulación</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Somnolencia y desorientación durante la recuperación</li>
  <li>Disminución transitoria del apetito</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Riesgos inherentes a la sedación (ver consentimiento específico de anestesia/sedación)</li>
  <li>Necesidad de repetir la prueba si la sedación es insuficiente para la inmovilidad requerida</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica severa no controlada que desaconseje la sedación (valorar riesgo/beneficio frente a la necesidad diagnóstica)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener al animal en un lugar tranquilo hasta la recuperación completa de la sedación, y reintroducir agua y comida de forma progresiva según indicación veterinaria.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Realización de la prueba sin sedación si el animal lo permite con seguridad (calidad de imagen habitualmente inferior), u otra técnica diagnóstica alternativa según el caso clínico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 13. HOSPITALIZACIÓN / FLUIDOTERAPIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_hospit, 'Hospitalización / Fluidoterapia', 'veterinaria', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Hospitalización / Fluidoterapia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Ingreso del animal en las instalaciones de la clínica para su observación, monitorización y/o tratamiento continuado, que puede incluir fluidoterapia intravenosa (administración de sueros) para corregir o prevenir la deshidratación y apoyar la función de los órganos.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Proporcionar cuidados y monitorización continuada que no serían posibles de forma ambulatoria, corregir alteraciones hidroelectrolíticas, administrar medicación intravenosa, y realizar un seguimiento estrecho de la evolución del animal.</p>

<h2>3. Cómo se realiza</h2>
<p>El animal permanece ingresado en el área de hospitalización, con colocación de un catéter intravenoso para la administración de fluidos y/o medicación, y monitorización periódica de sus constantes vitales según la pauta indicada por el equipo veterinario. La duración del ingreso dependerá de la evolución clínica.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Corrección de la deshidratación y las alteraciones hidroelectrolíticas</li>
  <li>Monitorización continua de la evolución clínica</li>
  <li>Administración de tratamientos que requieren vía intravenosa</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Estrés asociado a la separación del entorno habitual y del/de la responsable</li>
  <li>Inflamación leve o hematoma en el punto de colocación del catéter</li>
  <li>Disminución del apetito durante el ingreso, habitual en animales hospitalizados</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Sobrecarga de fluidos en animales con patología cardíaca o renal, minimizada con ajuste individualizado del ritmo de infusión</li>
  <li>Flebitis o infección en el punto de venopunción</li>
  <li>Evolución desfavorable de la patología de base pese al tratamiento, cuya causa es la propia enfermedad y no el procedimiento de hospitalización en sí</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>No aplica en sentido estricto; el ritmo y tipo de fluidoterapia se ajustan individualmente según la patología de base del animal</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Tras el alta, seguir la pauta de medicación y dieta indicada, y acudir a las revisiones de control programadas para valorar la evolución tras el ingreso.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento ambulatorio con fluidoterapia subcutánea o medicación oral en casos leves que no requieran monitorización continua, según valoración veterinaria de la gravedad del cuadro clínico.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
