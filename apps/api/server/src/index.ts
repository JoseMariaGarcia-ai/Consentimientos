import express from 'express'
import cors from 'cors'
import { authMiddleware, requireAdmin } from './middleware/auth'
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
import adminMigrateRouter from './routes/adminMigrate'

const app = express()

app.use(cors({
  origin: process.env.APP_URL ?? '*',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))

// Public
app.use('/api/auth', authRouter)
app.use('/api/verify', verifyRouter)
app.use('/api/_migrate', adminMigrateRouter) // TEMPORARY — remove after applying migration 013

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

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => console.log(`ConsentsPro API running on port ${PORT}`))

export default app
