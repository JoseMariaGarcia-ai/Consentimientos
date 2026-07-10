-- Consentimientos informados de Cirugía Plástica y Reconstructiva — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Cirugía Plástica (cirugía mayor bajo anestesia general u
-- sedación profunda, en quirófano/centro autorizado — mayor exigencia
-- informativa que la medicina estética no quirúrgica).

DO $$
DECLARE
  v_rino    UUID := '10000010-0000-0000-0000-000000000001';
  v_mamo    UUID := '10000010-0000-0000-0000-000000000002';
  v_abdomen UUID := '10000010-0000-0000-0000-000000000003';
  v_lipo    UUID := '10000010-0000-0000-0000-000000000004';
  v_blefaro UUID := '10000010-0000-0000-0000-000000000005';
  v_oto     UUID := '10000010-0000-0000-0000-000000000006';
  v_legal   JSONB;
  v_img     TEXT;
  v_anest   TEXT;
BEGIN

  v_legal := '{
    "es-ES": {
      "jurisdiction": "España",
      "applicableLaw": "Ley 41/2002, de 14 de noviembre, básica reguladora de la autonomía del paciente",
      "dataProtection": "Reglamento (UE) 2016/679 (RGPD) y Ley Orgánica 3/2018 (LOPDGDD)",
      "signatureValidity": "Reglamento eIDAS (UE) 910/2014 — Firma Electrónica Avanzada",
      "minAge": 18,
      "witnessRequired": true,
      "retentionYears": 15,
      "introText": "De conformidad con la Ley 41/2002, esta es una intervención quirúrgica mayor. Usted tiene derecho a recibir información completa, comprensible y adecuada sobre el procedimiento, sus riesgos y alternativas, con tiempo suficiente para reflexionar antes de decidir si desea o no someterse al mismo.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización de la intervención, sin que ello suponga perjuicio alguno en la atención que se le preste.",
      "dataClause": "Sus datos personales y de salud serán tratados por esta clínica/hospital con la finalidad exclusiva de gestionar su historia clínica quirúrgica, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito al centro.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014. Dada la naturaleza de cirugía mayor de este procedimiento, se recomienda un periodo de reflexión antes de la firma definitiva."
    }
  }'::JSONB;

  -- Nota: cirugía mayor bajo anestesia general — se exige testigo (witnessRequired)
  -- y un plazo de conservación de la historia clínica ampliado (15 años), acorde
  -- a la práctica habitual en cirugía con mayor entidad y riesgo médico-legal.

  v_anest := '<h2>6. Riesgos generales de la anestesia</h2>
<p>Esta intervención requiere anestesia general o sedación profunda, con los riesgos inherentes propios de cualquier procedimiento anestésico: reacción alérgica a los fármacos, complicación cardiorrespiratoria, trombosis venosa profunda o tromboembolismo pulmonar, y, de forma excepcional, riesgo vital. Estos riesgos se minimizan mediante valoración preanestésica y monitorización continua por parte de un/a anestesiólogo/a, quien le informará específicamente sobre este aspecto.</p>
';

  v_img := '<h2>%s. Sesión de imágenes (fotografías clínicas)</h2>
