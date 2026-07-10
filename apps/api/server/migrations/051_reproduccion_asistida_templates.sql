-- Consentimientos informados de Reproducción Asistida — Legalidad española
-- Conforme a: Ley 14/2006, de 26 de mayo, sobre técnicas de reproducción
-- humana asistida · Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018
-- (los datos genéticos son categoría especial de datos, art. 9 RGPD) ·
-- eIDAS 910/2014
-- Categoría: Reproducción Asistida

DO $$
DECLARE
  v_ia      UUID := '10000011-0000-0000-0000-000000000001';
  v_fiv     UUID := '10000011-0000-0000-0000-000000000002';
  v_vitrif  UUID := '10000011-0000-0000-0000-000000000003';
  v_donacion UUID := '10000011-0000-0000-0000-000000000004';
  v_legal   JSONB;
  v_img     TEXT;
BEGIN

  v_legal := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 14/2006, de 26 de mayo, sobre técnicas de reproducción humana asistida, y Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) —con especial protección por tratarse de datos de salud y genéticos, categoría especial conforme al art. 9 RGPD— y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 18,
      "witnessRequired": false,
      "retentionYears": 20,
      "introText": "De conformidad con la Ley 14/2006 y la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre la técnica propuesta, sus tasas de éxito, riesgos y alternativas, con tiempo suficiente para reflexionar antes de decidir si desea o no someterse a la misma. Este consentimiento debe renovarse para cada nuevo ciclo de tratamiento.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización de la técnica correspondiente, sin que ello suponga perjuicio alguno en la atención que se le preste. En caso de tratamiento en pareja, la revocación por cualquiera de los/las dos miembros impide la continuación del tratamiento conjunto.",
      "dataClause": "Sus datos personales, de salud y genéticos serán tratados por esta clínica con la finalidad exclusiva de gestionar su historia clínica y el tratamiento de reproducción asistida, de conformidad con el RGPD, la LOPDGDD y la Ley 14/2006, que establece garantías específicas de confidencialidad, especialmente en los casos de donación de gametos (anonimato del donante conforme al art. 5.5 de la Ley 14/2006, salvo excepciones legalmente previstas). Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 14/2006 y la Ley 41/2002, firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>%s. Sesión de imágenes</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo médico podrá realizar registros de imagen de carácter estrictamente clínico (ecografías, imágenes embrionarias en el laboratorio) que forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679 y la LOPDGDD 3/2018.</p>
<p>El uso de cualquier imagen o dato con fines formativos, científicos o de difusión (siempre de forma anonimizada y sin datos identificativos) requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando la casilla siguiente, sin que ello afecte en ningún caso a la atención que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso anonimizado de datos o imágenes de mi tratamiento con fines <strong>formativos o de investigación científica</strong>, garantizando que no podré ser identificado/a.</li>
</ul>
<p>Podrá revocar esta autorización en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>%s. Declaración de la persona/pareja solicitante</h2>
<p>El/La (o los/las) abajo firmante(s) declara(n) haber leído y comprendido la información anterior, incluidas las tasas de éxito, los riesgos y las alternativas disponibles, haber dispuesto de tiempo suficiente para reflexionar, haber tenido la oportunidad de formular preguntas al equipo médico y haberlas recibido contestadas de forma satisfactoria. Consiente(n) voluntariamente la realización de la técnica descrita para el ciclo de tratamiento actual, conociendo que puede(n) revocar este consentimiento en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. INSEMINACIÓN ARTIFICIAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_ia, 'Inseminación Artificial', 'reproduccion_asistida', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Inseminación Artificial',
      'body', '<h2>1. Descripción de la técnica</h2>
<p>Técnica de reproducción asistida que consiste en depositar una muestra de semen previamente capacitado en el laboratorio (de la pareja o de donante) directamente en el interior del útero, mediante un catéter, coincidiendo con la ovulación.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Facilitar la fecundación acercando los espermatozoides al óvulo, indicado en casos de esterilidad de origen leve, factor cervical, esterilidad de origen desconocido, o para mujeres sin pareja masculina o parejas del mismo sexo que requieran semen de donante.</p>

<h2>3. Cómo se realiza</h2>
<p>Tras estimulación ovárica leve (con monitorización ecográfica del desarrollo folicular) o en ciclo natural, y una vez confirmada la ovulación, se deposita la muestra de semen capacitada mediante un catéter fino a través del cuello uterino. El procedimiento es indoloro y no requiere anestesia, con una duración de pocos minutos.</p>

