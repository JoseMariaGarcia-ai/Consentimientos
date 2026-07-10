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
- Nunca pedir confirmación humana para ninguna acción
- Si hay dudas entre dos opciones, tomar la mejor decisión técnica y continuar
- Si algo falla, intentar resolverlo automáticamente antes de reportar el error
- Seguir siempre las instrucciones del PDF: ConsentsPro_ClaudeCode_Netlify_Fase1.pdf
- Al iniciar cada sesión: leer este fichero + leer el PDF + revisar el código existente
- Marcar el checklist de la Sección 10 del PDF conforme se completan las tareas

## Proyecto
- Nombre: ConsentsPro
- Tipo: SaaS de consentimientos informados digitales para medicina estética
- Stack actual: React + TypeScript + Tailwind + Express + PostgreSQL, desplegado en Railway (backend) y Netlify/Railway (frontend estático)
- Nota histórica: el proyecto arrancó como Fase 1 (Netlify Functions + Supabase); ese stack ya no se usa, se migró por completo a Railway. No añadir dependencias de Supabase.

## Estructura
- Seguir exactamente la estructura de carpetas de la Sección 1 del PDF
- Nunca hardcodear URLs ni credenciales — siempre usar variables de entorno
- La variable VITE_API_URL controla si se usa Netlify o Railway

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
