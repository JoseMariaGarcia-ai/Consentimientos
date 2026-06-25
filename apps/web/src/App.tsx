import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useLanguageStore } from './store/languageStore'
import { Topbar } from './components/layout/Topbar'
import { Sidebar } from './components/layout/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import Doctors from './pages/Doctors'
import Consents from './pages/Consents'
import ClinicPage from './pages/Clinic'
import PatientPortal from './pages/PatientPortal'
import VerifyConsent from './pages/VerifyConsent'
import { useSupabaseAuth } from './lib/supabase'

export default function App() {
  const { session, loading } = useSupabaseAuth()
  const { currentLanguage } = useLanguageStore()

  useEffect(() => {
    document.documentElement.dir = currentLanguage === 'ar-SA' ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLanguage
  }, [currentLanguage])

  // Public routes — no auth required
  if (window.location.pathname.startsWith('/portal/')) return <PatientPortal />
  if (window.location.pathname.startsWith('/verify/')) return <VerifyConsent />

  if (loading) return <div className="flex items-center justify-center h-screen text-brand">Cargando…</div>
  if (!session) return <Login />

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/consents" element={<Consents />} />
            <Route path="/clinic" element={<ClinicPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
