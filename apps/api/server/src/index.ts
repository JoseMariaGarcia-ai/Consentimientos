import express from 'express'
import cors from 'cors'
import { authMiddleware, requireAdmin, requireSuperAdmin, requireModuleAccess } from './middleware/auth'
import { deviceAuthMiddleware } from './middleware/deviceAuth'
import authRouter from './routes/auth'
import patientsRouter from './routes/patients'
import doctorsRouter from './routes/doctors'
import consentsRouter from './routes/consents'
import clinicRouter from './routes/clinic'
import signatureRouter from './routes/signature'
import verifyRouter from './routes/verify'
import translateRouter from './routes/translate'
import usersRouter from './routes/users'
import photosRouter from './routes/photos'
import pdfRouter from './routes/pdf'
import clinicalRecordsRouter from './routes/clinicalRecords'
import photoSessionsRouter from './routes/photoSessions'
import creditsRouter from './routes/credits'
import mediaRouter from './routes/media'
import labPartnersRouter from './routes/labPartners'
import patientPortalRouter from './routes/patientPortal'
import treatmentsRouter from './routes/treatments'
import appointmentsRouter from './routes/appointments'
import scheduleRouter from './routes/schedule'
import meRouter from './routes/me'
import toxinRouter from './routes/toxin'
import clinicConfigRouter from './routes/clinicConfig'
import whatsappRouter, { webhookRouter as whatsappWebhookRouter } from './routes/whatsapp'
import planPermissionsRouter from './routes/planPermissions'
import budgetsRouter from './routes/budgets'
import odontogramRouter from './routes/odontogram'
import invoicesRouter from './routes/invoices'
import timeTrackingRouter, { publicRouter as timeTrackingPublicRouter } from './routes/timeTracking'
import workflowsRouter from './routes/workflows'
import analyticsRouter, { publicRouter as analyticsPublicRouter } from './routes/analytics'
import ticketsRouter from './routes/tickets'
import signingDevicesRouter, { publicRouter as signingDevicesPublicRouter } from './routes/signingDevices'
import signingKioskRouter from './routes/signingKiosk'
import consentHandoffRouter from './routes/consentHandoff'
import billingRouter, { webhookRouter as billingWebhookRouter, publicRouter as billingSignupRouter } from './routes/billing'
import { publicRouter as billingActionRouter } from './routes/billingActions'
import promoCodesRouter from './routes/promoCodes'
import aiCreditsRouter from './routes/aiCredits'
import aiRevenueRouter from './routes/aiRevenue'
import retellRouter, { webhookRouter as retellWebhookRouter } from './routes/retell'
import providerBalancesRouter from './routes/providerBalances'
import { runMigrations } from './lib/migrate'
import { startReminderScheduler } from './lib/reminderScheduler'
import { startBillingScheduler } from './lib/billingScheduler'
import { startCreditScheduler } from './lib/creditScheduler'
import { startProviderBalanceScheduler } from './lib/providerBalanceScheduler'

const app = express()

// El frontend se sirve desde varios orígenes a la vez (el dominio propio y
// el subdominio de Railway) — `cors` con un string único solo admite UNO,
// así que cualquier origen no listado aquí fallaba con un error de red
// genérico en el navegador ("Load failed"), sin mensaje claro de CORS.
// Se admite una lista separada por comas en APP_URL además de los dominios
// conocidos de ConsentsPro, para no depender de tener esa variable
// perfectamente sincronizada en Railway.
const ALLOWED_ORIGINS = [
  ...(process.env.APP_URL ?? '').split(',').map(o => o.trim()).filter(Boolean),
  'https://www.consentspro.com',
  'https://consentspro.com',
  'https://consentimientos-production.up.railway.app',
]

app.use(cors({
  origin(origin, callback) {
    // Sin cabecera Origin (llamadas servidor-a-servidor, curl, webhooks) — se permite.
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true)
    callback(new Error(`Origen no permitido por CORS: ${origin}`))
  },
  credentials: true,
}))

// El webhook de Stripe necesita el cuerpo sin procesar para verificar la
// firma — debe montarse antes del parser JSON global.
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }), billingWebhookRouter)

