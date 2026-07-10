-- Consentimientos informados de Dermatología Médica — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Dermatología (tratamiento médico de enfermedades de la piel,
-- distinto de la Medicina Estética/cosmética).

DO $$
DECLARE
  v_biopsia UUID := '10000009-0000-0000-0000-000000000001';
  v_crio    UUID := '10000009-0000-0000-0000-000000000002';
  v_extirp  UUID := '10000009-0000-0000-0000-000000000003';
  v_acne    UUID := '10000009-0000-0000-0000-000000000004';
  v_foto    UUID := '10000009-0000-0000-0000-000000000005';
  v_tfd     UUID := '10000009-0000-0000-0000-000000000006';
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
      "dataClause": "Sus datos personales y de salud serán tratados por esta clínica con la finalidad exclusiva de gestionar su historia clínica dermatológica, de conformidad con el RGPD y la LOPDGDD. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>10. Sesión de imágenes (fotografías dermatoscópicas y clínicas)</h2>
<p>Como parte del diagnóstico y seguimiento de este tratamiento, el equipo médico realizará fotografías clínicas y/o dermatoscópicas de la lesión o zona tratada antes, durante y después del procedimiento, con el fin de documentar el estado previo y valorar la evolución. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen.</p>
<p>El registro con fines diagnósticos y de seguimiento no requiere autorización adicional distinta de este consentimiento. El uso de estas imágenes con cualquier otra finalidad requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención sanitaria que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia), garantizando que mi identidad no será reconocible.</li>
  <li>☐ Autorizo el uso de mis imágenes con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica).</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al/a la dermatólogo/a y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- 1. BIOPSIA CUTÁNEA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_biopsia, 'Biopsia Cutánea', 'dermatologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Biopsia Cutánea',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Extracción de una muestra de piel (mediante punch, afeitado o escisión, según el tipo de lesión) bajo anestesia local, para su análisis histopatológico en laboratorio y obtención de un diagnóstico definitivo.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Obtener un diagnóstico histopatológico preciso de una lesión cutánea de origen incierto, para confirmar o descartar patología benigna o maligna y orientar el tratamiento posterior.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la dermatólogo/a extrae la muestra de piel con la técnica más adecuada a la lesión (punch, afeitado tangencial o escisión con sutura), y la remite a un laboratorio de anatomía patológica. El procedimiento dura entre 10 y 30 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Diagnóstico histopatológico definitivo de la lesión</li>
  <li>Base fundamental para planificar el tratamiento más adecuado según el resultado</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor leve tras la anestesia local</li>
  <li>Sangrado leve durante o después del procedimiento</li>
  <li>Cicatriz en el punto de la biopsia</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Infección de la herida</li>
  <li>Cicatrización hipertrófica o queloide en personas predispuestas</li>
  <li>Resultado no concluyente que requiera repetir la biopsia</li>
  <li>Resultado de malignidad, que puede requerir tratamiento complementario y modificar el pronóstico</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Coagulopatías no controladas o tratamiento anticoagulante sin ajuste previo</li>
  <li>Infección activa en la zona a biopsiar</li>
  <li>Alergia conocida al anestésico local</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener el apósito indicado, evitar mojar la zona las primeras 24 horas, retirar los puntos de sutura si no son reabsorbibles en el plazo indicado, y acudir a la revisión donde se comunicará el resultado histopatológico.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Seguimiento clínico y dermatoscópico sin biopsia si la sospecha de malignidad es muy baja (no recomendado ante signos de alarma), o derivación a un centro especializado en casos complejos.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. CRIOTERAPIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_crio, 'Crioterapia (Nitrógeno Líquido)', 'dermatologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Crioterapia',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Aplicación de nitrógeno líquido (a -196 °C) sobre lesiones cutáneas benignas o premalignas, mediante espray o aplicador, con el fin de congelar y destruir el tejido lesional de forma controlada.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de queratosis actínicas, verrugas víricas, queratosis seborreicas u otras lesiones benignas o premalignas susceptibles de crioterapia.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la dermatólogo/a aplica el nitrógeno líquido directamente sobre la lesión durante el tiempo necesario según su grosor y naturaleza, pudiendo requerir uno o varios ciclos de congelación-descongelación en la misma sesión. El procedimiento dura pocos minutos por lesión.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación de la lesión tratada</li>
  <li>Procedimiento rápido, sin necesidad de anestesia en la mayoría de los casos</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Dolor o escozor durante y después de la aplicación</li>
  <li>Enrojecimiento e inflamación de la zona</li>
  <li>Formación de ampolla, en ocasiones hemorrágica, en los días siguientes</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Hipopigmentación o hiperpigmentación de la zona tratada, en ocasiones permanente (más frecuente en fototipos altos)</li>
  <li>Cicatriz residual</li>
  <li>Infección local</li>
  <li>Lesión de estructuras profundas (nervios superficiales) en tratamientos muy prolongados o profundos, infrecuente</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Intolerancia al frío o crioglobulinemia</li>
  <li>Fenómeno de Raynaud severo en la zona a tratar</li>
  <li>Lesión con sospecha de malignidad no confirmada por biopsia previa (valorar biopsia primero)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener la zona limpia, no reventar la ampolla que se forme (dejar que se reabsorba o drene de forma natural), aplicar la cura indicada, y fotoprotección de la zona durante la cicatrización.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Electrocoagulación, curetaje, láser, o tratamiento tópico según el tipo de lesión.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. EXTIRPACIÓN DE LESIONES CUTÁNEAS
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_extirp, 'Extirpación de Lesiones Cutáneas (Quiste, Lipoma, Nevus)', 'dermatologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Extirpación de Lesiones Cutáneas',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Intervención quirúrgica menor bajo anestesia local para la extirpación completa de una lesión cutánea o subcutánea (quiste epidérmico, lipoma, nevus u otra lesión benigna), con cierre mediante sutura.</p>

