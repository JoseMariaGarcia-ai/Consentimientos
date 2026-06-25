# ConsentsPro — Guía de Migración a Railway

> Tiempo estimado total: **3-5 días**  
> 7 de 12 componentes no cambian absolutamente nada.

---

## Cuándo migrar

Migra a Railway cuando necesites:
- Timestamp certificado en firmas (eIDAS Fase 2)
- PDF generado en servidor con Puppeteer (calidad legal)
- Jobs en background sin timeout de 10 segundos
- Redis para sesiones o colas

---

## Los 10 pasos

### Paso 1 — Crear proyecto en Railway (5 min)
```bash
# Instalar Railway CLI
npm install -g @railway/cli
railway login
railway init  # Desde la raíz del repo
```

### Paso 2 — Provisionar PostgreSQL en Railway (10 min)
1. En Railway Dashboard → New Service → Database → PostgreSQL
2. Copiar `DATABASE_URL` de las variables del servicio
3. Ejecutar el mismo schema de Supabase en Railway:
```bash
psql $RAILWAY_DATABASE_URL < supabase/migrations/001_init.sql
```

### Paso 3 — Migrar datos de Supabase → Railway PostgreSQL (1-2h)
```bash
# Exportar desde Supabase
pg_dump $SUPABASE_DB_URL --no-owner --no-acl -f backup.sql

# Importar en Railway
psql $RAILWAY_DATABASE_URL < backup.sql
```

### Paso 4 — Activar el servidor Express (30 min)
El código ya existe en `apps/api/server/`. Solo hay que conectarlo:

```bash
cd apps/api/server
npm install
```

Descomentar las rutas en `src/index.ts`:
```typescript
import { handlePatients } from './routes/patients'
app.all('/api/patients*', authMiddleware, async (req, res) => {
  const result = await handlePatients(req.method, req.path.replace('/api',''), req.body, req.headers.authorization!)
  res.status(result.status).json(result.body)
})
// Repetir para /doctors, /clinic, /consents, /signature, /translate, /verify
```

### Paso 5 — Actualizar variable de entorno frontend (5 min)
```bash
# En Netlify Dashboard → Environment Variables
# Cambiar SOLO esta línea:
VITE_API_URL=https://tu-proyecto.railway.app/api
# (antes era: https://tu-proyecto.netlify.app/.netlify/functions)
```
**El frontend no cambia ni una línea de código.**

### Paso 6 — Activar timestamp certificado en firma (2-3h)
En `apps/api/server/src/routes/signature.ts`, añadir al `handleSignature()`:
```typescript
// Antes (Netlify/Fase 1) - timestamp del servidor sin certificar
const serverTimestamp = new Date().toISOString()

// Después (Railway/Fase 2) - mismo código, distinto entorno
// El timestamp de un servidor persistente 24/7 es eIDAS válido
// Añadir IP y User-Agent:
const serverTimestamp = new Date().toISOString()
const ipAddress = req.ip
const userAgent = req.headers['user-agent']
```

El campo `server_timestamp` en BD ya existe desde Fase 1, solo se empieza a usar.

### Paso 7 — Activar Puppeteer para PDF (1 día)
```bash
cd apps/api/server
npm install puppeteer
```

En `apps/api/server/src/services/consentPdf.ts`:
```typescript
import puppeteer from 'puppeteer'
export async function generatePdfWithPuppeteer(consentData) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setContent(renderConsentHtml(consentData))
  const pdf = await page.pdf({ format: 'A4', printBackground: true })
  await browser.close()
  return pdf
}
```

### Paso 8 — Migrar Storage de Supabase → Cloudflare R2 (1 día)
```bash
# Instalar Cloudflare R2 SDK
cd apps/api/server && npm install @aws-sdk/client-s3

# Actualizar referencias de storage en el código
# supabase.storage.from('pdfs') → r2Client.upload(...)
```

### Paso 9 — Añadir Redis para sesiones (1-2h)
1. En Railway → New Service → Redis
2. Copiar `REDIS_URL`
3. En `apps/api/server/src/index.ts`:
```typescript
import session from 'express-session'
import connectRedis from 'connect-redis'
import { createClient } from 'redis'

const redisClient = createClient({ url: process.env.REDIS_URL })
```

### Paso 10 — Apagar Netlify Functions (5 min)
En `apps/web/netlify.toml`, comentar el bloque `[functions]`:
```toml
# [functions]
#   directory = "../api/netlify/functions"
```

El frontend solo habla con `VITE_API_URL` — ya apunta a Railway desde el Paso 5.

---

## Resumen de cambios por componente

| Componente | Fase 1 | Fase 2 | Esfuerzo |
|---|---|---|---|
| Frontend React | Netlify (sin cambios) | Netlify (sin cambios) | 0 min |
| i18n / idiomas | Navegador (sin cambios) | Navegador (sin cambios) | 0 min |
| LanguageSelector | Sin cambios | Sin cambios | 0 min |
| Auth Magic Link | Supabase Auth | Supabase Auth (se mantiene) | 0 min |
| Netlify Functions | Activas | Desactivadas | 5 min |
| Express/Fastify API | Preparado, inactivo | Activo en Railway | 30 min |
| PostgreSQL | Supabase | Railway (pg_dump/restore) | 1-2h |
| Storage fotos/PDFs | Supabase Storage | Cloudflare R2 | 1 día |
| PDF generation | react-pdf cliente | Puppeteer servidor | 1 día |
| Timestamp firma | Cliente (limitado) | Servidor (eIDAS válido) | 2-3h |
| Redis sesiones | No (JWT simple) | Railway Redis | 1-2h |
| VITE_API_URL | netlify.app/functions | railway.app/api | 5 min |

---

## Variables de entorno a añadir en Railway

```env
DATABASE_URL=postgresql://user:pass@railway-host:5432/consentspro
REDIS_URL=redis://railway-host:6379
JWT_SECRET=genera-con-openssl-rand-hex-32
SUPABASE_URL=https://xxxx.supabase.co         # Se mantiene para Auth
SUPABASE_SERVICE_KEY=eyJhbGc...               # Se mantiene para Auth
ANTHROPIC_API_KEY=sk-ant-...
APP_URL=https://tu-proyecto.netlify.app
NODE_ENV=production
PORT=3001
```

---

*ConsentsPro SaaS · Guía de migración v1.0 · Preparada desde Fase 1*