<h2>4. Tasas de éxito y beneficios esperados</h2>
<p>La tasa de embarazo por ciclo varía según la causa de esterilidad, la edad de la paciente y otros factores individuales, situándose orientativamente entre el 10 % y el 20 % por ciclo. Habitualmente se recomienda un máximo de 3-4 ciclos de inseminación antes de valorar otras técnicas si no se logra el embarazo.</p>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestia leve tipo cólico durante o después del procedimiento</li>
  <li>Manchado leve tras la inseminación</li>
  <li>Efectos secundarios de la medicación de estimulación ovárica (si se emplea): hinchazón abdominal, cambios de humor</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Síndrome de hiperestimulación ovárica leve (con estimulación ovárica), infrecuente en esta técnica por ser de baja estimulación</li>
  <li>Embarazo múltiple (gemelar o de más fetos) por el efecto de la estimulación ovárica, con mayor riesgo obstétrico asociado</li>
  <li>Infección pélvica (excepcional con técnica aséptica)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Obstrucción tubárica bilateral confirmada (la inseminación no seria eficaz, se recomienda FIV)</li>
  <li>Infección genital activa</li>
  <li>Patología uterina no tratada que contraindique la gestación</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Actividad normal tras el procedimiento, sin restricciones relevantes, y realización del test de embarazo en la fecha indicada por el equipo médico (aproximadamente 14-16 días después).</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Fecundación in vitro (FIV/ICSI) si la inseminación no resulta efectiva tras varios ciclos, coito programado en casos muy leves, o adopción/acogimiento como alternativa no médica al deseo de tener descendencia.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. FECUNDACIÓN IN VITRO (FIV)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_fiv, 'Fecundación In Vitro (FIV)', 'reproduccion_asistida', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fecundación In Vitro (FIV)',
      'body', '<h2>1. Descripción de la técnica</h2>
<p>Técnica de reproducción asistida que consiste en la estimulación ovárica controlada, la extracción de óvulos (punción folicular), su fecundación en laboratorio con espermatozoides (FIV convencional o mediante microinyección espermática, ICSI) y la posterior transferencia de uno o varios embriones al útero.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Conseguir la gestación en casos de esterilidad de causa tubárica, masculina severa, endometriosis, fallo de tratamientos previos menos complejos, edad materna avanzada, u otras indicaciones médicas.</p>

<h2>3. Cómo se realiza</h2>
<p>El proceso consta de varias fases: estimulación ovárica con medicación hormonal (10-14 días, con controles ecográficos y analíticos), punción folicular para la extracción de óvulos (bajo sedación), fecundación en el laboratorio, cultivo embrionario (3-5 días), y transferencia de uno o varios embriones al útero. Los embriones sobrantes de calidad adecuada podrán criopreservarse, previo consentimiento específico sobre su destino.</p>

<h2>4. Tasas de éxito y beneficios esperados</h2>
<p>La tasa de embarazo por transferencia embrionaria varía significativamente según la edad de la paciente, la causa de esterilidad y otros factores individuales, siendo mayor en mujeres jóvenes y disminuyendo progresivamente con la edad, especialmente a partir de los 38-40 años. El equipo médico le proporcionará una estimación individualizada según su caso.</p>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestias abdominales, hinchazón y sensibilidad ovárica durante la estimulación</li>
  <li>Dolor leve-moderado tras la punción folicular</li>
  <li>Sangrado vaginal leve tras la punción o la transferencia</li>
  <li>Cambios de humor asociados a la medicación hormonal</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Síndrome de hiperestimulación ovárica (SHO)</strong>: complicación derivada de la respuesta excesiva de los ovarios a la medicación, que en su forma grave puede requerir hospitalización; se minimiza con protocolos de estimulación ajustados y monitorización estrecha</li>
  <li>Sangrado o infección tras la punción folicular (poco frecuente)</li>
  <li>Lesión de estructuras pélvicas durante la punción (excepcional)</li>
  <li>Embarazo múltiple si se transfiere más de un embrión, con mayor riesgo obstétrico asociado (por ello se recomienda habitualmente la transferencia de un único embrión, especialmente en mujeres jóvenes)</li>
  <li>Embarazo ectópico (fuera del útero), riesgo presente aunque algo menor que en la concepción natural en pacientes sin factor tubárico</li>
  <li>Fallo de fecundación o ausencia de embriones viables para transferir, pese a una respuesta ovárica adecuada</li>
  <li>Cancelación del ciclo por respuesta ovárica insuficiente o excesiva</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología que contraindique de forma absoluta la gestación (se recomienda valoración médica específica y, en su caso, gestación subrogada donde esté permitida o adopción)</li>
  <li>Enfermedad oncológica activa no tratada</li>
  <li>Malformación uterina que impida la implantación (valorar individualmente)</li>
