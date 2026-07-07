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
