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

## Configuración manual pendiente (Stripe / Facturación)
Estas tareas solo las puede hacer José María (Claude no tiene acceso a Railway ni a Stripe desde este entorno — red bloqueada a nivel de infraestructura, no es un tema de permisos). Marcar como hechas conforme se completen.

- [ ] Rotar la clave `sk_live_...` original de Stripe (quedó pegada en el chat al principio de la integración). Stripe Dashboard → Developers → API keys → Roll key. Si se rota, actualizar `STRIPE_SECRET_KEY` en Railway y volver a desplegar.
- [ ] Añadir en Railway (servicio del backend, ej. "practical-prosperity") la variable `BILLING_NOTIFICATION_EMAIL` = correo donde José María quiere recibir el aviso de cada nueva suscripción contratada. Guardar y pulsar Deploy.
- [ ] En Stripe Dashboard → Developers → Webhooks (modo real/live) → editar el endpoint que apunta a `.../api/billing/webhook` → añadir estos 2 eventos nuevos a los 3 que ya tiene (`customer.subscription.created/updated/deleted`):
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
- [ ] Configurar la marca de las facturas en Stripe (requiere que José María dé acceso a Stripe primero, avisará cuando quiera): Settings → Branding (logo, color) y Settings → Invoice template (razón social, NIF/CIF, dirección, email de soporte, texto de pie de página, numeración).
- [ ] Opcional: revisar en Stripe Settings → Customer emails si se quiere activar también el recibo nativo de Stripe (ya existe uno propio de ConsentsPro por email, esto sería redundante salvo que se prefiera tenerlo también).
- [ ] Opcional: fijar `API_URL` en Railway si el dominio público del backend cambia alguna vez (si no se define, se usa `RAILWAY_PUBLIC_DOMAIN` automáticamente).

Contexto: la integración de Stripe (checkout, webhook, portal de cliente, panel de Suscripciones en Configuración, emails automáticos de renovación/fallo de cobro/desactivación, datos fiscales por clínica) ya está implementada y desplegada. El alta de clínicas nuevas desde la web pública (pago → creación automática de cuenta → magic link → email de bienvenida con guía por plan) está en construcción.