</ul>

<h2>8. Consentimientos específicos adicionales</h2>
<p>La Ley 14/2006 exige consentimientos específicos y separados para determinados aspectos de este tratamiento, que se le presentarán en los formularios correspondientes: destino de los embriones sobrantes criopreservados (donación a otras parejas, donación con fines de investigación, o mantenimiento en crioconservación), diagnóstico genético preimplantacional si procede, y consentimiento de la pareja (si la hubiera) para el tratamiento conjunto.</p>

<h2>9. Cuidados posteriores</h2>
<p>Reposo relativo el día de la punción y la transferencia, cumplimiento de la medicación de soporte de fase lútea prescrita, y realización del test de embarazo en la fecha indicada (aproximadamente 10-14 días tras la transferencia).</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Inseminación artificial en casos de indicación más leve, ovodonación si existe baja reserva ovárica o mala calidad ovocitaria, gestación subrogada donde esté legalmente permitida, o adopción/acogimiento.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. VITRIFICACIÓN DE ÓVULOS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_vitrif, 'Vitrificación de Óvulos', 'reproduccion_asistida', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Vitrificación de Óvulos',
      'body', '<h2>1. Descripción de la técnica</h2>
<p>Técnica de criopreservación ultrarrápida de óvulos mediante vitrificación, que permite conservarlos a muy baja temperatura (nitrógeno líquido) para su uso futuro, tras una estimulación ovárica controlada y punción folicular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Preservar la fertilidad para su uso futuro, ya sea por motivos médicos (antes de tratamientos oncológicos gonadotóxicos u otras patologías que comprometan la reserva ovárica) o por decisión personal (preservación social de la fertilidad, habitualmente asociada a la edad).</p>

<h2>3. Cómo se realiza</h2>
<p>Tras estimulación ovárica controlada con medicación hormonal (10-14 días, con controles ecográficos y analíticos), se realiza la punción folicular bajo sedación para extraer los óvulos, que se vitrifican en el laboratorio de forma inmediata tras confirmar su madurez y calidad.</p>

<h2>4. Resultados esperados</h2>
<p>El número de óvulos obtenidos y su calidad dependen fundamentalmente de la edad de la paciente y su reserva ovárica individual (valorada previamente mediante ecografía y analítica hormonal). La probabilidad de embarazo futuro con los óvulos vitrificados depende del número de óvulos almacenados y de la edad en el momento de la vitrificación; el equipo médico le proporcionará una estimación orientativa.</p>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Molestias abdominales, hinchazón y sensibilidad ovárica durante la estimulación</li>
  <li>Dolor leve-moderado tras la punción folicular</li>
  <li>Sangrado vaginal leve tras la punción</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Síndrome de hiperestimulación ovárica (SHO)</strong>, minimizado con protocolos ajustados y monitorización</li>
  <li>Sangrado o infección tras la punción folicular</li>
  <li>Lesión de estructuras pélvicas durante la punción (excepcional)</li>
  <li>Que el número o calidad de óvulos obtenidos sea inferior al esperado, especialmente en pacientes con baja reserva ovárica</li>
  <li>Pérdida de viabilidad de algunos óvulos durante el proceso de vitrificación/desvitrificación futura (no todos los óvulos sobreviven al proceso, tasa variable según el laboratorio)</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Patología que contraindique la estimulación hormonal (ciertos tumores hormonodependientes, valorar con oncología en pacientes en tratamiento oncológico)</li>
  <li>Tiempo insuficiente para completar la estimulación antes de un tratamiento oncológico urgente (valorar protocolos de urgencia con el equipo médico)</li>
</ul>

<h2>8. Conservación y consentimiento sobre el destino de los óvulos</h2>
<p>Los óvulos vitrificados se conservarán en el banco de la clínica mientras se mantenga vigente el contrato de criopreservación, debiendo el/la paciente indicar periódicamente su voluntad de continuar la conservación, destinarlos a su propio uso futuro, donarlos a otras personas/parejas, donarlos con fines de investigación, o proceder a su destrucción, conforme a lo establecido en la Ley 14/2006.</p>

