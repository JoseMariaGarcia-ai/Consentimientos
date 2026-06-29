import { useState } from 'react'
import { Check, Clock, FileText, ClipboardList, LogIn, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface Props {
  current: { show_trigger: string; show_interval_minutes: number } | null
  onSaved: () => void
}

const OPTIONS = [
  {
    value: 'session',
    icon: LogIn,
    label: 'Una vez al iniciar sesión',
    desc: 'Se muestra una sola vez cada vez que el usuario abre la aplicación en el navegador.',
  },
  {
    value: 'consent',
    icon: FileText,
    label: 'Cada vez que se crea un consentimiento',
    desc: 'Aparece inmediatamente después de crear cada consentimiento informado.',
  },
  {
    value: 'clinical',
    icon: ClipboardList,
    label: 'Cada vez que se crea una historia clínica',
    desc: 'Aparece inmediatamente después de guardar cada historia clínica.',
  },
  {
    value: 'interval',
    icon: Clock,
    label: 'Cada X minutos',
    desc: 'Se muestra periódicamente mientras la aplicación esté abierta.',
  },
]

export function WelcomeTriggerConfig({ current, onSaved }: Props) {
  const [trigger, setTrigger]   = useState(current?.show_trigger ?? 'session')
  const [minutes, setMinutes]   = useState(current?.show_interval_minutes ?? 30)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      await api.put('/media/welcome/config', {
        show_trigger: trigger,
        show_interval_minutes: trigger === 'interval' ? Math.max(1, minutes) : undefined,
      })
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">¿Cuándo mostrar la publicidad?</p>

      <div className="flex flex-col gap-2">
        {OPTIONS.map(opt => {
          const Icon = opt.icon
          const active = trigger === opt.value
          return (
            <label
              key={opt.value}
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                active ? 'border-pink-300 bg-pink-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="trigger"
                value={opt.value}
                checked={active}
                onChange={() => setTrigger(opt.value)}
                className="mt-0.5 accent-pink-600 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-pink-600' : 'text-slate-400'}`} />
                  <p className={`text-sm font-medium ${active ? 'text-pink-800' : 'text-slate-700'}`}>{opt.label}</p>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 ml-6">{opt.desc}</p>

                {opt.value === 'interval' && active && (
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <span className="text-xs text-slate-500">Cada</span>
                    <input
                      type="number"
                      min={1}
                      max={1440}
                      value={minutes}
                      onChange={e => setMinutes(parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-pink-400"
                    />
                    <span className="text-xs text-slate-500">minutos</span>
                  </div>
                )}
              </div>
            </label>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-500">⚠️ {error}</p>}

      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-xl text-sm font-medium hover:bg-pink-700 disabled:opacity-50"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando…</>
            : saved
            ? <><Check className="w-4 h-4" />Guardado</>
            : 'Guardar configuración'}
        </button>
        {saved && <p className="text-xs text-emerald-600 font-medium">✅ Configuración aplicada</p>}
      </div>
    </div>
  )
}
