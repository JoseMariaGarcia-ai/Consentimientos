import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BarChart3, Eye, Mail, Clock, Building2, Trophy } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { api } from '@/lib/api'
import { PROVINCIAS_ES } from '@/constants/provinces'

interface DailyPoint { date: string; welcome_screen: number; patient_screen: number; patient_email: number }
interface ClinicRow {
  clinic_id: string; clinic_name: string
  welcome_screen: number; patient_screen: number; patient_email: number; total: number
  avg_view_seconds_welcome: number | null; avg_view_seconds_patient: number | null
}
interface ProvinceRow { province: string | null; welcome_screen: number; patient_screen: number; patient_email: number; total: number }
interface Totals { welcome_screen: number; patient_screen: number; patient_email: number; avg_view_seconds_welcome: number | null; avg_view_seconds_patient: number | null }
interface StatsResponse { daily: DailyPoint[]; totals: Totals; byClinic: ClinicRow[]; byProvince: ProvinceRow[]; from: string; to: string }

type View = 'clinic' | 'patient'

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
function provinceLabel(province: string | null, labels: string[], unsetLabel: string): string {
  if (!province) return unsetLabel
  const i = PROVINCIAS_ES.indexOf(province as typeof PROVINCIAS_ES[number])
  return i >= 0 ? (labels[i] ?? province) : province
}

const PIE_COLORS = ['#2563EB', '#059669']