<h2>2. Objetivo del procedimiento</h2>
<p>Eliminar de forma completa la lesión, con fines diagnósticos (análisis histopatológico), estéticos-funcionales (molestia, roce con la ropa, tamaño creciente) o ambos.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia local, el/la dermatólogo/a extirpa la lesión completa con un margen de piel sana si procede, y cierra la herida mediante sutura. La muestra se remite habitualmente a analizar. El procedimiento dura entre 20 y 60 minutos según el tamaño y localización.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación completa de la lesión</li>
  <li>Confirmación histopatológica de su naturaleza benigna o maligna</li>
  <li>Resolución de la molestia física asociada (roce, presión)</li>
</ul>

<h2>5. Riesgos y complicaciones frecuentes</h2>
<ul>
  <li>Dolor e inflamación postoperatoria en la zona</li>
  <li>Hematoma local</li>
  <li>Cicatriz visible en el punto de extirpación</li>
</ul>

<h2>6. Riesgos y complicaciones poco frecuentes o graves</h2>
<ul>
  <li>Infección de la herida quirúrgica</li>
  <li>Dehiscencia (apertura) de la sutura</li>
  <li>Cicatrización hipertrófica o queloide</li>
  <li>Recidiva de la lesión si la extirpación no ha sido completa (más relevante en quistes)</li>
  <li>Lesión de estructuras nerviosas superficiales según la localización, con posible alteración de la sensibilidad</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Coagulopatías no controladas</li>
  <li>Infección activa en la zona</li>
  <li>Alergia conocida al anestésico local</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Mantener la herida limpia y seca, cura según pauta indicada, retirada de puntos si no son reabsorbibles en el plazo indicado, y acudir a la revisión con el resultado histopatológico si se ha enviado la muestra.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Seguimiento sin extirpación si la lesión es asintomática y de bajo riesgo (con controles periódicos), u otras técnicas menos invasivas según el tipo de lesión (drenaje simple en quistes inflamados, no definitivo).</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. TRATAMIENTO MÉDICO DEL ACNÉ
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_acne, 'Tratamiento Médico del Acné', 'dermatologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Tratamiento Médico del Acné',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Abordaje médico del acné mediante tratamiento tópico (retinoides, antibióticos tópicos, peróxido de benzoilo) y/o sistémico (antibióticos orales, isotretinoína oral, tratamiento hormonal), según la gravedad y el tipo de acné diagnosticado.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Controlar y reducir las lesiones de acné activo, prevenir la formación de cicatrices, y mejorar la calidad de vida asociada a esta patología.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la dermatólogo/a prescribe la pauta de tratamiento adecuada según la gravedad (tópico para casos leves, sistémico para casos moderados-graves), con revisiones periódicas para valorar la respuesta y ajustar el tratamiento. La duración varía desde varias semanas hasta varios meses.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción significativa de las lesiones activas de acné</li>
  <li>Prevención de cicatrices permanentes</li>
  <li>Mejora de la calidad de vida y la autoestima</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Sequedad e irritación cutánea con tratamientos tópicos (retinoides, peróxido de benzoilo)</li>
  <li>Fotosensibilidad aumentada</li>
  <li>Empeoramiento inicial transitorio al comenzar el tratamiento (efecto conocido, mejora en semanas)</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li><strong>Isotretinoína oral</strong>: sequedad mucocutánea intensa, elevación de lípidos y enzimas hepáticas (requiere control analítico periódico), <strong>teratogenicidad</strong> (contraindicado en embarazo, exige anticoncepción eficaz obligatoria en mujeres en edad fértil), posible asociación con alteraciones del estado de ánimo (vigilancia recomendada)</li>
  <li>Resistencia bacteriana con el uso prolongado de antibióticos tópicos u orales</li>
  <li>Reacción alérgica a alguno de los principios activos</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia (especialmente isotretinoína, retinoides tópicos y ciertos antibióticos)</li>
  <li>Hepatopatía o dislipemia severa no controlada (isotretinoína oral)</li>
  <li>Alergia conocida a los principios activos prescritos</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Cumplimiento estricto de la pauta prescrita, fotoprotección solar diaria, uso de anticoncepción eficaz si se prescribe isotretinoína en mujeres en edad fértil, y acudir a los controles analíticos y de seguimiento programados.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento cosmético/estético coadyuvante (limpiezas, peelings), terapia hormonal específica en acné de causa hormonal, o combinación de tratamientos según la respuesta individual.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. FOTOTERAPIA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_foto, 'Fototerapia (Psoriasis/Vitíligo)', 'dermatologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Fototerapia',
      'body', '<h2>1. Descripción del tratamiento</h2>