<p>Como parte del diagnóstico y seguimiento de esta intervención, el equipo médico realizará fotografías clínicas antes, durante y después del procedimiento, con el fin de documentar el estado previo, planificar la cirugía y valorar el resultado. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>El registro con fines clínicos y de planificación quirúrgica no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi rostro no será reconocible salvo que sea el área intervenida y clínicamente relevante.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica), pudiendo mostrarse mi rostro.</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>%s. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, incluidos los riesgos generales de la anestesia, haber dispuesto de tiempo suficiente para reflexionar, haber tenido la oportunidad de formular preguntas al equipo quirúrgico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización de la intervención descrita, conociendo que puede revocarla en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. RINOPLASTIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_rino, 'Rinoplastia', 'cirugia_plastica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Rinoplastia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica que modifica la forma, el tamaño o la función de la nariz, actuando sobre el hueso y/o el cartílago nasal, mediante abordaje cerrado (incisiones internas) o abierto (con una pequeña incisión en la columela).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corregir alteraciones estéticas de la nariz (dorso, punta, simetría) y/o mejorar la función respiratoria nasal cuando existe una alteración estructural asociada (rinoplastia funcional).</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general (o sedación profunda con anestesia local en casos seleccionados), el/la cirujano/a remodela la estructura ósea y cartilaginosa nasal según la planificación acordada. La cirugía dura entre 1,5 y 3 horas. Se coloca una férula externa que se retira a los 7-10 días.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la forma y proporción nasal según lo planificado</li>
  <li>Mejora de la función respiratoria en casos de rinoplastia funcional</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y hematomas periorbitarios (alrededor de los ojos) durante 1-2 semanas</li>
  <li>Obstrucción nasal temporal por la inflamación interna</li>
  <li>Sangrado nasal leve los primeros días</li>
  <li>Inflamación residual de la punta nasal que puede persistir varios meses hasta el resultado definitivo (hasta 12 meses)</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Asimetría o resultado estético no satisfactorio, que puede requerir cirugía de revisión</li>
  <li>Perforación septal</li>
  <li>Alteración persistente de la función respiratoria</li>
  <li>Infección postquirúrgica</li>
  <li>Pérdida parcial y transitoria del sentido del olfato</li>
  <li>Necesidad de cirugía de revisión (tasa descrita en la literatura de hasta un 10-15 % de los casos)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia general</li>
  <li>Expectativas no realistas sobre el resultado (se recomienda valoración psicológica en casos de dismorfia corporal)</li>
  <li>Crecimiento óseo/cartilaginoso no finalizado (menores, salvo indicación funcional específica)</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Reposo relativo con la cabeza elevada las primeras semanas, no realizar esfuerzos físicos intensos ni deportes de contacto durante 4-6 semanas, evitar golpes en la zona, no usar gafas apoyadas sobre el dorso nasal hasta autorización, y acudir a las revisiones programadas.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Rinoplastia no quirúrgica con ácido hialurónico (resultado más limitado y temporal, no corrige problemas funcionales ni reduce el tamaño), o no intervenir.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. MAMOPLASTIA DE AUMENTO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_mamo, 'Mamoplastia de Aumento', 'cirugia_plastica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Mamoplastia de Aumento',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica que aumenta el volumen mamario mediante la colocación de implantes de silicona o solución salina, a través de una incisión (periareolar, submamaria o axilar), en plano subglandular, subfascial o submuscular.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aumentar el volumen y mejorar la forma y proporción de las mamas, corregir asimetrías, o restaurar el volumen perdido tras el embarazo, la lactancia o la pérdida de peso.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general, el/la cirujano/a crea una bolsa quirúrgica en el plano acordado durante la planificación preoperatoria, e inserta el implante seleccionado (tamaño, forma y superficie elegidos junto con el paciente). La cirugía dura entre 1 y 2 horas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aumento del volumen mamario según lo planificado</li>
  <li>Mejora de la proporción corporal y la autoestima</li>
  <li>Resultado duradero, aunque los implantes no se consideran de por vida</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematoma y dolor postoperatorio durante 1-2 semanas</li>
  <li>Cicatriz en el punto de incisión, cuya evolución varía según cada paciente</li>
  <li>Alteración temporal de la sensibilidad del pezón y la areola</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Contractura capsular</strong>: formación de tejido cicatricial endurecido alrededor del implante, pudiendo requerir reintervención (una de las complicaciones a largo plazo más frecuentes)</li>
  <li>Rotura o deflación del implante a largo plazo, requiriendo su sustitución</li>
  <li>Asimetría o desplazamiento (rotación o migración) del implante</li>
  <li>Infección periprotésica, pudiendo requerir la retirada temporal del implante</li>
  <li>Seroma o hematoma que requiera drenaje</li>
  <li>Alteración permanente de la sensibilidad del pezón</li>
  <li>Interferencia con la lactancia materna futura (variable según la técnica y el plano del implante)</li>
  <li><strong>Linfoma anaplásico de células grandes asociado a implantes mamarios (LACG-AIM)</strong>: entidad rara pero descrita, asociada principalmente a implantes de superficie texturizada, de la que se informa expresamente conforme a las recomendaciones de las autoridades sanitarias</li>
  <li>Necesidad de recambio del implante en el futuro (los implantes no tienen garantía de duración indefinida)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia general</li>
  <li>Cáncer de mama activo no tratado o sospecha no descartada (requiere estudio previo)</li>
  <li>Infección activa</li>
  <li>Expectativas no realistas sobre el resultado</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Uso del sujetador postquirúrgico indicado durante el periodo pautado, evitar esfuerzos físicos intensos y levantar peso durante 4-6 semanas, control de la herida, y seguimiento periódico a largo plazo del estado de los implantes (revisión clínica y, según edad, pruebas de imagen periódicas).</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Lipotransferencia mamaria (aumento con grasa propia, resultado más moderado), o no intervenir.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. ABDOMINOPLASTIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_abdomen, 'Abdominoplastia', 'cirugia_plastica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Abdominoplastia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica que elimina el exceso de piel y grasa del abdomen y repara la musculatura abdominal separada (diástasis de rectos), mediante una incisión horizontal baja (habitualmente oculta por la ropa interior) y reposicionamiento del ombligo.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Eliminar el exceso de piel abdominal flácida (frecuente tras embarazos o grandes pérdidas de peso), corregir la diástasis de los músculos rectos abdominales, y mejorar el contorno corporal.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general, el/la cirujano/a realiza la incisión, despega la piel del plano muscular, repara la diástasis muscular con sutura, retira el exceso de piel y grasa, y reposiciona el ombligo. La cirugía dura entre 2 y 4 horas, requiriendo habitualmente ingreso de una noche.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación del exceso de piel y mejora significativa del contorno abdominal</li>
  <li>Corrección de la diástasis muscular, mejorando la funcionalidad del core</li>
  <li>Resultado permanente si se mantiene un peso estable</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor e inflamación postoperatoria significativos durante 2-4 semanas</li>
  <li>Cicatriz extensa (habitualmente oculta por la ropa interior, pero visible en bañador)</li>
  <li>Alteración temporal de la sensibilidad de la piel abdominal</li>
  <li>Necesidad de drenajes quirúrgicos los primeros días</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Trombosis venosa profunda o tromboembolismo pulmonar</strong>: riesgo aumentado en esta cirugía por la duración de la intervención y la posición del paciente, minimizado con profilaxis específica (medias de compresión, movilización precoz, y en algunos casos anticoagulación profiláctica)</li>
  <li>Seroma (acumulación de líquido) que requiera drenaje</li>
  <li>Necrosis parcial de la piel o del ombligo, especialmente en fumadores</li>
  <li>Infección de la herida quirúrgica</li>
  <li>Dehiscencia (apertura) de la sutura</li>
  <li>Cicatrización hipertrófica o queloide</li>
  <li>Asimetría o resultado estético no satisfactorio</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia general</li>
  <li>Tabaquismo activo (aumenta significativamente el riesgo de necrosis cutánea; se recomienda cesar al menos 4-6 semanas antes)</li>
  <li>Deseo de futuros embarazos (se recomienda posponer la cirugía)</li>
  <li>Obesidad no controlada (se recomienda alcanzar un peso estable previo)</li>
  <li>Trastornos de la coagulación no controlados</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Reposo relativo con el tronco semiflexionado las primeras semanas, uso de faja de compresión durante el periodo indicado (4-6 semanas), no realizar esfuerzos físicos intensos durante 6 semanas, cuidado de los drenajes si se colocan, y acudir a las revisiones programadas.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Liposucción aislada si no existe exceso de piel relevante ni diástasis (no corrige la piel sobrante), miniabdominoplastia en casos de exceso de piel más limitado, o ejercicio y dieta si el objetivo es exclusivamente la reducción de grasa sin exceso cutáneo.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. LIPOSUCCIÓN
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_lipo, 'Liposucción', 'cirugia_plastica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Liposucción',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica que elimina depósitos de grasa localizada resistentes a dieta y ejercicio, mediante la introducción de cánulas a través de pequeñas incisiones y aspiración del tejido graso, con o sin asistencia de energía (ultrasonido, láser o vibración).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejorar el contorno corporal eliminando depósitos de grasa localizada en zonas específicas (abdomen, flancos, muslos, brazos, papada, entre otras), no siendo un tratamiento para la obesidad ni la pérdida de peso general.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia general, sedación profunda o anestesia tumescente local según la extensión, el/la cirujano/a infiltra una solución que facilita la extracción y reduce el sangrado, y aspira la grasa con cánulas a través de pequeñas incisiones. La cirugía dura entre 1 y 3 horas según las zonas tratadas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora del contorno corporal en las zonas tratadas</li>
  <li>Resultado permanente en las células grasas eliminadas (un aumento de peso posterior puede acumular grasa en otras zonas)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematomas extensos y dolor postoperatorio durante 2-4 semanas</li>
  <li>Irregularidades cutáneas temporales (ondulaciones)</li>
  <li>Alteración temporal de la sensibilidad de la zona tratada</li>
