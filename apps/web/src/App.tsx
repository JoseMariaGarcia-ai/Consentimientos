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
import PatientPortalApp from './pages/PatientPortalApp'
import { WelcomeMediaModal } from './components/media/WelcomeMediaModal'
import { WelcomeMediaProvider } from './context/WelcomeMediaContext'
import { useAuth } from './lib/auth'

export default function App() {
  const { isAuthenticated, role } = useAuth()
  const { currentLanguage } = useLanguageStore()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dir = ['ar-SA', 'he-IL'].includes(currentLanguage) ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  // Public routes — no auth required
  if (window.location.pathname.startsWith('/portal/')) return <PatientPortal />
  if (window.location.pathname.startsWith('/verify/')) return <VerifyConsent />
  if (window.location.pathname.startsWith('/auth/verify')) return <AuthVerify />

  if (!isAuthenticated) return <Login />

  // Patient role — show patient portal only
  if (role === 'patient' || window.location.pathname.startsWith('/patient/')) {
    return <PatientPortalApp />
  }

  return (
    <WelcomeMediaProvider>
      <div className="flex flex-col h-screen bg-slate-50">
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <WelcomeMediaModal />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/patients" element={<Patients />} />
              <Route path="/doctors" element={<Doctors />} />
              <Route path="/consents" element={<Consents />} />
              <Route path="/clinic" element={<ClinicPage />} />
              <Route path="/lab-partners" element={<LabPartners />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/settings" element={<Settings />} />
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