<p>Tratamiento médico que emplea radiación ultravioleta controlada (UVB de banda estrecha u otra modalidad prescrita) para el tratamiento de determinadas patologías cutáneas crónicas como la psoriasis, el vitíligo o la dermatitis atópica.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducir la actividad inflamatoria de la psoriasis, estimular la repigmentación en el vitíligo, o mejorar otras patologías cutáneas con indicación de fototerapia, mediante un protocolo de dosis progresivas.</p>

<h2>3. Cómo se realiza</h2>
<p>El paciente se expone en una cabina o dispositivo de fototerapia a la dosis de radiación ultravioleta prescrita, con protección ocular y de zonas no afectadas. El tratamiento requiere sesiones periódicas (2-3 veces por semana) durante varias semanas o meses, con incrementos progresivos de dosis según la tolerancia.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora o remisión de las lesiones de psoriasis</li>
  <li>Repigmentación progresiva en el vitíligo (resultado variable según la zona y el tiempo de evolución)</li>
  <li>Tratamiento no farmacológico sistémico, con buen perfil de seguridad a corto plazo</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li>Enrojecimiento tipo "quemadura solar" en la zona tratada, especialmente al ajustar dosis</li>
  <li>Sequedad cutánea</li>
  <li>Picor transitorio</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Quemadura por sobredosificación</li>
  <li>Fotoenvejecimiento cutáneo con tratamientos muy prolongados en el tiempo</li>
  <li><strong>Aumento del riesgo de cáncer de piel a largo plazo</strong> con el uso acumulado y prolongado de fototerapia, por lo que se establece un límite de sesiones/dosis acumulada de por vida y seguimiento dermatológico periódico</li>
  <li>Reactivación de herpes labial</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Antecedente de cáncer de piel (melanoma u otros, valorar individualmente)</li>
  <li>Fotosensibilidad conocida o enfermedades fotoagravadas (lupus eritematoso, entre otras)</li>
  <li>Tratamiento con fármacos fotosensibilizantes</li>
  <li>Embarazo (precaución, valorar con el equipo médico)</li>
  <li>Xeroderma pigmentoso u otras genodermatosis con fotosensibilidad extrema</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p>Hidratación cutánea diaria, evitar exposición solar adicional no controlada el mismo día de la sesión, y cumplir el calendario completo de sesiones para valorar correctamente la respuesta.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Tratamiento tópico (corticoides, análogos de vitamina D), tratamiento sistémico (biológicos, inmunosupresores) en psoriasis moderada-grave, o láser excimer en vitíligo localizado.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. TERAPIA FOTODINÁMICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_tfd, 'Terapia Fotodinámica (Queratosis Actínicas)', 'dermatologia', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Terapia Fotodinámica',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Técnica médica que combina la aplicación de un agente fotosensibilizante tópico sobre la lesión con su posterior activación mediante una fuente de luz específica, generando una reacción que destruye selectivamente las células dañadas.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de queratosis actínicas (lesiones premalignas por daño solar acumulado) y determinados tipos de cáncer de piel superficial (carcinoma basocelular superficial, en casos seleccionados), así como campo de cancerización extenso.</p>

