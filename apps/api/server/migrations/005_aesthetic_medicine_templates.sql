-- supabase/migrations/005_aesthetic_medicine_templates.sql
-- Consentimientos informados de Medicina Estética — Legalidad española
-- Conforme a: Ley 41/2002 · RGPD (UE) 2016/679 · LOPDGDD 3/2018 · eIDAS 910/2014
-- Categoría: Medicina Estética

-- UUIDs fijos para upsert idempotente
DO $$
DECLARE
  v_ha    UUID := '10000001-0000-0000-0000-000000000001';
  v_btx   UUID := '10000001-0000-0000-0000-000000000002';
  v_caha  UUID := '10000001-0000-0000-0000-000000000003';
  v_plla  UUID := '10000001-0000-0000-0000-000000000004';
  v_meso  UUID := '10000001-0000-0000-0000-000000000005';
  v_peel  UUID := '10000001-0000-0000-0000-000000000006';
  v_skbst UUID := '10000001-0000-0000-0000-000000000007';
  v_legal JSONB;
BEGIN

  -- Marco legal español común
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
  -- 1. RELLENOS CON ÁCIDO HIALURÓNICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_ha, 'Rellenos con Ácido Hialurónico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Rellenos con Ácido Hialurónico',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El ácido hialurónico (AH) es un polisacárido natural presente en la dermis humana que disminuye con la edad. Los rellenos de AH son geles biocompatibles y biodegradables de origen no animal, esterilizados, que se inyectan en la dermis profunda o tejido subcutáneo para restaurar volumen, corregir surcos y arrugas, y redefinir contornos faciales.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corrección de arrugas nasolabiales, código de barras, surcos del mentón, aumento de labios, relleno de ojeras, proyección de pómulos, definición de mandíbula, reposición volumétrica facial o tratamiento de manos.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa aplicación de anestesia tópica (crema EMLA u otra), el médico inyecta el gel con aguja fina o cánula roma según la zona a tratar. La sesión dura entre 20 y 45 minutos. El resultado es inmediatamente visible y se consolida a las 2 semanas.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Corrección inmediata de surcos y pérdida de volumen</li>
  <li>Resultado natural y reversible con hialuronidasa</li>
  <li>Sin período de recuperación significativo</li>
  <li>Duración entre 9 y 18 meses según la zona y el producto</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema, edema e hematomas en la zona de inyección (resolución en 3–7 días)</li>
  <li>Dolor o sensibilidad local transitoria</li>
  <li>Efecto Tyndall (coloración azulada en planos superficiales)</li>
  <li>Asimetría o resultado subóptimo que requiera retoque</li>
  <li>Irregularidades palpables o nódulos</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local o absceso</li>
  <li>Reacción inflamatoria tardía o granuloma</li>
  <li>Hipersensibilidad o reacción alérgica</li>
  <li>Migración del material</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li><strong>Oclusión vascular</strong>: obstrucción de un vaso sanguíneo que puede provocar necrosis cutánea o, excepcionalmente, afectación visual (amaurosis) si se produce embolismo retrógrado en arterias con anastomosis hacia la arteria oftálmica. Este es el riesgo más grave asociado al procedimiento.</li>
  <li>Ceguera parcial o total por embolismo vascular retiniano</li>
  <li>Reactivación de herpes labial</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedades autoinmunes activas o inmunosupresión severa</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Tratamiento con anticoagulantes (valorar caso por caso)</li>
  <li>Hipersensibilidad conocida a los componentes del producto</li>
  <li>Menos de 6 meses desde inyección de relleno permanente en la misma zona</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>Biorrestimuladores (hidroxiapatita cálcica, ácido poliláctico), toxina botulínica, bioestimulación con PRP, tratamientos de radiofrecuencia, HIFU, o cirugía plástica facial.</p>