</ul>

' || v_anest || '<h2>7. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Perforación visceral</strong>: lesión de órganos internos por la cánula, complicación grave e infrecuente, minimizada con técnica adecuada</li>
  <li><strong>Embolia grasa o tromboembolismo pulmonar</strong></li>
  <li>Irregularidades cutáneas permanentes o piel colgante si el volumen extraído es muy grande en pieles poco elásticas</li>
  <li>Asimetría entre ambos lados del cuerpo</li>
  <li>Seroma que requiera drenaje</li>
  <li>Infección de la herida</li>
  <li>Alteración de la sensibilidad permanente en la zona (infrecuente)</li>
  <li>Sobrecarga de líquidos si se tratan múltiples zonas en la misma sesión (síndrome de sobrecarga hídrica, riesgo minimizado con control anestésico del volumen infundido)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Patología sistémica que contraindique la anestesia</li>
  <li>Obesidad (la liposucción no es tratamiento de la obesidad; se recomienda un peso próximo al ideal)</li>
  <li>Trastornos de la coagulación no controlados</li>
  <li>Expectativas no realistas sobre el resultado</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Uso de faja de compresión continua durante el periodo indicado (4-6 semanas), reposo relativo los primeros días, drenaje linfático manual si se recomienda para reducir la inflamación, y evitar esfuerzos físicos intensos durante 3-4 semanas.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Tratamientos no quirúrgicos de reducción de grasa localizada (criolipólisis, cavitación), de resultado más moderado y progresivo, o dieta y ejercicio.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. BLEFAROPLASTIA QUIRÚRGICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_blefaro, 'Blefaroplastia Quirúrgica', 'cirugia_plastica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Blefaroplastia Quirúrgica',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica que corrige el exceso de piel, músculo y/o grasa herniada de los párpados superiores y/o inferiores, mediante incisiones en los pliegues naturales del párpado (superior) o por vía interna/externa (inferior).</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corregir el exceso de piel palpebral (que puede llegar a limitar el campo visual en casos avanzados), las bolsas de grasa herniada, y mejorar el aspecto cansado o envejecido de la mirada.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia local con sedación (o anestesia general en casos combinados con otras cirugías), el/la cirujano/a extirpa el exceso de piel, músculo y/o grasa a través de las incisiones planificadas, cerrando con sutura muy fina. La cirugía dura entre 1 y 2 horas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora del aspecto de la mirada, más descansado y rejuvenecido</li>
  <li>Mejora del campo visual en casos con exceso de piel muy significativo (blefaroplastia funcional)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación y hematomas periorbitarios durante 1-2 semanas</li>
  <li>Sequedad ocular u ojo llorón transitorio</li>
  <li>Cicatriz en el pliegue palpebral, habitualmente muy poco visible</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li><strong>Ectropion</strong> (retracción del párpado inferior hacia afuera), pudiendo requerir corrección quirúrgica si es persistente</li>
  <li>Lagoftalmos (dificultad para cerrar completamente el párpado), habitualmente transitorio</li>
  <li>Asimetría entre ambos ojos</li>
  <li>Hematoma retrobulbar (complicación grave y muy infrecuente que puede comprometer la visión, requiere atención inmediata si aparece dolor intenso o pérdida de visión)</li>
  <li>Alteración de la visión, generalmente transitoria por la inflamación</li>
  <li>Resultado insuficiente en la corrección de bolsas, pudiendo requerir tratamiento complementario</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Ojo seco severo no controlado</li>
  <li>Enfermedad tiroidea ocular activa no estabilizada</li>
  <li>Glaucoma no controlado</li>
  <li>Coagulopatías no controladas</li>
  <li>Patología sistémica que contraindique la anestesia</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Aplicación de frío local las primeras 48 horas, uso de colirio o pomada oftálmica lubricante indicada, evitar frotar los ojos, protección solar con gafas de sol, y no usar lentillas hasta autorización.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamientos no quirúrgicos (plasma pen, radiofrecuencia) para casos leves de exceso de piel, toxina botulínica para arrugas periorbitarias sin exceso de piel/grasa relevante, o no intervenir.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. OTOPLASTIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_oto, 'Otoplastia', 'cirugia_plastica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Otoplastia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica que corrige la posición, el tamaño o la forma de las orejas (habitualmente orejas prominentes o "de soplillo"), mediante remodelación del cartílago auricular a través de una incisión oculta detrás de la oreja.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corregir orejas prominentes u otras alteraciones de forma/posición del pabellón auricular, mejorando la proporción con el resto del rostro.</p>

