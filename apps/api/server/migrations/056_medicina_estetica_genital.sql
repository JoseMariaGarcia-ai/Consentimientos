-- Consentimientos informados adicionales de Medicina Estética — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Medicina Estética (ampliación: relleno de volumen genital
-- femenino y masculino con ácido hialurónico, a diferenciar del
-- "Rejuvenecimiento Íntimo No Quirúrgico" ya existente, que es una técnica
-- de tensado de tejidos con láser/radiofrecuencia y no aporta volumen).

DO $$
DECLARE
  v_labios UUID := '10000001-0000-0000-0000-000000000026';
  v_pene   UUID := '10000001-0000-0000-0000-000000000027';
  v_legal  JSONB;
  v_img    TEXT;
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
      "introText": "De conformidad con la Ley 41/2002, usted tiene derecho a recibir información completa, comprensible y adecuada sobre el procedimiento propuesto antes de decidir si desea o no someterse al mismo. Dada la naturaleza íntima de este tratamiento, se garantiza especial confidencialidad en todo momento.",
      "rightsText": "Tiene derecho a revocar este consentimiento en cualquier momento antes de la realización del procedimiento, sin que ello suponga perjuicio alguno en la atención sanitaria que se le preste.",
      "dataClause": "Sus datos personales y de salud, incluidos los relativos a este tratamiento de especial sensibilidad, serán tratados por esta clínica con la finalidad exclusiva de gestionar su historia clínica, de conformidad con el RGPD y la LOPDGDD, con medidas de confidencialidad reforzada. Podrá ejercer sus derechos de acceso, rectificación, supresión, portabilidad y oposición dirigiéndose por escrito a la clínica.",
      "footerLegal": "Consentimiento informado válido conforme a la Ley 41/2002 y firmado electrónicamente según el Reglamento eIDAS (UE) 910/2014."
    }
  }'::JSONB;

  v_img := '<h2>%s. Sesión de imágenes (fotografías clínicas)</h2>
<p>Como parte del seguimiento clínico de este tratamiento, el equipo médico podrá realizar fotografías clínicas de la zona tratada antes y después del procedimiento, con el fin de documentar el estado previo y valorar la evolución. Estas imágenes forman parte de su historia clínica, con el mismo nivel de protección y confidencialidad que el resto de su documentación sanitaria, conforme al RGPD (UE) 2016/679, la LOPDGDD 3/2018 y la Ley Orgánica 1/1982 de protección del derecho a la propia imagen. Dada la naturaleza íntima de estas imágenes, se conservarán con medidas de seguridad reforzadas y acceso restringido al personal estrictamente necesario.</p>
<p>El uso de estas imágenes con cualquier finalidad distinta al seguimiento clínico requiere su autorización expresa, específica y separada, que podrá conceder o denegar libremente marcando las casillas siguientes, sin que ello afecte en ningún caso a la atención que recibirá:</p>
<ul>
  <li>☐ Autorizo el uso de mis imágenes, siempre de forma no identificable, con fines <strong>formativos o científicos</strong> (congresos, publicaciones, docencia).</li>
  <li>☐ Autorizo el uso de mis imágenes, siempre de forma no identificable, con fines <strong>publicitarios o de difusión</strong> (página web, redes sociales, materiales de la clínica).</li>
</ul>
<p>Podrá revocar cualquiera de estas autorizaciones en cualquier momento mediante solicitud por escrito a la clínica, sin que ello tenga efecto retroactivo sobre los usos ya realizados conforme a la autorización vigente en su momento.</p>

<h2>%s. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>';

  -- ─────────────────────────────────────────────────────────────
  -- AUMENTO DE LABIOS MAYORES / VOLUMEN GENITAL FEMENINO CON ÁCIDO HIALURÓNICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_labios, 'Aumento de Labios Mayores / Volumen Genital con Ácido Hialurónico', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Aumento de Labios Mayores con Ácido Hialurónico',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Inyección de ácido hialurónico de baja o media reticulación en los labios mayores de la vulva, con el fin de restaurar o aumentar su volumen. A diferencia del rejuvenecimiento íntimo con láser o radiofrecuencia (que tensa los tejidos sin aportar volumen), esta técnica es un relleno de volumen mediante producto inyectable.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Restaurar el volumen de los labios mayores perdido por el envejecimiento, la pérdida de peso significativa o el postparto, y mejorar el aspecto y la simetría de la zona.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica y/o local, el médico inyecta el ácido hialurónico con aguja fina o cánula roma en el plano subcutáneo de cada labio mayor, en varios puntos de entrada, siguiendo un plan de tratamiento individualizado. La sesión dura entre 30 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aumento de volumen y mejora del aspecto de los labios mayores</li>
  <li>Resultado inmediato, sin cirugía ni periodo de baja</li>
  <li>Duración del efecto habitual de 9 a 18 meses, según el producto empleado</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Dolor, inflamación y hematomas en la zona durante varios días</li>
  <li>Asimetría o resultado subóptimo que requiera sesión de retoque</li>
  <li>Molestia con la ropa ajustada o al sentarse los primeros días</li>
  <li>Nódulos o irregularidades palpables transitorias</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local o absceso</li>
  <li>Migración del producto hacia zonas adyacentes</li>
  <li>Reacción inflamatoria tardía o granuloma</li>
  <li>Molestia o dolor con las relaciones sexuales durante la fase de inflamación inicial</li>