<h2>3. Cómo se realiza</h2>
<p>El/la dermatólogo/a prepara la lesión (curetaje suave si procede), aplica el agente fotosensibilizante y lo deja actuar durante un periodo de incubación (1-3 horas), y posteriormente ilumina la zona con la fuente de luz específica durante 7-10 minutos. Puede requerir una segunda sesión a las 1-2 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Eliminación selectiva de las células dañadas con buen resultado estético</li>
  <li>Tratamiento de campo, útil cuando existen múltiples lesiones o daño solar extenso</li>
  <li>Técnica no quirúrgica, sin cicatriz relevante en la mayoría de los casos</li>
</ul>

<h2>5. Riesgos y efectos frecuentes</h2>
<ul>
  <li><strong>Dolor o escozor intenso durante la iluminación</strong>, el efecto adverso más frecuente y limitante del tratamiento</li>
  <li>Enrojecimiento e inflamación marcados de la zona tratada</li>
  <li>Formación de costras y descamación durante 1-2 semanas</li>
</ul>

<h2>6. Riesgos y efectos poco frecuentes o graves</h2>
<ul>
  <li>Reacción de fototoxicidad intensa si no se respeta la fotoprotección posterior</li>
  <li>Infección local</li>
  <li>Hiperpigmentación o hipopigmentación residual</li>
  <li>Persistencia de la lesión que requiera tratamiento adicional o biopsia de confirmación</li>
</ul>

<h2>7. Contraindicaciones</h2>
<ul>
  <li>Alergia conocida al agente fotosensibilizante o a las porfirinas</li>
  <li>Porfiria</li>
  <li>Embarazo o lactancia</li>
  <li>Lesión con sospecha de malignidad más profunda que no sea susceptible de este tratamiento (valorar biopsia previa)</li>
</ul>

<h2>8. Cuidados posteriores</h2>
<p><strong>Fotoprotección estricta y evitar la luz solar directa durante las 48 horas siguientes</strong> a la sesión (riesgo de reacción fototóxica grave si se expone), mantener la zona limpia, aplicar la cura indicada, y acudir a la revisión de control.</p>

<h2>9. Alternativas terapéuticas</h2>
<p>Crioterapia, tratamiento tópico (5-fluorouracilo, imiquimod), curetaje, o cirugía en lesiones más profundas o de mayor sospecha.</p>

' || v_img
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