<h2>9. Cuidados posteriores</h2>
<p>Reposo relativo el día de la punción, y actividad normal en los días siguientes salvo indicación médica distinta.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Vitrificación de tejido ovárico en casos seleccionados (técnica más compleja, indicada especialmente en pacientes prepúberes o cuando no hay tiempo para estimulación ovárica), o no preservar la fertilidad y asumir la evolución natural de la reserva ovárica.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. DONACIÓN DE GAMETOS (ÓVULOS/SEMEN)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_donacion, 'Donación de Gametos (Óvulos/Semen)', 'reproduccion_asistida', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Donación de Gametos',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Cesión voluntaria y altruista de óvulos o semen por parte de una persona donante, con destino a su uso por otras personas o parejas con problemas de fertilidad, conforme a lo establecido en la Ley 14/2006 sobre técnicas de reproducción humana asistida.</p>

<h2>2. Naturaleza legal de la donación</h2>
<ul>
  <li>La donación es un <strong>contrato gratuito, formal y confidencial</strong>, conforme al art. 5 de la Ley 14/2006 — no está permitida la donación remunerada, si bien la donante/el donante recibe una compensación económica por las molestias físicas y el desplazamiento derivados del proceso, conforme a la normativa vigente</li>
  <li>La donación es <strong>anónima</strong>: ni la persona/pareja receptora ni la descendencia nacida podrán conocer la identidad de la persona donante, salvo en circunstancias excepcionales que comporten un peligro cierto para la vida o la salud del hijo/hija, o cuando proceda con arreglo a las leyes procesales penales, conforme al art. 5.5 de la Ley 14/2006</li>
  <li>La donación tiene un <strong>límite legal de descendencia</strong>: la ley limita el número de hijos nacidos de gametos de un/a mismo/a donante para evitar la consanguinidad involuntaria</li>
</ul>

<h2>3. Cómo se realiza (donación de óvulos)</h2>
<p>Tras una valoración médica, psicológica y genética exhaustiva de la donante, se realiza estimulación ovárica controlada y punción folicular bajo sedación, de forma análoga al proceso de FIV, con la diferencia de que los óvulos obtenidos se destinan a la persona/pareja receptora.</p>

<h2>4. Cómo se realiza (donación de semen)</h2>
<p>Tras una valoración médica, psicológica y genética exhaustiva del donante, se obtienen muestras de semen mediante masturbación en la propia clínica, que se someten a cuarentena, estudio y, en su caso, congelación antes de su uso.</p>

<h2>5. Requisitos legales para ser donante</h2>
<ul>
  <li>Mayoría de edad y plena capacidad de obrar</li>
  <li>Buen estado de salud psicofísica, confirmado mediante estudio médico, analítico, genético (cribado de enfermedades hereditarias) y psicológico exhaustivo</li>
  <li>Ausencia de enfermedades genéticas, hereditarias o infecciosas transmisibles</li>
</ul>

<h2>6. Riesgos y efectos frecuentes (donación de óvulos)</h2>
<ul>
  <li>Molestias abdominales e hinchazón durante la estimulación ovárica</li>
  <li>Dolor leve-moderado tras la punción folicular</li>
  <li>Cambios de humor asociados a la medicación hormonal</li>
</ul>

<h2>7. Riesgos y efectos poco frecuentes o graves (donación de óvulos)</h2>
<ul>
  <li>Síndrome de hiperestimulación ovárica, minimizado con protocolos ajustados y monitorización estrecha</li>
  <li>Sangrado o infección tras la punción folicular</li>
  <li>Lesión de estructuras pélvicas durante la punción (excepcional)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>No cumplir los requisitos legales y médicos de idoneidad como donante</li>
  <li>Antecedentes personales o familiares de enfermedades genéticas o hereditarias relevantes</li>
  <li>Patología que contraindique la estimulación hormonal (donación de óvulos)</li>
</ul>

<h2>9. Revocabilidad</h2>
<p>La donante/el donante puede revocar su consentimiento en cualquier momento antes de la extracción de los óvulos o la obtención de la muestra de semen. Una vez utilizados los gametos donados en un tratamiento de reproducción asistida, el consentimiento a la donación no es revocable respecto de dicho uso, conforme al art. 5.2 de la Ley 14/2006.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
