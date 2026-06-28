import express from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth'
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

// Protected
app.use('/api/patients',  authMiddleware, patientsRouter)
app.use('/api/doctors',   authMiddleware, doctorsRouter)
app.use('/api/consents',  authMiddleware, consentsRouter)
app.use('/api/clinic',    authMiddleware, clinicRouter)
app.use('/api/signature', authMiddleware, signatureRouter)
app.use('/api/translate', authMiddleware, translateRouter)
app.use('/api/users',     authMiddleware, usersRouter)
app.use('/api/photos',    authMiddleware, photosRouter)

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => console.log(`ConsentsPro API running on port ${PORT}`))

export default app