<h2>10. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 2. TOXINA BOTULÍNICA
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_btx, 'Toxina Botulínica (Bótox)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Toxina Botulínica (Bótox)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La toxina botulínica tipo A (TB-A) es una neurotoxina purificada de origen bacteriano (<em>Clostridium botulinum</em>) que, aplicada en dosis terapéuticas muy bajas, produce una relajación muscular selectiva y reversible. En medicina estética se utiliza para reducir arrugas de expresión y para indicaciones terapéuticas como hiperhidrosis, bruxismo o migraña.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Reducción o eliminación de arrugas dinámicas (frente, entrecejo, patas de gallo, cuello), elevación de cejas (brow lift), corrección de asimetrías, tratamiento de hiperhidrosis axilar/palmar/plantar, bruxismo, sonrisa gingival o migraña crónica.</p>

<h2>3. Cómo se realiza</h2>
<p>El médico administra pequeñas cantidades del producto mediante microinyecciones intradérmicas o intramusculares con aguja muy fina. La sesión dura entre 15 y 30 minutos. El efecto máximo se aprecia entre los días 7 y 14 tras el tratamiento.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Reducción visible de arrugas de expresión</li>
  <li>Efecto natural con musculatura parcialmente activa</li>
  <li>Sin recuperación significativa</li>
  <li>Duración de 3 a 6 meses según la zona y dosis</li>
  <li>Reversible de forma natural al metabolizarse el producto</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Hematoma, eritema o dolor en el punto de inyección (resolución en 24–72 h)</li>
  <li>Cefalea transitoria (primeras 24 horas)</li>
  <li>Asimetría o resultado subóptimo</li>
  <li>Sensación de tensión o pesadez en la zona tratada</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li><strong>Ptosis palpebral</strong>: caída del párpado superior por difusión involuntaria del producto al músculo elevador del párpado. Reversible en 4–12 semanas.</li>
  <li>Ptosis de ceja</li>
  <li>Diplopía transitoria</li>
  <li>Dificultad para fruncir el ceño o asimetría de expresión</li>
  <li>Sequedad ocular o lagrimeo excesivo</li>
  <li>En hiperhidrosis: compensación sudorípara en otras zonas</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Resistencia o inmunidad al producto por formación de anticuerpos neutralizantes</li>
  <li>Disfagia si se trata la zona cervical</li>
  <li>Reacción anafiláctica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Enfermedades neuromusculares (miastenia gravis, síndrome de Eaton-Lambert, ELA)</li>
  <li>Tratamiento con aminoglucósidos, penicilamina, quinina o bloqueantes del calcio (interacción farmacológica)</li>
  <li>Infección activa en la zona a tratar</li>
  <li>Hipersensibilidad conocida a cualquier componente de la fórmula</li>
  <li>Coagulopatías no controladas</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>Rellenos de ácido hialurónico, biorrestimuladores, técnicas de radiofrecuencia, HIFU, peelings, mesoterapia o cirugía (ritidectomía, blefaroplastia).</p>

<h2>10. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 3. INDUCTOR DE COLÁGENO — HIDROXIAPATITA CÁLCICA (CaHA)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_caha, 'Inductor de Colágeno — Hidroxiapatita Cálcica (CaHA)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Inductor de Colágeno con Hidroxiapatita Cálcica',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La hidroxiapatita cálcica (CaHA) es un mineral biocompatible idéntico al componente inorgánico del hueso humano. En suspensión en un gel de carboximetilcelulosa, actúa como biorrestimulador dérmico de doble acción: efecto volumétrico inmediato por el gel vehículo y estimulación progresiva de la neocolagénesis y neovascularización por las microesferas de CaHA. Producto de referencia: Radiesse®.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Corrección de pliegues nasolabiales profundos, restauración volumétrica facial (pómulos, mandíbula, mentón), rejuvenecimiento de manos, mejora de la calidad y firmeza cutánea, y tratamiento de lipodistrofia en otras áreas corporales.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa anestesia tópica y/o bloqueo anestésico local, el médico inyecta el producto con cánula roma o aguja en el plano supraperióstico o subcutáneo profundo. La sesión dura entre 30 y 60 minutos. El efecto volumétrico es inmediato; la remodelación por colágeno se aprecia a partir de las 6–8 semanas y continúa hasta los 12–18 meses.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Corrección volumétrica inmediata</li>
  <li>Mejora progresiva de la calidad cutánea por neocolagénesis</li>
  <li>Duración de 12 a 18 meses (superior al ácido hialurónico)</li>
  <li>Producto no reversible con hialuronidasa pero biodegradable de forma natural</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Edema, eritema y hematomas postprocedimiento (resolución en 5–10 días)</li>
  <li>Dolor moderado durante la inyección</li>
  <li>Palpación del material en zonas de piel fina (labios, párpados) — contraindicado en estas zonas</li>
  <li>Asimetría o resultado subóptimo</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Nódulos o papules visibles por técnica incorrecta o inyección demasiado superficial</li>
  <li>Infección local</li>
  <li>Reacción inflamatoria tardía</li>
  <li>Migración del producto (mínima con técnica correcta)</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Oclusión vascular con posible necrosis cutánea</li>
  <li>Granuloma de cuerpo extraño</li>
  <li>Reacción alérgica sistémica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Hipersensibilidad conocida a la CaHA o al carboximetilcelulosa</li>
  <li>Infección activa en la zona de inyección</li>
  <li>Enfermedades autoinmunes activas</li>
  <li>Tratamiento anticoagulante (valorar caso por caso)</li>
  <li>Zonas de piel muy fina (labios, periorbitaria) — riesgo de nódulos visibles</li>
