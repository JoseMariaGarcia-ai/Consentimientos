import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, LogIn, LogOut, Pause, Play, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { LanguageSelector } from '@/components/language/LanguageSelector'

function useQueryParam(name: string) {
  return new URLSearchParams(window.location.search).get(name)
}

export default function TimeClockKiosk() {
  const { t } = useTranslation()
  const clinicId = useQueryParam('clinic')
  const [dniNie, setDniNie] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const RECORD_TYPES = [
    { key: 'entrada', icon: LogIn, color: 'bg-emerald-600 hover:bg-emerald-700', label: t('timeTracking.clockIn') },
    { key: 'inicio_pausa', icon: Pause, color: 'bg-amber-500 hover:bg-amber-600', label: t('timeTracking.startBreak') },
    { key: 'fin_pausa', icon: Play, color: 'bg-sky-600 hover:bg-sky-700', label: t('timeTracking.endBreak') },
    { key: 'salida', icon: LogOut, color: 'bg-slate-800 hover:bg-slate-700', label: t('timeTracking.clockOut') },
  ]

  const clock = async (recordType: string) => {
    if (!clinicId) return
    if (!/^\d{4,6}$/.test(pin)) { setResult({ ok: false, message: t('timeClockKiosk.pinFormatError') }); return }
    setBusy(true)
    setResult(null)
    try {
      const res = await api.post('/timetracking/clock-pin', { clinic_id: clinicId, dni_nie: dniNie.trim(), pin, record_type: recordType })
      setResult({ ok: true, message: t('timeClockKiosk.success', { name: res.employee_name ?? '' }) })
      setPin('')
    } catch (err: any) {
      setResult({ ok: false, message: err.message ?? t('timeClockKiosk.genericError') })
    } finally {
      setBusy(false)
      setTimeout(() => setResult(null), 4000)
    }
  }

  if (!clinicId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <p className="text-slate-500">{t('timeClockKiosk.missingClinic')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 gap-8">
      <div className="absolute top-4 right-4"><LanguageSelector variant="light" /></div>
      <div className="flex items-center gap-3 text-white">
        <Clock className="w-8 h-8" />
        <h1 className="text-2xl font-bold">{t('timeClockKiosk.title')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('timeClockKiosk.dniNie')}</label>
          <input
            value={dniNie}
            onChange={e => setDniNie(e.target.value.toUpperCase())}
            className="px-4 py-3 border border-slate-300 rounded-xl text-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('timeClockKiosk.pin')}</label>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="px-4 py-3 border border-slate-300 rounded-xl text-2xl text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {RECORD_TYPES.map(rt => {
            const Icon = rt.icon
            return (
              <button
                key={rt.key}
                onClick={() => clock(rt.key)}
                disabled={busy || !dniNie.trim() || pin.length < 4}
                className={`flex flex-col items-center gap-1.5 py-5 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${rt.color}`}
              >
                <Icon className="w-5 h-5" />{rt.label}
              </button>
            )
          })}
        </div>

        {result && (
          <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {result.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <XCircle className="w-4 h-4 flex-shrink-0" />}
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}