export function MediaStatsPanel({ labId }: { labId: string }) {
  const { t } = useTranslation()
  const now = new Date()
  const [from, setFrom] = useState(firstDayOfMonth(now))
  const [to, setTo] = useState(today(now))
  const [data, setData] = useState<StatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('clinic')

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

  const dash = '—'
  const chartData = data?.daily ?? []
  const byClinic = data?.byClinic ?? []
  const byProvince = data?.byProvince ?? []
  const provinceLabels = t('patients.form.provinces', { returnObjects: true }) as string[]
  const unsetProvinceLabel = t('mediaStats.province_unset') as string

  const topClinicWelcome = useMemo(
    () => [...byClinic].sort((a, b) => b.welcome_screen - a.welcome_screen).find(c => c.welcome_screen > 0) ?? null,
    [byClinic]
  )
  const topClinicPatient = useMemo(
    () => [...byClinic].sort((a, b) => (b.patient_screen + b.patient_email) - (a.patient_screen + a.patient_email)).find(c => c.patient_screen + c.patient_email > 0) ?? null,
    [byClinic]
  )

  const clinicBarData = useMemo(
    () => [...byClinic].sort((a, b) => b.welcome_screen - a.welcome_screen).slice(0, 10).map(c => ({ name: c.clinic_name, value: c.welcome_screen })),
    [byClinic]
  )
  const patientBarData = useMemo(
    () => [...byClinic].sort((a, b) => (b.patient_screen + b.patient_email) - (a.patient_screen + a.patient_email)).slice(0, 10)
      .map(c => ({ name: c.clinic_name, [t('mediaStats.patient_screen_series') as string]: c.patient_screen, [t('mediaStats.patient_email_series') as string]: c.patient_email })),
    [byClinic, t]
  )
  const patientPieData = useMemo(() => {
    const screen = data?.totals.patient_screen ?? 0
    const email = data?.totals.patient_email ?? 0
    if (screen + email === 0) return []
    return [
      { name: t('mediaStats.patient_screen_series') as string, value: screen },
      { name: t('mediaStats.patient_email_series') as string, value: email },
    ]
  }, [data, t])

  const provinceWelcomeBarData = useMemo(
    () => [...byProvince].sort((a, b) => b.welcome_screen - a.welcome_screen).slice(0, 10)
      .map(p => ({ name: provinceLabel(p.province, provinceLabels, unsetProvinceLabel), value: p.welcome_screen })),
    [byProvince, provinceLabels, unsetProvinceLabel]
  )
  const provincePatientBarData = useMemo(
    () => [...byProvince].sort((a, b) => (b.patient_screen + b.patient_email) - (a.patient_screen + a.patient_email)).slice(0, 10)
      .map(p => ({
        name: provinceLabel(p.province, provinceLabels, unsetProvinceLabel),
        [t('mediaStats.patient_screen_series') as string]: p.patient_screen,
        [t('mediaStats.patient_email_series') as string]: p.patient_email,
      })),
    [byProvince, provinceLabels, unsetProvinceLabel, t]
  )

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

      {/* Clínica (personal) vs Paciente — audiencias distintas, estadísticas separadas */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setView('clinic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'clinic' ? 'bg-white text-pink-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Eye className="w-4 h-4" />{t('mediaStats.view_clinic')}
        </button>
        <button
          onClick={() => setView('patient')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'patient' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Mail className="w-4 h-4" />{t('mediaStats.view_patient')}
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">{t('common.loading')}</div>
      ) : view === 'clinic' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-pink-50 border border-pink-100 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                <Eye className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{data?.totals.welcome_screen ?? 0}</p>
                <p className="text-xs text-slate-500">{t('mediaStats.welcome_total')}</p>
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
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{topClinicWelcome?.clinic_name ?? dash}</p>
                <p className="text-xs text-slate-500">{t('mediaStats.top_clinic')}</p>
              </div>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <BarChart3 className="w-8 h-8 opacity-20" />
              {t('mediaStats.no_data')}
            </div>
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="welcome_screen" name={t('mediaStats.welcome_series')} stroke="#DB2777" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {clinicBarData.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.by_clinic_chart_title')}</p>
              <div style={{ width: '100%', height: Math.max(160, clinicBarData.length * 34) }}>
                <ResponsiveContainer>
                  <BarChart data={clinicBarData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Bar dataKey="value" name={t('mediaStats.welcome_series')} fill="#DB2777" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {provinceWelcomeBarData.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.by_province_chart_title')}</p>
              <div style={{ width: '100%', height: Math.max(160, provinceWelcomeBarData.length * 34) }}>
                <ResponsiveContainer>
                  <BarChart data={provinceWelcomeBarData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Bar dataKey="value" name={t('mediaStats.welcome_series')} fill="#F472B6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <ClinicTable
            rows={byClinic}
            columns={['welcome_screen', 'avg_welcome']}
            t={t}
            dash={dash}
          />
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <p className="text-2xl font-bold text-slate-800">{formatDuration(data?.totals.avg_view_seconds_patient ?? null, dash)}</p>
                <p className="text-xs text-slate-500">{t('mediaStats.avg_view_patient')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Trophy className="w-5 h-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">{topClinicPatient?.clinic_name ?? dash}</p>
                <p className="text-xs text-slate-500">{t('mediaStats.top_clinic')}</p>
              </div>
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <BarChart3 className="w-8 h-8 opacity-20" />
              {t('mediaStats.no_data')}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2" style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="patient_screen" name={t('mediaStats.patient_screen_series')} stroke="#2563EB" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="patient_email" name={t('mediaStats.patient_email_series')} stroke="#059669" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">{t('mediaStats.channel_split_title')}</p>
                {patientPieData.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400">{t('mediaStats.no_data')}</div>
                ) : (
                  <div style={{ width: '100%', height: 220 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={patientPieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                          {patientPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {patientBarData.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.by_clinic_chart_title')}</p>
              <div style={{ width: '100%', height: Math.max(160, patientBarData.length * 34) }}>
                <ResponsiveContainer>
                  <BarChart data={patientBarData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey={t('mediaStats.patient_screen_series') as string} stackId="patient" fill="#2563EB" radius={[0, 0, 0, 0]} />
                    <Bar dataKey={t('mediaStats.patient_email_series') as string} stackId="patient" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {provincePatientBarData.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.by_province_chart_title')}</p>
              <div style={{ width: '100%', height: Math.max(160, provincePatientBarData.length * 34) }}>
                <ResponsiveContainer>
                  <BarChart data={provincePatientBarData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey={t('mediaStats.patient_screen_series') as string} stackId="patient_province" fill="#2563EB" radius={[0, 0, 0, 0]} />
                    <Bar dataKey={t('mediaStats.patient_email_series') as string} stackId="patient_province" fill="#059669" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <ClinicTable
            rows={byClinic}
            columns={['patient_screen', 'patient_email', 'total', 'avg_patient']}
            t={t}
            dash={dash}
          />

          <p className="text-xs text-slate-400">{t('mediaStats.patient_note')}</p>
        </>
      )}
    </div>
  )
}

type ClinicColumn = 'welcome_screen' | 'patient_screen' | 'patient_email' | 'total' | 'avg_welcome' | 'avg_patient'

function ClinicTable({ rows, columns, t, dash }: { rows: ClinicRow[]; columns: ClinicColumn[]; t: (key: string) => string; dash: string }) {
  const headers: Record<ClinicColumn, string> = {
    welcome_screen: t('mediaStats.table.welcome_screen'),
    patient_screen: t('mediaStats.table.patient_screen'),
    patient_email: t('mediaStats.table.patient_email'),
    total: t('mediaStats.table.total'),
    avg_welcome: t('mediaStats.table.avg_welcome'),
    avg_patient: t('mediaStats.table.avg_patient'),
  }
  const cell = (row: ClinicRow, col: ClinicColumn): string => {
    if (col === 'avg_welcome') return formatDuration(row.avg_view_seconds_welcome, dash)
    if (col === 'avg_patient') return formatDuration(row.avg_view_seconds_patient, dash)
    return String(row[col])
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-slate-500" />
        <h4 className="text-sm font-bold text-slate-700">{t('mediaStats.by_clinic_title')}</h4>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">{t('mediaStats.no_clinic_data')}</p>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('mediaStats.table.clinic')}</th>
                {columns.map(c => (
                  <th key={c} className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">{headers[c]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(row => (
                <tr key={row.clinic_id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{row.clinic_name}</td>
                  {columns.map(c => (
                    <td key={c} className={`px-4 py-2.5 text-right text-slate-600 ${c === 'total' ? 'font-semibold text-slate-800' : ''}`}>{cell(row, c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