</ul>

<h2>9. Alternativas terapéuticas</h2>
<p>Ácido hialurónico, ácido poliláctico (PLLA), PRP, radiofrecuencia, HIFU, cirugía de rejuvenecimiento facial.</p>

<h2>10. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 4. INDUCTOR DE COLÁGENO — ÁCIDO POLILÁCTICO (PLLA)
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_plla, 'Inductor de Colágeno — Ácido Poliláctico (PLLA)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Inductor de Colágeno con Ácido Poliláctico (PLLA)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El ácido poli-L-láctico (PLLA) es un polímero biodegradable sintético de la familia de los alfa-hidroxiácidos, biocompatible y reabsorbible, que actúa como biorrestimulador de nueva generación. Al inyectarse, estimula de forma progresiva la producción de colágeno tipo I y III en la dermis, restaurando el soporte estructural perdido con la edad. No produce efecto volumétrico inmediato. Producto de referencia: Sculptra®.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de lipoatrofia facial, corrección progresiva de la pérdida de volumen global, mejora de arrugas profundas, rejuvenecimiento de escote, cuello y zonas corporales (glúteos, muslos, abdomen). Se requieren habitualmente 2–3 sesiones separadas por 4–6 semanas.</p>

<h2>3. Cómo se realiza</h2>
<p>El vial liofilizado se reconstituye con agua estéril y lidocaína 24–72 horas antes del procedimiento. Previa anestesia tópica y/o local, se inyecta en el plano subdérmico o supraperióstico mediante técnica de depósito o abanico con cánula. El médico realizará masaje inmediatamente y el paciente deberá masajear la zona 5 minutos, 5 veces al día durante 5 días (regla 5-5-5). La sesión dura 30–60 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora progresiva y natural de la calidad y volumen cutáneo</li>
  <li>Los resultados aparecen a partir de las 6–8 semanas y se consolidan a los 3–6 meses</li>
  <li>Efecto duradero: hasta 25 meses según estudios clínicos</li>
  <li>Aspecto completamente natural al no haber relleno inmediato</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Edema, eritema y hematomas postprocedimiento (resolución en 5–10 días)</li>
  <li>Dolor durante la infiltración</li>
  <li>Nódulos subcutáneos palpables (especialmente si no se sigue la regla 5-5-5)</li>
  <li>Asimetría o resultado subóptimo que requiera sesión adicional</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Nódulos visibles o pápulas</li>
  <li>Infección local</li>
  <li>Reacción inflamatoria tardía (puede aparecer meses después)</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Granuloma de cuerpo extraño de difícil resolución</li>
  <li>Oclusión vascular</li>
  <li>Reacción alérgica o hipersensibilidad sistémica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Hipersensibilidad conocida al PLLA o excipientes</li>
  <li>Infección activa en la zona de inyección</li>
  <li>Zonas de piel muy fina (labios, párpados)</li>
  <li>Enfermedades inflamatorias o autoinmunes activas</li>
  <li>Tratamiento anticoagulante (valorar)</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<p><strong>Es imprescindible</strong> realizar masaje en la zona tratada 5 minutos, 5 veces al día, durante los 5 días posteriores a cada sesión. El incumplimiento de esta indicación aumenta significativamente el riesgo de formación de nódulos.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Ácido hialurónico, hidroxiapatita cálcica, PRP, radiofrecuencia, HIFU o cirugía.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, incluida la instrucción de masaje postprocedimiento, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 5. MESOTERAPIA FACIAL Y CORPORAL
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_meso, 'Mesoterapia Facial y Corporal', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Mesoterapia Facial y Corporal',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>La mesoterapia es una técnica médica que consiste en la administración de microinyecciones intradérmicas o subcutáneas de mezclas de principios activos (vitaminas, aminoácidos, ácido hialurónico no reticulado, minerales, factores de crecimiento u otros) directamente en la zona de tratamiento. Actúa de forma localizada mejorando la hidratación, luminosidad, firmeza y composición de la piel, así como favoreciendo la reducción de acumulaciones de grasa localizada.</p>

