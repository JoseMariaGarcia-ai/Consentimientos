import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useLanguageStore } from './store/languageStore'
import { Topbar } from './components/layout/Topbar'
import { Sidebar } from './components/layout/Sidebar'
import Login from './pages/Login'
import AuthVerify from './pages/AuthVerify'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Consents from './pages/Consents'
import ClinicPage from './pages/Clinic'
import Templates from './pages/Templates'
import Settings from './pages/Settings'
import PatientPortal from './pages/PatientPortal'
import VerifyConsent from './pages/VerifyConsent'
import ClinicalRecords from './pages/ClinicalRecords'
import PatientDetail from './pages/PatientDetail'
import PhotoSessions from './pages/PhotoSessions'
import Recharge from './pages/Recharge'
import LabPartners from './pages/LabPartners'
import LabPartnerPortal from './pages/LabPartnerPortal'
import Agenda from './pages/Agenda'
import PatientPortalApp from './pages/PatientPortalApp'
import { WelcomeMediaModal } from './components/media/WelcomeMediaModal'
import { WelcomeMediaProvider } from './context/WelcomeMediaContext'
import { PreviewProvider, usePreview } from './context/PreviewContext'
import { PreviewBanner } from './components/preview/PreviewBanner'
import { ALL_MODULES, DEFAULT_CLINICA_MODULES } from './lib/modules'
import { useAuth } from './lib/auth'
import { api } from './lib/api'

export default function App() {
  return (
    <PreviewProvider>
      <AppShell />
    </PreviewProvider>
  )
}

function AppShell() {
  const { isAuthenticated, role } = useAuth()
  const { currentLanguage } = useLanguageStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { preview, exitPreview } = usePreview()
  const isSuperAdmin = role === 'superadmin'
  const isClinicaRole = role === 'clinica'
  const [myModules, setMyModules] = useState<string[] | null>(null)

  useEffect(() => {
    document.documentElement.dir = ['ar-SA', 'he-IL'].includes(currentLanguage) ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Real permission enforcement for logged-in "clinica" staff — Configuración
  // is always excluded regardless of any stored permission row.
  useEffect(() => {
    if (!isClinicaRole) { setMyModules(null); return }
    api.get('/me').then((me: any) => {
      const perms = Object.fromEntries((me.user_permissions ?? []).map((p: any) => [p.module, p.can_access]))
      const modules = ALL_MODULES
        .filter(m => m.key !== 'settings' && (m.key in perms ? perms[m.key] !== false : m.defaultOn))
        .map(m => m.key)
      setMyModules(modules)
    }).catch(() => setMyModules([...DEFAULT_CLINICA_MODULES]))
  }, [isClinicaRole])

  // Public routes — no auth required
  if (window.location.pathname.startsWith('/portal/')) return <PatientPortal />
  if (window.location.pathname.startsWith('/verify/')) return <VerifyConsent />
  if (window.location.pathname.startsWith('/auth/verify')) return <AuthVerify />

  if (!isAuthenticated) return <Login />

  // Role preview (superadmin only) — render the real interface another role would see
  const activePreview = isSuperAdmin ? preview : null

  if (activePreview?.role === 'patient' && activePreview.patientId) {
    return <PatientPortalApp previewPatientId={activePreview.patientId} onExitPreview={exitPreview} />
  }
  if (activePreview?.role === 'lab_partner' && activePreview.labId) {
    return <LabPartnerPortal previewLabId={activePreview.labId} onExitPreview={exitPreview} />
  }

  // Patient role — show patient portal only
  if (role === 'patient' || window.location.pathname.startsWith('/patient/')) {
    return <PatientPortalApp />
  }

  const isClinicaPreview = activePreview?.role === 'clinica'
  const allowedModules = isClinicaPreview
    ? ((activePreview!.clinicaModules ?? DEFAULT_CLINICA_MODULES) as string[]).filter(m => m !== 'settings')
    : isClinicaRole
    ? myModules ?? undefined
    : undefined

  return (
    <WelcomeMediaProvider>
      <div className="flex flex-col h-screen bg-slate-50">
        {isClinicaPreview && <PreviewBanner role="clinica" onExit={exitPreview} />}
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} allowedModules={allowedModules} />
          <WelcomeMediaModal />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/agenda" element={<Agenda />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/consents" element={<Consents />} />
              <Route path="/clinic" element={<ClinicPage />} />
              <Route path="/lab-partners" element={<LabPartners />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/settings" element={isClinicaRole ? <Navigate to="/" /> : <Settings />} />
              <Route path="/clinical-records" element={<ClinicalRecords />} />
              <Route path="/photos" element={<PhotoSessions />} />
              <Route path="/recharge" element={<Recharge />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </WelcomeMediaProvider>
  )
}