<h2>3. Cómo se realiza</h2>
<p>Bajo anestesia local con sedación (o anestesia general, especialmente en niños), el/la cirujano/a accede al cartílago a través de una incisión posterior oculta, lo remodela y/o lo fija en la nueva posición con sutura permanente. La cirugía dura entre 1 y 2 horas para ambas orejas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Corrección de la prominencia o forma de las orejas</li>
  <li>Resultado permanente</li>
  <li>Mejora relevante de la autoestima, especialmente en pacientes pediátricos que sufren burlas por esta condición</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Inflamación, hematoma y dolor postoperatorio durante 1-2 semanas</li>
  <li>Alteración temporal de la sensibilidad de la oreja</li>
  <li>Necesidad de usar una banda o vendaje compresivo durante varias semanas</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Asimetría entre ambas orejas</li>
  <li>Hematoma auricular que requiera drenaje (riesgo de deformidad en "oreja de coliflor" si no se trata a tiempo)</li>
  <li>Infección del cartílago (condritis), complicación potencialmente grave que requiere tratamiento antibiótico intensivo</li>
  <li>Recidiva parcial de la prominencia con el tiempo</li>
  <li>Extrusión (exposición) de la sutura de fijación, pudiendo requerir su retirada</li>
  <li>Cicatriz hipertrófica o queloide en la zona de incisión</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Cartílago auricular no completamente desarrollado en niños muy pequeños (se recomienda esperar a que el crecimiento del pabellón esté prácticamente completo, habitualmente a partir de los 6-7 años)</li>
  <li>Infección activa en la zona</li>
  <li>Patología sistémica que contraindique la anestesia</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Uso de la banda o vendaje compresivo día y noche durante las primeras semanas, y después solo durante la noche por un periodo adicional, evitar dormir de lado presionando la zona, no realizar deportes de contacto durante 4-6 semanas, y acudir a las revisiones programadas.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Moldeado auricular no quirúrgico en recién nacidos (solo eficaz en las primeras semanas de vida, por la maleabilidad del cartílago neonatal), o no intervenir.</p>

' || format(v_img, '10', '11')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