</ul>

<h2>7. Riesgos raros o excepcionales pero graves</h2>
<ul>
  <li><strong>Oclusión vascular</strong>: una inyección intravascular accidental puede provocar necrosis cutánea localizada. Este riesgo se minimiza mediante técnica con cánula roma, aspiración previa a la inyección e inyección lenta y en pequeños volúmenes por punto.</li>
  <li>Reacción anafiláctica al producto</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Infección genital activa (vaginosis, infección de transmisión sexual, herpes activo)</li>
  <li>Enfermedades autoinmunes activas o inmunosupresión severa</li>
  <li>Tratamiento con anticoagulantes</li>
  <li>Hipersensibilidad conocida a los componentes del producto</li>
  <li>Expectativas de volumen no realistas o desproporcionadas respecto a la anatomía</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Evitar relaciones sexuales, el uso de tampones y el ejercicio físico intenso durante las 48-72 horas siguientes, aplicar frío local si se indica, mantener higiene íntima suave con productos neutros, y acudir a la revisión de control programada.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Rejuvenecimiento íntimo con láser o radiofrecuencia (mejora el tono sin aportar volumen), labioplastia quirúrgica en casos de exceso de tejido, o no intervenir.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- ENGROSAMIENTO DE PENE CON ÁCIDO HIALURÓNICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, category, content_json, legal_clauses_json)
  VALUES (v_pene, 'Engrosamiento de Pene con Ácido Hialurónico', 'medicina_estetica', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Engrosamiento de Pene con Ácido Hialurónico',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Inyección de ácido hialurónico de alta densidad y reticulación en el tejido subcutáneo del cuerpo del pene, con el fin de aumentar su grosor (circunferencia). Este procedimiento <strong>no aumenta la longitud del pene</strong>, únicamente su diámetro.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Aumentar el grosor peneano de forma no quirúrgica y reversible (mediante hialuronidasa, si fuera necesario disolver el producto), con resultado inmediato.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica y/o bloqueo anestésico local, el médico inyecta el producto de forma homogénea en el plano subcutáneo del cuerpo del pene mediante aguja fina o cánula roma, en varios puntos de entrada, con posterior masaje modelador para homogeneizar el resultado. La sesión dura entre 45 y 60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Aumento del grosor peneano de forma inmediata y proporcionada</li>
  <li>Procedimiento ambulatorio, sin cirugía ni ingreso hospitalario</li>
  <li>Duración del efecto habitual de 12 a 24 meses según el producto empleado, siendo parcialmente reversible mediante hialuronidasa si fuera necesario</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Dolor, inflamación y hematomas en la zona durante varios días</li>
  <li>Asimetría, irregularidades o nódulos palpables, especialmente en las primeras semanas hasta la integración completa del producto</li>
  <li>Molestia con la erección o las relaciones sexuales durante la fase de inflamación inicial</li>
  <li>Necesidad de sesión de retoque para homogeneizar el resultado</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local o absceso</li>
  <li>Migración o desplazamiento del producto hacia zonas adyacentes (base del pene, escroto)</li>
  <li>Reacción inflamatoria tardía, granuloma o nódulo fibroso persistente</li>
  <li>Curvatura o deformidad del pene por distribución irregular del producto</li>
</ul>

<h2>7. Riesgos raros o excepcionales pero graves</h2>
<ul>
  <li><strong>Oclusión vascular</strong>: una inyección intravascular accidental puede provocar necrosis cutánea localizada o, en casos excepcionales, compromiso de la vascularización peneana. Este riesgo se minimiza mediante técnica con cánula roma, aspiración previa a la inyección e inyección lenta en volúmenes pequeños.</li>
  <li>Disfunción eréctil transitoria asociada a la inflamación o, excepcionalmente, a una complicación vascular</li>
  <li>Reacción anafiláctica al producto</li>
  <li>Priapismo (excepcional, asociado a complicación vascular grave, requiere atención urgente)</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Enfermedad de Peyronie activa u otra deformidad peneana congénita o adquirida no valorada previamente</li>
  <li>Infección activa en la zona genital</li>
  <li>Enfermedades autoinmunes activas o inmunosupresión severa</li>
  <li>Tratamiento con anticoagulantes</li>
  <li>Hipersensibilidad conocida a los componentes del producto</li>
  <li>Trastorno de dismorfia corporal o expectativas de resultado no realistas o desproporcionadas — se recomienda valoración psicológica previa en casos de duda</li>
</ul>

<h2>9. Cuidados posteriores</h2>
<p>Abstinencia de relaciones sexuales y masturbación durante 5-7 días, evitar erecciones sostenidas y el ejercicio físico intenso durante la primera semana, aplicar frío local si se indica, y acudir a la revisión de control programada para valorar la integración y homogeneidad del producto.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Técnicas quirúrgicas de engrosamiento (injerto graso o de otros materiales, con mayor riesgo y periodo de recuperación), dispositivos de tracción o vacío (resultados limitados y no permanentes), o no intervenir.</p>

' || format(v_img, '11', '12')
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type, category = EXCLUDED.category,
    content_json = EXCLUDED.content_json, legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