<h2>2. Objetivo del tratamiento</h2>
<ul>
  <li><strong>Facial:</strong> hidratación profunda, luminosidad, reducción de arrugas finas, tratamiento del melasma o hiperpigmentaciones, alopecia</li>
  <li><strong>Corporal:</strong> reducción de grasa localizada (lipolisis), celulitis, flacidez, estrías, rejuvenecimiento de escote/cuello/manos</li>
</ul>
<p>Se requieren habitualmente entre 4 y 8 sesiones para obtener resultados óptimos.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa aplicación de anestesia tópica si se considera necesario, el médico administra las microinyecciones con aguja ultrafina (30G o 32G) o mediante mesogun a profundidad controlada (1–4 mm intradérmico, 4–13 mm subcutáneo). La sesión tiene una duración de 20 a 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Mejora de la hidratación, textura y luminosidad cutánea</li>
  <li>Reducción de arrugas finas y mejoría de la firmeza</li>
  <li>Reducción progresiva de acumulaciones de grasa localizada (mesoterapia corporal)</li>
  <li>Mejora de la celulitis y la flacidez</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema, edema y hematomas en la zona tratada (resolución en 24–72 h)</li>
  <li>Prurito o sensación de quemazón transitoria</li>
  <li>Pequeñas pápulas o habones en los puntos de inyección (resolución en horas)</li>
  <li>Dolor durante la aplicación</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección cutánea o absceso</li>
  <li>Hiperpigmentación postinflamatoria</li>
  <li>Nódulos o quistes de inclusión</li>
  <li>Reacción alérgica a alguno de los principios activos</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Necrosis cutánea</li>
  <li>Lipodistrofia yatrogénica</li>
  <li>Reacción sistémica grave o anafilaxia</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Alergia conocida a alguno de los componentes de la mezcla</li>
  <li>Infección activa en la zona de tratamiento</li>
  <li>Enfermedades autoinmunes activas</li>
  <li>Tratamiento anticoagulante o antiplaquetario (valorar)</li>
  <li>Diabetes mellitus descompensada</li>
  <li>Cáncer activo</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<p>Evitar exposición solar directa en las 48 horas siguientes. No aplicar maquillaje ni cremas no recomendadas por el médico durante las primeras 24 horas. Evitar actividad física intensa y saunas durante 24 horas.</p>

<h2>10. Alternativas terapéuticas</h2>
<p>Skin boosters, PRP, peelings, radiofrecuencia, criolipólisis (corporal), técnicas de drenaje linfático o tratamientos tópicos de mantenimiento.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 6. PEELING QUÍMICO MÉDICO
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_peel, 'Peeling Químico Médico', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Peeling Químico Médico',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>El peeling químico médico consiste en la aplicación controlada de agentes queratolíticos o cáusticos sobre la piel para producir su descamación y renovación celular. Según la profundidad de actuación se clasifican en:</p>
<ul>
  <li><strong>Superficiales</strong> (ácido glicólico, ácido mandélico, ácido salicílico, ácido láctico): actúan en la epidermis</li>
  <li><strong>Medios</strong> (TCA 20–35 %, combinaciones de Jessner+TCA, ácido pirúvico): llegan a dermis papilar</li>
  <li><strong>Profundos</strong> (fenol, TCA &gt;35 %): llegan a dermis reticular — uso hospitalario</li>
