import { useState } from 'react'
import { Zap, FileText, ClipboardList, Camera, AlertTriangle } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'
import { api } from '@/lib/api'

export default function Recharge() {
  const { credits, loading, refresh } = useCredits()
  const [topping, setTopping] = useState(false)
  const [msg, setMsg] = useState('')

  // Placeholder packs — user will define prices later
  const packs = [
    {
      id: 'starter',
      name: 'Pack Inicial',
      desc: 'Ideal para empezar',
      consents: 25,
      records: 25,
      sessions: 25,
      price: '—',
      color: 'from-blue-500 to-blue-700',
      badge: null,
    },
    {
      id: 'pro',
      name: 'Pack Pro',
      desc: 'Para clínicas en crecimiento',
      consents: 100,
      records: 100,
      sessions: 100,
      price: '—',
      color: 'from-violet-500 to-violet-700',
      badge: 'Más popular',
    },
    {
      id: 'unlimited',
      name: 'Pack Ilimitado',
      desc: 'Sin preocupaciones',
      consents: 500,
      records: 500,
      sessions: 500,
      price: '—',
      color: 'from-emerald-500 to-emerald-700',
      badge: null,
    },
  ]

  const handleTopup = async (pack: typeof packs[0]) => {
    setTopping(true)
    setMsg('')
    try {
      await api.post('/credits/topup', {
        consents: pack.consents,
        clinical_records: pack.records,
        photo_sessions: pack.sessions,
      })
      await refresh()
      setMsg(`✅ ${pack.name} aplicado correctamente`)
    } catch (e: any) {
      setMsg(`⚠️ ${e.message}`)
    } finally {
      setTopping(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recargar créditos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Amplía tu capacidad de uso</p>
        </div>
      </div>

      {/* Current credits */}
      {!loading && credits && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Créditos disponibles</p>
          <div className="grid grid-cols-3 gap-4">
            <CreditBadge icon={<FileText className="w-4 h-4" />} label="Consentimientos" value={credits.consents_available} color="blue" />
            <CreditBadge icon={<ClipboardList className="w-4 h-4" />} label="Historias clínicas" value={credits.clinical_records_available} color="teal" />
            <CreditBadge icon={<Camera className="w-4 h-4" />} label="Sesiones de fotos" value={credits.photo_sessions_available} color="violet" />
          </div>
        </div>
      )}

      {/* Packs */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-4">Selecciona un pack de recarga</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packs.map(pack => (
            <div key={pack.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
              {pack.badge && (
                <div className="absolute top-3 right-3 text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">
                  {pack.badge}
                </div>
              )}
              <div className={`bg-gradient-to-br ${pack.color} p-5`}>
                <p className="text-white font-bold text-lg">{pack.name}</p>
                <p className="text-white/70 text-xs mt-0.5">{pack.desc}</p>
                <p className="text-white text-3xl font-black mt-3">{pack.price}</p>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <ul className="flex flex-col gap-1.5 text-sm text-slate-600">
                  <li className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-500" />{pack.consents} consentimientos</li>
                  <li className="flex items-center gap-2"><ClipboardList className="w-3.5 h-3.5 text-teal-500" />{pack.records} historias clínicas</li>
                  <li className="flex items-center gap-2"><Camera className="w-3.5 h-3.5 text-violet-500" />{pack.sessions} sesiones de fotos</li>
                </ul>
                <button
                  onClick={() => handleTopup(pack)}
                  disabled={topping}
                  className="mt-1 w-full py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
                >
                  {topping ? 'Aplicando…' : 'Seleccionar pack'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-400 text-center">Los precios se actualizarán próximamente. Ahora mismo puedes aplicar packs directamente.</p>
      </div>

      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {msg}
        </div>
      )}
    </div>
  )
}

function CreditBadge({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const low = value <= 5
  const colors: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    teal: 'text-teal-600 bg-teal-50',
    violet: 'text-violet-600 bg-violet-50',
  }
  return (
    <div className={`flex flex-col items-center gap-1 p-4 rounded-xl ${low ? 'bg-red-50' : colors[color]}`}>
      <div className={low ? 'text-red-500' : ''}>{icon}</div>
      <p className={`text-2xl font-black ${low ? 'text-red-600' : ''}`}>{value}</p>
      <p className="text-xs text-center text-slate-500">{label}</p>
      {low && <p className="text-[10px] font-semibold text-red-500 flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" />Bajo</p>}
    </div>
  )
}
