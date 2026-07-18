import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LogIn, LogOut, Pause, Play, Clock, FileDown, Loader2, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { timeTrackingPdfBlob } from '@/lib/pdf/timeTrackingPdf'
import { TimeIncidentModal } from './TimeIncidentModal'

type Status = 'dentro' | 'fuera' | 'en_pausa'

function startOfWeek(d: Date) {
  const day = d.getDay() === 0 ? 7 : d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  monday.setHours(0, 0, 0, 0)
  return monday
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function OwnClockPanel() {
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<Status>('fuera')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [weekHours, setWeekHours] = useState(0)
  const [monthHours, setMonthHours] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [incidentModalOpen, setIncidentModalOpen] = useState(false)

  const loadHours = useCallback(async () => {
    try {
      const now = new Date()
      const [weekDays, monthDays] = await Promise.all([
        api.get(`/timetracking/hours?date_from=${toDateStr(startOfWeek(now))}`),
        api.get(`/timetracking/hours?date_from=${toDateStr(startOfMonth(now))}`),
      ])
      setWeekHours((Array.isArray(weekDays) ? weekDays : []).reduce((s: number, d: any) => s + d.hours, 0))
      setMonthHours((Array.isArray(monthDays) ? monthDays : []).reduce((s: number, d: any) => s + d.hours, 0))
    } catch { /* no employee linked yet — panel stays visible with 0h */ }
  }, [])

  const loadStatus = useCallback(async () => {
    try {
      const res = await api.get('/timetracking/status')
      setStatus(res?.status === 'dentro' || res?.status === 'en_pausa' ? res.status : 'fuera')
    } catch { setStatus('fuera') }
  }, [])

  useEffect(() => { loadStatus(); loadHours() }, [loadStatus, loadHours])

  function getGeolocation(): Promise<{ latitude: number | null; longitude: number | null }> {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve({ latitude: null, longitude: null })
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }),
        { timeout: 5000 }
      )
    })
  }

  const clock = async (recordType: string) => {
    setError('')
    setLoading(true)
    try {
      const { latitude, longitude } = await getGeolocation()
      await api.post('/timetracking/clock', { record_type: recordType, latitude, longitude, method: 'web' })
      await Promise.all([loadStatus(), loadHours()])
    } catch (err: any) {
      setError(err.message ?? t('timeTracking.clockError'))
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const now = new Date()
      const data = await api.get(`/timetracking/export?date_from=${toDateStr(startOfMonth(now))}`)
      const blob = await timeTrackingPdfBlob(data, i18n.language)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fichajes_${data.employee?.full_name ?? 'informe'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message ?? t('timeTracking.exportError'))
    } finally {
      setDownloading(false)
    }
  }

  const handleReportIncident = async (data: any) => {
    await api.post('/timetracking/incidents', data)
  }

  const STATUS_LABEL: Record<Status, string> = {
    dentro: t('timeTracking.statusIn'),
    fuera: t('timeTracking.statusOut'),
    en_pausa: t('timeTracking.statusPaused'),
  }
  const STATUS_COLOR: Record<Status, string> = {
    dentro: 'bg-emerald-100 text-emerald-700',
    fuera: 'bg-slate-100 text-slate-600',
    en_pausa: 'bg-amber-100 text-amber-700',
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">{t('timeTracking.myClock')}</h3>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => clock('entrada')}
          disabled={loading || status !== 'fuera'}
          className="flex flex-col items-center gap-1.5 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogIn className="w-5 h-5" />{t('timeTracking.clockIn')}
        </button>
        <button
          onClick={() => clock('inicio_pausa')}
          disabled={loading || status !== 'dentro'}
          className="flex flex-col items-center gap-1.5 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Pause className="w-5 h-5" />{t('timeTracking.startBreak')}
        </button>
        <button
          onClick={() => clock('fin_pausa')}
          disabled={loading || status !== 'en_pausa'}
          className="flex flex-col items-center gap-1.5 py-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Play className="w-5 h-5" />{t('timeTracking.endBreak')}
        </button>
        <button
          onClick={() => clock('salida')}
          disabled={loading || status === 'fuera'}
          className="flex flex-col items-center gap-1.5 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <LogOut className="w-5 h-5" />{t('timeTracking.clockOut')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-6 text-sm">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{t('timeTracking.thisWeek')}</p>
          <p className="text-lg font-bold text-slate-800">{weekHours.toFixed(2)} h</p>
        </div>
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wide">{t('timeTracking.thisMonth')}</p>
          <p className="text-lg font-bold text-slate-800">{monthHours.toFixed(2)} h</p>
        </div>
        <button
          onClick={() => setIncidentModalOpen(true)}
          className="ml-auto flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {t('timeTracking.reportIncident')}
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
          {t('timeTracking.downloadMyReport')}
        </button>
      </div>

      {incidentModalOpen && (
        <TimeIncidentModal
          isManager={false}
          onSave={handleReportIncident}
          onClose={() => setIncidentModalOpen(false)}
        />
      )}
    </div>
  )
}