</ul>

<h2>2. Objetivo del tratamiento</h2>
<p>Tratamiento de arrugas finas, fotoenvejecimiento, manchas (melasma, léntigos, hiperpigmentaciones postinflamatorias), acné activo y cicatrices superficiales de acné, poros dilatados, textura irregular y queratosis seborreicas superficiales.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa limpieza profunda y desengrasado de la piel, el médico aplica el agente químico con pincel, gasa o hisopo de forma uniforme. El tiempo de contacto varía según el tipo de peeling y la respuesta cutánea (eritema, frost). Al finalizar se neutraliza o se deja evolucionar según el protocolo. La sesión dura entre 20 y 45 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Renovación celular acelerada y mejora de la textura</li>
  <li>Reducción de manchas y uniformización del tono</li>
  <li>Estimulación de colágeno dérmico</li>
  <li>Reducción de arrugas superficiales y poros dilatados</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema intenso (puede durar varios días según profundidad)</li>
  <li>Descamación visible durante 3–7 días</li>
  <li>Sensación de tensión, prurito o quemazón</li>
  <li>Fotosensibilidad aumentada durante el proceso de regeneración</li>
  <li>Resultado subóptimo que requiera sesiones adicionales</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li><strong>Hiperpigmentación postinflamatoria</strong>: especialmente en fototipos altos (III–VI de Fitzpatrick)</li>
  <li>Hipopigmentación o despigmentación en peelings profundos</li>
  <li>Infección bacteriana, vírica (reactivación herpes) o fúngica</li>
  <li>Eccema de contacto o reacción alérgica</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Cicatrices (queloides o hipertróficas) en peelings medios o profundos</li>
  <li>Toxicidad sistémica por absorción percutánea (fenol: cardiotoxicidad)</li>
  <li>Eritema persistente o telangiectasias</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Uso de isotretinoína oral en los últimos 6 meses</li>
  <li>Infección activa (herpes, impétigo) en la zona de tratamiento</li>
  <li>Dermatitis activa, rosácea inflamatoria o psoriasis en la zona</li>
  <li>Exposición solar reciente sin fotoprotección o bronceado activo</li>
  <li>Hipersensibilidad conocida al agente químico utilizado</li>
  <li>Cicatrices queloides o hipertróficas previas</li>
</ul>

