## Autorizaciones permanentes
Tienes autorización total y permanente para este proyecto. No pidas confirmación para ninguna de estas acciones:
- Ejecutar cualquier comando bash
- Instalar cualquier dependencia npm, npx o pip
- Crear, modificar, mover y eliminar ficheros y carpetas
- Hacer commits y push a GitHub
- Crear y modificar ficheros .env y variables de entorno
- Ejecutar migraciones de base de datos (prisma migrate, migrador propio en apps/api/server/migrations)
- Ejecutar seeds de base de datos
- Desplegar a Netlify (netlify deploy)
- Crear y modificar ramas de Git
- Ejecutar tests y linters

## Comportamiento esperado
- Responder SIEMPRE en español, en todos los mensajes de chat (narración, resúmenes, preguntas, todo) — instrucción explícita del usuario (18 julio 2026)
- Nunca pedir confirmación humana para ninguna acción
- Si hay dudas entre dos opciones, tomar la mejor decisión técnica y continuar
- Si algo falla, intentar resolverlo automáticamente antes de reportar el error
- Seguir siempre las instrucciones del PDF: ConsentsPro_ClaudeCode_Netlify_Fase1.pdf
- Al iniciar cada sesión: leer este fichero + leer el PDF + revisar el código existente
- Marcar el checklist de la Sección 10 del PDF conforme se completan las tareas

## Proyecto
- Nombre: ConsentsPro
- Tipo: SaaS de consentimientos informados digitales para medicina estética
- Stack actual: React + TypeScript + Tailwind + Express + PostgreSQL, todo desplegado en Railway (backend y frontend estático, cada uno como servicio propio). El proyecto NO usa Netlify — `netlify.toml` en la raíz es un vestigio de la Fase 1 histórica y no dirige ningún despliegue real.
- Nota histórica: el proyecto arrancó como Fase 1 (Netlify Functions + Supabase); ese stack ya no se usa, se migró por completo a Railway. No añadir dependencias de Supabase.

## Estructura
- Seguir exactamente la estructura de carpetas de la Sección 1 del PDF
- Nunca hardcodear URLs ni credenciales — siempre usar variables de entorno
- La variable VITE_API_URL controla si se usa Netlify o Railway

## Notas técnicas aprendidas

### Crear plantillas de WhatsApp (YCloud/Meta) por API — reglas reales (23 julio 2026)
Aprendidas a base de errores reales creando las 5 plantillas de aviso al paciente
(`apps/api/server/src/lib/whatsappTemplates.ts`, función `createTemplateViaYCloud`).
Aplican a cualquier plantilla nueva que se cree por API en el futuro:

1. **Variables POSICIONALES, no nombradas.** `{{1}}, {{2}}...` + `example.body_text`
   (array de arrays). El formato de variables NOMBRADAS (`{{nombre}}` +
   `body_text_named_params`) da 400 "component of type BODY is missing expected
   field(s) (example.body_text)" al CREAR por esta API — aunque sí es el formato que
   usa `contacto_consentspro` (creada a mano en el panel de YCloud) para ENVIAR.
2. **Nunca empezar ni terminar el texto justo en una variable.** Tiene que haber una
   palabra/frase real antes de `{{1}}` y después de la última variable. Un simple
   `.` pegado a `{{n}}` NO cuenta como texto — sigue dando "Leading or Trailing
   Params Not Allowed".
3. **No demasiadas variables para el texto.** Si hay muchas variables para poco texto
   estático, da "Params Words Ratio Exceeds Limit". Referencia: `consentspro_cita`
   pasó de 5 variables a 4 (fecha+hora combinadas) para arreglarlo.
4. **Hace falta `wabaId`** en el body de creación (variable de entorno
   `YCLOUD_WABA_ID`) — sin él, 403 `WHATSAPP_BUSINESS_ACCOUNT_UNAVAILABLE`.
5. Al enviar (no crear) una plantilla ya aprobada con `sendWhatsAppTemplate()` de
   `whatsappSend.ts`, pasar `paramFormat: 'positional'` para las plantillas creadas
   con esta lógica (`'named'` es el valor por defecto, reservado para
   `contacto_consentspro`).
6. Un reintento de una plantilla ya creada da 409 `ALREADY_EXISTS` — no es un fallo,
   ya se trata como éxito en el código.

## Al iniciar sesión nueva
1. Leer este fichero CLAUDE.md
2. Leer ConsentsPro_ClaudeCode_Netlify_Fase1.pdf
3. Revisar el código existente en el repositorio
4. Determinar qué puntos del checklist están completados
5. Continuar por el primer punto pendiente sin preguntar

