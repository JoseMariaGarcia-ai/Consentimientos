import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Eye, Mail, Clock, Building2 } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { api } from '@/lib/api'

interface DailyPoint { date: string; welcome_screen: number; patient_screen: number; patient_email: number }
interface ClinicRow { clinic_id: string; clinic_name: string; welcome_screen: number; patient_screen: number; patient_email: number; total: number }
interface Totals { welcome_screen: number; patient_screen: number; patient_email: number; avg_view_seconds_welcome: number | null; avg_view_seconds_patient: number | null }
interface StatsResponse { daily: DailyPoint[]; totals: Totals; byClinic: ClinicRow[]; from: string; to: string }

function firstDayOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function today(d: Date) {
  return d.toISOString().slice(0, 10)
}
function formatDuration(seconds: number | null, dash: string): string {
  if (seconds === null || seconds === undefined) return dash
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

export function MediaStatsPanel({ labId }: { labId: string }) {
  const { t } = useTranslation()
  const now = new Date()
  const [from, setFrom] = useState(firstDayOfMonth(now))
  const [to, setTo] = useState(today(now))
  const [data, setData] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await api.get(`/lab-partners/${labId}/media-stats?from=${from}&to=${to}`)
      setData(result)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [labId, from, to])

  useEffect(() => { load() }, [load])

  const chartData = data?.daily ?? []
  const byClinic = data?.byClinic ?? []
  const dash = '—'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700">{t('mediaStats.title')}</h3>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.from')}</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={e => setFrom(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.to')}</label>
            <input
              type="date"
              value={to}
              min={from}
              max={today(now)}
              onChange={e => setTo(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-pink-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{data?.totals.welcome_screen ?? 0}</p>
            <p className="text-xs text-slate-500">{t('mediaStats.welcome_total')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Eye className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{data?.totals.patient_screen ?? 0}</p>
            <p className="text-xs text-slate-500">{t('mediaStats.patient_screen_total')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{data?.totals.patient_email ?? 0}</p>
            <p className="text-xs text-slate-500">{t('mediaStats.patient_email_total')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{formatDuration(data?.totals.avg_view_seconds_welcome ?? null, dash)}</p>
            <p className="text-xs text-slate-500">{t('mediaStats.avg_view_welcome')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800">{formatDuration(data?.totals.avg_view_seconds_patient ?? null, dash)}</p>
            <p className="text-xs text-slate-500">{t('mediaStats.avg_view_patient')}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">{t('common.loading')}</div>
      ) : chartData.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
          <BarChart3 className="w-8 h-8 opacity-20" />
          {t('mediaStats.no_data')}
        </div>
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="welcome_screen" name={t('mediaStats.welcome_series')} stroke="#DB2777" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="patient_screen" name={t('mediaStats.patient_screen_series')} stroke="#2563EB" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="patient_email" name={t('mediaStats.patient_email_series')} stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Desglose por clínica */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <h4 className="text-sm font-bold text-slate-700">{t('mediaStats.by_clinic_title')}</h4>
        </div>
        {loading ? null : byClinic.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">{t('mediaStats.no_clinic_data')}</p>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.table.clinic')}</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.table.welcome_screen')}</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.table.patient_screen')}</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.table.patient_email')}</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.table.total')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {byClinic.map(c => (
                  <tr key={c.clinic_id}>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{c.clinic_name}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{c.welcome_screen}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{c.patient_screen}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{c.patient_email}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">{t('mediaStats.patient_note')}</p>
    </div>
  )
}