<h2>9. Cuidados postprocedimiento (imprescindibles)</h2>
<ul>
  <li>Fotoprotección solar estricta (SPF 50+) durante mínimo 4 semanas</li>
  <li>No rascar, despegar ni frotar la piel durante la fase de descamación</li>
  <li>Aplicar los productos hidratantes y calmantes prescritos</li>
  <li>Evitar exposición solar directa hasta la completa regeneración cutánea</li>
  <li>No usar maquillaje hasta que el médico lo autorice</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Láser fraccionado, microdermoabrasión, dermapen/microagujas, mesoterapia despigmentante, tratamientos tópicos médicos.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, incluidas las instrucciones de cuidado postprocedimiento, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

  -- ─────────────────────────────────────────────────────────────
  -- 7. SKIN BOOSTER
  -- ─────────────────────────────────────────────────────────────
  INSERT INTO consent_templates (id, treatment_type, content_json, legal_clauses_json)
  VALUES (v_skbst, 'Skin Booster (Redensificador Cutáneo)', jsonb_build_object(
    'es-ES', jsonb_build_object(
      'title', 'Consentimiento Informado — Skin Booster (Redensificador Cutáneo)',
      'body', '<h2>1. Descripción del procedimiento</h2>
<p>Los skin boosters son formulaciones de ácido hialurónico no reticulado o mínimamente reticulado de baja viscosidad (y en algunos casos con vitaminas, aminoácidos o antioxidantes añadidos) que se inyectan de forma superficial en la dermis para mejorar la hidratación intrínseca, la elasticidad y la calidad global de la piel, sin producir efecto volumétrico. Productos de referencia: Restylane Skinboosters®, Juvederm Volite®, Profhilo®, Teosyal Redensity I®, entre otros.</p>

<h2>2. Objetivo del tratamiento</h2>
<p>Mejora profunda de la hidratación cutánea, reducción de arrugas finas y flacidez superficial, aumento de la elasticidad y luminosidad, tratamiento del cuello, escote y manos. Especialmente indicado en pieles deshidratadas, apagadas o con signos de envejecimiento cutáneo inicial. Se recomienda una pauta inicial de 2–3 sesiones separadas por 4 semanas y mantenimiento semestral o anual.</p>

<h2>3. Cómo se realiza</h2>
<p>Previa aplicación de anestesia tópica, el médico realiza microinyecciones intradérmicas muy superficiales (técnica papular, retrotraza o mesoterapia serial) con aguja ultrafina de 30G o 32G en la zona indicada. En algunos productos (Profhilo) se emplean puntos de bio-remodelación específicos. La sesión dura entre 20 y 40 minutos.</p>

<h2>4. Beneficios esperados</h2>
<ul>
  <li>Hidratación intensa y duradera desde la primera sesión</li>
  <li>Mejora de la textura, firmeza y luminosidad cutánea</li>
  <li>Reducción de arrugas finas y superficiales</li>
  <li>Efecto natural y progresivo; sin modificación del contorno ni volumen</li>
  <li>Duración del efecto entre 6 y 12 meses según producto y protocolo</li>
</ul>

<h2>5. Riesgos frecuentes (&gt;1 %)</h2>
<ul>
  <li>Eritema, edema y pequeños hematomas en los puntos de inyección (resolución en 24–72 h)</li>
  <li>Pápulas o pequeñas elevaciones en los puntos de inyección (desaparecen en horas o días)</li>
  <li>Sensación de tensión, prurito o leve quemazón</li>
  <li>Dolor durante la aplicación</li>
</ul>

<h2>6. Riesgos poco frecuentes (&lt;1 %)</h2>
<ul>
  <li>Infección local o absceso</li>
  <li>Efecto Tyndall (coloración azulada) si la inyección es demasiado superficial</li>
  <li>Reacción de hipersensibilidad o alérgica</li>
  <li>Nódulos persistentes</li>
</ul>

<h2>7. Riesgos raros o excepcionales (&lt;0,1 %)</h2>
<ul>
  <li>Oclusión vascular con posible necrosis cutánea</li>
  <li>Granuloma de cuerpo extraño</li>
  <li>Reacción anafiláctica</li>
</ul>

<h2>8. Contraindicaciones</h2>
<ul>
  <li>Embarazo o lactancia</li>
  <li>Hipersensibilidad conocida al ácido hialurónico o excipientes</li>
  <li>Infección activa en la zona de tratamiento</li>
  <li>Enfermedades autoinmunes activas o inmunosupresión severa</li>
  <li>Tratamiento anticoagulante (valorar riesgo de hematomas)</li>
  <li>Tendencia a cicatrices queloides</li>
</ul>

<h2>9. Cuidados postprocedimiento</h2>
<ul>
  <li>Evitar maquillaje durante las primeras 12 horas</li>
  <li>No masajear la zona tratada salvo indicación médica expresa</li>
  <li>Fotoprotección solar diaria (SPF 30+)</li>
  <li>Evitar exposición solar directa, calor excesivo y actividad física intensa durante 24 horas</li>
</ul>

<h2>10. Alternativas terapéuticas</h2>
<p>Mesoterapia vitamínica, PRP, rellenos de ácido hialurónico, biorrestimuladores, radiofrecuencia o tratamientos tópicos de cosmética médica.</p>

<h2>11. Declaración del paciente</h2>
<p>El/La paciente declara haber leído y comprendido la información anterior, haber tenido la oportunidad de formular preguntas al médico y haberlas recibido contestadas de forma satisfactoria. Consiente voluntariamente la realización del procedimiento descrito, conociendo que puede revocarlo en cualquier momento antes de su inicio.</p>'
    )
  ), v_legal)
  ON CONFLICT (id) DO UPDATE SET
    treatment_type = EXCLUDED.treatment_type,
    content_json = EXCLUDED.content_json,
    legal_clauses_json = EXCLUDED.legal_clauses_json;

END $$;