app.use(express.json({ limit: '10mb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))

// Public
app.use('/api/auth', authRouter)
app.use('/api/verify', verifyRouter)
app.use('/api/whatsapp-webhook', whatsappWebhookRouter)
app.use('/api/analytics', analyticsPublicRouter)
app.use('/api/signing-devices', signingDevicesPublicRouter)
app.use('/api/signing-kiosk', deviceAuthMiddleware, signingKioskRouter)
app.use('/api/billing-action', billingActionRouter)
app.use('/api/billing', billingSignupRouter)
app.use('/api/timetracking', timeTrackingPublicRouter)
app.use('/api/retell-webhook', retellWebhookRouter)

// Protected
app.use('/api/patients',  authMiddleware, patientsRouter)
app.use('/api/doctors',   authMiddleware, doctorsRouter)
app.use('/api/consents',  authMiddleware, consentsRouter)
app.use('/api/clinic',    authMiddleware, clinicRouter)
app.use('/api/signature', authMiddleware, signatureRouter)
app.use('/api/translate', authMiddleware, translateRouter)
app.use('/api/users',     authMiddleware, requireAdmin, usersRouter)
app.use('/api/photos',           authMiddleware, photosRouter)
app.use('/api/pdf',              authMiddleware, pdfRouter)
app.use('/api/clinical-records', authMiddleware, clinicalRecordsRouter)
app.use('/api/photo-sessions',  authMiddleware, photoSessionsRouter)
app.use('/api/credits',         authMiddleware, creditsRouter)
app.use('/api/media',           authMiddleware, mediaRouter)
app.use('/api/lab-partners',    authMiddleware, labPartnersRouter)
app.use('/api/patient',         authMiddleware, patientPortalRouter)
app.use('/api/treatments',      authMiddleware, treatmentsRouter)
app.use('/api/appointments',    authMiddleware, appointmentsRouter)
app.use('/api/schedule',        authMiddleware, scheduleRouter)
app.use('/api/me',              authMiddleware, meRouter)
app.use('/api/toxin',           authMiddleware, toxinRouter)
app.use('/api/clinic-config',   authMiddleware, clinicConfigRouter)
app.use('/api/whatsapp',        authMiddleware, whatsappRouter)
app.use('/api/plan-permissions', authMiddleware, requireAdmin, planPermissionsRouter)
app.use('/api/budgets',         authMiddleware, budgetsRouter)
app.use('/api/odontogram',      authMiddleware, odontogramRouter)
app.use('/api/invoices',        authMiddleware, requireModuleAccess('invoicing'), invoicesRouter)
app.use('/api/timetracking',    authMiddleware, requireModuleAccess('time-tracking'), timeTrackingRouter)
app.use('/api/workflows',       authMiddleware, requireSuperAdmin, workflowsRouter)
app.use('/api/analytics',       authMiddleware, requireSuperAdmin, analyticsRouter)
app.use('/api/tickets',         authMiddleware, ticketsRouter)
app.use('/api/signing-devices', authMiddleware, requireAdmin, signingDevicesRouter)
app.use('/api/consent-handoff', authMiddleware, consentHandoffRouter)
app.use('/api/billing',         authMiddleware, billingRouter)
app.use('/api/promo-codes',     authMiddleware, requireSuperAdmin, promoCodesRouter)
app.use('/api/ai-credits',      authMiddleware, aiCreditsRouter)
app.use('/api/admin/ai-revenue', authMiddleware, requireSuperAdmin, aiRevenueRouter)
app.use('/api/retell',          authMiddleware, retellRouter)
app.use('/api/admin/provider-balances', authMiddleware, requireSuperAdmin, providerBalancesRouter)

const PORT = process.env.PORT ?? 3001

runMigrations()
  .catch(err => console.error('[migrate] migration run failed, starting server anyway:', err))
  .finally(() => {
    app.listen(PORT, () => console.log(`ConsentsPro API running on port ${PORT}`))
    startReminderScheduler()
    startBillingScheduler()
    startCreditScheduler()
    startProviderBalanceScheduler()
  })

export default app