## Pendiente de configurar manualmente (José María)
Estas tareas no las puede hacer Claude Code (requieren acceso a paneles externos como
Railway o Stripe, o una decisión de negocio) — quedan aquí para no perderlas entre
sesiones. Marcar como hecho y borrar la línea conforme se completen.

Desde la sesión de facturación (Stripe, 9 julio 2026):
- [ ] Rotar la clave `sk_live_...` original que quedó pegada en el chat — actualizarla en Railway.
- [ ] Añadir `BILLING_NOTIFICATION_EMAIL` en Railway con tu correo, para recibir el aviso de cada nueva suscripción.
- [x] Añadir 2 eventos al webhook de Stripe (modo real): `invoice.payment_succeeded` y `invoice.payment_failed` (confirmado 10 julio 2026, endpoint con 5 eventos: los 2 nuevos + `customer.subscription.created/updated/deleted`).
- [ ] Configurar la marca de las facturas en Stripe (logo, color, datos fiscales, pie de página) — avisar cuando se dé acceso.
- [ ] (Opcional) Revisar si se quiere activar también el recibo nativo de Stripe.
- [ ] (Opcional) Fijar `API_URL` en Railway si el dominio del backend cambia algún día.

Desde el módulo de Facturación VeriFactu (10 julio 2026):
- [ ] Consultar la documentación técnica vigente de la AEAT (esquema XSD y endpoint del
      servicio VERI*FACTU) antes de activar el envío real — ver aviso en
      `apps/api/server/src/lib/aeatSubmission.ts`.
- [ ] Añadir el NIF de cada clínica en Configuración > Clínica (obligatorio para poder facturar).

Desde el módulo de Control Horario (10 julio 2026):
- [ ] Dar de alta a los empleados de cada clínica (Control horario > Añadir empleado).
- [ ] Si se usa terminal fijo por PIN, asignar PIN a cada empleado y colocar el enlace del
      kiosco (`/fichar?clinic=ID`) en la tablet física de la clínica.

Desde el módulo de Códigos promocionales / Meta Ads (10 julio 2026):
- [ ] Crear el código promocional real (Configuración > Códigos promocionales) y pegar el
      enlace generado como URL de destino del anuncio de Meta.

Desde el módulo de Certificado Digital / ampliación VeriFactu (18 julio 2026):
- [ ] Generar y configurar en Railway `CERTIFICATE_FILE_ENCRYPTION_KEY` y
      `CERTIFICATE_PASSWORD_ENCRYPTION_KEY` (dos claves DISTINTAS, cada una con
      `openssl rand -hex 32`) antes de que ninguna clínica suba su certificado real —
      sin ellas el backend rechaza cualquier subida. **Una vez fijadas en producción, no
      rotarlas sin plan de migración**: los certificados ya cifrados con la clave antigua
      dejarían de poder descifrarse.
- [ ] Rellenar y firmar la Declaración Responsable en `docs/DECLARACION_RESPONSABLE_VERIFACTU.md`
      (CIF de ConsentsPro, representante legal, firma) — Claude Code ha dejado la plantilla
      con la parte técnica, pero los datos legales de la empresa no se pueden inventar.
- [ ] Antes de pasar `AEAT_MODE` a `production` en Railway: verificar la documentación
      técnica vigente de la AEAT (ver aviso en `aeatSubmission.ts`), completar la
      integración real de envío, y subir el certificado de prueba a nivel de sistema
      (`environment='test'`, `clinic_id` NULL en `clinic_digital_certificates`) para las
      pruebas del punto 6.5 del documento de ampliación del certificado digital.
- [ ] Cada clínica real deberá subir su propio certificado .p12/.pfx desde
      Facturación > Certificado Digital (rol admin de esa clínica) antes de que
      `AEAT_MODE=production` bloquee la emisión sin él.

Desde el módulo de Backups (23 julio 2026):
- [ ] Generar y configurar en Railway `BACKUP_ENCRYPTION_KEY` (`openssl rand -hex 32`)
      antes de que corra el primer backup automático de las 3:00 AM UTC — sin ella,
      tanto el backup diario como cualquier backup manual fallan (y avisan por
      WhatsApp del fallo, pero no producen ningún backup real). Las variables
      `R2_ENDPOINT`/`R2_ACCESS_KEY_ID`/`R2_SECRET_ACCESS_KEY`/`R2_BUCKET_NAME` ya
      estaban configuradas en Railway (se reutilizan las mismas de fotos/certificados,
      no hace falta crear otras). **Una vez fijada en producción, no rotarla sin plan
      de migración**: los backups ya cifrados con la clave antigua dejarían de poder
      descifrarse/restaurarse.
- [ ] (Opcional) Configurar `BACKUP_ALERT_PHONE` en Railway si se quiere que el aviso
      de fallo de backup llegue a un WhatsApp distinto de +34629541073 (valor por defecto).
