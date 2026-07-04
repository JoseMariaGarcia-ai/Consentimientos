import { useState, useEffect } from 'react'
import { Building2, FlaskConical, Mail, Phone, User, Globe, LogOut, Megaphone, BarChart3 } from 'lucide-react'
import { api } from '@/lib/api'
import { clearSession } from '@/lib/auth'
import { PreviewBanner } from '@/components/preview/PreviewBanner'
import { CampaignsPanel, type LabPartner } from './LabPartners'
import { WelcomeMediaProvider } from '@/context/WelcomeMediaContext'
import { WelcomeMediaModal } from '@/components/media/WelcomeMediaModal'
import { CreativesGallery } from '@/components/media/CreativesGallery'
import { WelcomeTriggerConfig } from '@/components/media/WelcomeTriggerConfig'

interface LabPartnerPortalProps {
  labId?: string
  previewLabId?: string
  onExitPreview?: () => void
}

// Real dashboard for an authenticated lab_partner user, and preview mode for
// admin/superadmin (via previewLabId) to see exactly what that role sees.
export default function LabPartnerPortal({ labId, previewLabId, onExitPreview }: LabPartnerPortalProps) {
  const isPreview = !!previewLabId
  const effectiveId = previewLabId ?? labId

  const [lab, setLab] = useState<(LabPartner & { clinics?: any[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [mediaData, setMediaData] = useState<any>({})
  const [tab, setTab] = useState<'clinics' | 'campaigns' | 'stats'>('clinics')

  useEffect(() => {
    if (!effectiveId) { setLoading(false); return }
    api.get(`/lab-partners/${effectiveId}`).then(setLab).catch(() => setLab(null)).finally(() => setLoading(false))
  }, [effectiveId])

  const loadMedia = () => { api.get('/media').then(setMediaData).catch(() => setMediaData({})) }
  useEffect(() => { loadMedia() }, [])

  const logout = () => { clearSession(); window.location.href = '/' }

  return (
    <WelcomeMediaProvider>
    <div className="min-h-screen bg-slate-50">
      <WelcomeMediaModal />
      {isPreview && onExitPreview && <PreviewBanner role="lab_partner" onExit={onExitPreview} />}

      <header className="bg-[#0D1B2E] text-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <p className="text-xl font-black tracking-tight">
            Consents<span className="text-[#C9A84C]">Pro</span> <span className="text-sm font-normal text-slate-400">Laboratorio</span>
          </p>
          {!isPreview && (
            <button onClick={logout} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !lab ? (
          <div className="text-center text-slate-400 py-20">No se encontró el perfil de laboratorio.</div>
        ) : (
          <>
            {/* Lab profile */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">{lab.name}</h1>
                  <p className="text-sm text-slate-400">Panel de laboratorio colaborador</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" />{lab.email}</p>
                {lab.phone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" />{lab.phone}</p>}
                {lab.contact_person && <p className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" />{lab.contact_person}</p>}
                {lab.website && <p className="flex items-center gap-2"><Globe className="w-4 h-4 text-slate-400" />{lab.website}</p>}
              </div>
            </div>

            {/* Nav */}
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
              <button
                onClick={() => setTab('clinics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'clinics' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Building2 className="w-4 h-4" />Clínicas vinculadas
              </button>
              <button
                onClick={() => setTab('campaigns')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'campaigns' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Megaphone className="w-4 h-4" />Campañas publicitarias
              </button>
              <button
                onClick={() => setTab('stats')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'stats' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <BarChart3 className="w-4 h-4" />Estadísticas
              </button>
            </div>

            {/* Clínicas vinculadas */}
            {tab === 'clinics' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <h2 className="text-sm font-bold text-slate-700">Clínicas vinculadas</h2>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{lab.clinics?.length ?? 0}</span>
                </div>
                {!lab.clinics || lab.clinics.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">Todavía no hay clínicas vinculadas a este laboratorio.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {lab.clinics.map((c: any) => (
                      <div key={c.id} className="px-6 py-3">
                        <p className="text-sm font-medium text-slate-800">{c.name}</p>
                        {c.address && <p className="text-xs text-slate-400 mt-0.5">{c.address}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Campañas publicitarias — medios (bienvenida/paciente) + campañas con fechas */}
            {tab === 'campaigns' && (
              <div className="flex flex-col gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Megaphone className="w-4 h-4 text-pink-500" />
                    <h3 className="text-sm font-bold text-slate-700">Gestión de medios publicitarios</h3>
                  </div>

                  <CreativesGallery
                    type="welcome"
                    title="Pantalla de bienvenida"
                    description="Hasta 5 imágenes o vídeos. Elige cuál mostrar, en aleatorio o en secuencia (máx. 100 MB por archivo)."
                    files={mediaData?.welcome?.files ?? []}
                    settings={mediaData?.welcome?.settings ?? null}
                    onChanged={loadMedia}
                  />

                  {(mediaData?.welcome?.files?.length ?? 0) > 0 && (
                    <>
                      <div className="border-t border-slate-100" />
                      <WelcomeTriggerConfig
                        current={mediaData.welcome.settings}
                        onSaved={loadMedia}
                      />
                    </>
                  )}

                  <div className="border-t border-slate-100" />

                  <CreativesGallery
                    type="patient"
                    title="Contenido para paciente"
                    description="Hasta 5 imágenes o vídeos destinados al paciente. Su uso exacto se configurará próximamente."
                    files={mediaData?.patient?.files ?? []}
                    settings={mediaData?.patient?.settings ?? null}
                    onChanged={loadMedia}
                  />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <CampaignsPanel lab={lab} />
                </div>
              </div>
            )}

            {/* Estadísticas — pendiente de definir */}
            {tab === 'stats' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-center">
                <BarChart3 className="w-10 h-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Estadísticas</p>
                <p className="text-sm text-slate-400 max-w-sm">Esta sección está pendiente de definir — próximamente verás aquí métricas de rendimiento de tus campañas y clínicas.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
    </WelcomeMediaProvider>
  )
}
