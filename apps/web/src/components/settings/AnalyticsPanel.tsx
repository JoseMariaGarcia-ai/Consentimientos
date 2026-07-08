import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Eye, Users, UserPlus, Clock, ArrowDownRight, RefreshCw,
  Monitor, Smartphone, Tablet, Globe,
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts'
import { api } from '@/lib/api'

/* ─── Palette (validated categorical + sequential, light surface only —
   this app has no dark mode) ────────────────────────────────────────── */
const SERIES_PAGEVIEWS = '#2a78d6' // categorical slot 1 (blue)
const SERIES_SESSIONS  = '#1baf7a' // categorical slot 2 (aqua)
const SEQ_BLUE = '#2a78d6'
const INK_PRIMARY = '#0b0b0b'
const INK_SECONDARY = '#52514e'
const INK_MUTED = '#898781'
const GRIDLINE = '#e1e0d9'

interface Summary {
  range: { from: string; to: string }
  totals: {
    pageviews: number
    sessions: number
    new_sessions: number
    avg_duration_ms: number | null
    bounce_rate: number | null
  }
  daily: { day: string; pageviews: number; sessions: number }[]
  top_paths: { path: string; pageviews: number; avg_duration_ms: number | null }[]
  top_referrers: { referrer: string; count: number }[]
  devices: { device_type: string; count: number }[]
  browsers: { browser: string; count: number }[]
  os: { os: string; count: number }[]
  roles: { role: string; count: number }[]
}

const RANGE_OPTIONS = [
  { days: 7,  labelKey: 'analytics.range.d7' },
  { days: 30, labelKey: 'analytics.range.d30' },
  { days: 90, labelKey: 'analytics.range.d90' },
]

function fmtDuration(ms: number | null, t: (k: string) => string) {
  if (ms == null) return '—'
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}${t('analytics.unit.min')} ${sec}${t('analytics.unit.sec')}`
}

function fmtDay(day: string) {
  const d = new Date(day + 'T00:00:00')
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

function StatTile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}1A` }}>
          <Icon className="w-4 h-4" style={{ color: accent }} />
        </div>
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

const DEVICE_ICON: Record<string, any> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet }

function DistributionBars({ title, icon: Icon, items, labelFor }: {
  title: string; icon: any
  items: { key: string; count: number }[]
  labelFor?: (key: string) => string
}) {
  const max = Math.max(1, ...items.map(i => i.count))
  const total = items.reduce((s, i) => s + i.count, 0) || 1
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Icon className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">—</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map(item => {
            const DevIcon = DEVICE_ICON[item.key]
            const pct = Math.round((item.count / total) * 100)
            return (
              <div key={item.key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-600">
                    {DevIcon && <DevIcon className="w-3.5 h-3.5 text-slate-400" />}
                    {labelFor ? labelFor(item.key) : item.key}
                  </span>
                  <span className="text-slate-400">{item.count} · {pct}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(4, (item.count / max) * 100)}%`, backgroundColor: SEQ_BLUE }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AnalyticsPanel() {
  const { t } = useTranslation()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const to = new Date()
      const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000)
      const result = await api.get(`/analytics/summary?from=${from.toISOString()}&to=${to.toISOString()}`)
      setData(result)
    } catch (e: any) {
      setError(e?.message || t('analytics.load_error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [days])

  const dailyChartData = useMemo(
    () => (data?.daily ?? []).map(d => ({ ...d, label: fmtDay(d.day) })),
    [data]
  )

  const maxTopPath = Math.max(1, ...(data?.top_paths ?? []).map(p => p.pageviews))

  return (
    <div className="flex flex-col gap-5">
      {/* Range selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === opt.days ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('analytics.refresh')}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && !data ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : data && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatTile icon={Eye} label={t('analytics.kpi.pageviews')} value={data.totals.pageviews.toLocaleString('es-ES')} accent={SERIES_PAGEVIEWS} />
            <StatTile icon={Users} label={t('analytics.kpi.sessions')} value={data.totals.sessions.toLocaleString('es-ES')} accent={SERIES_SESSIONS} />
            <StatTile icon={UserPlus} label={t('analytics.kpi.new_sessions')} value={data.totals.new_sessions.toLocaleString('es-ES')} accent="#4a3aa7" />
            <StatTile icon={Clock} label={t('analytics.kpi.avg_duration')} value={fmtDuration(data.totals.avg_duration_ms, t)} accent="#eda100" />
            <StatTile icon={ArrowDownRight} label={t('analytics.kpi.bounce_rate')} value={data.totals.bounce_rate != null ? `${data.totals.bounce_rate}%` : '—'} accent="#e34948" />
          </div>

          {/* Evolution line chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">{t('analytics.chart.evolution')}</h3>
            {dailyChartData.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">{t('analytics.no_data')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dailyChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRIDLINE} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid #e1e0d9', fontSize: 12 }}
                    labelStyle={{ color: INK_PRIMARY, fontWeight: 600 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, color: INK_SECONDARY }} />
                  <Line type="monotone" dataKey="pageviews" name={t('analytics.kpi.pageviews')} stroke={SERIES_PAGEVIEWS} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sessions" name={t('analytics.kpi.sessions')} stroke={SERIES_SESSIONS} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top paths + top referrers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">{t('analytics.chart.top_paths')}</h3>
              {data.top_paths.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">{t('analytics.no_data')}</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {data.top_paths.map(p => (
                    <div key={p.path} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="font-mono text-slate-600 truncate">{p.path}</span>
                        <span className="text-slate-400 flex-shrink-0">{p.pageviews} · {fmtDuration(p.avg_duration_ms, t)}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(4, (p.pageviews / maxTopPath) * 100)}%`, backgroundColor: SEQ_BLUE }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4">{t('analytics.chart.top_referrers')}</h3>
              {data.top_referrers.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">{t('analytics.no_data')}</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.top_referrers.map(r => (
                    <div key={r.referrer} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-1.5 text-slate-600 truncate">
                        <Globe className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{r.referrer}</span>
                      </span>
                      <span className="text-slate-400 flex-shrink-0 ml-2">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Devices / browsers / os / roles */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <DistributionBars
              title={t('analytics.chart.devices')}
              icon={Monitor}
              items={data.devices.map(d => ({ key: d.device_type, count: d.count }))}
              labelFor={k => t(`analytics.device.${k}`, k)}
            />
            <DistributionBars
              title={t('analytics.chart.browsers')}
              icon={Globe}
              items={data.browsers.map(b => ({ key: b.browser, count: b.count }))}
            />
            <DistributionBars
              title={t('analytics.chart.os')}
              icon={Monitor}
              items={data.os.map(o => ({ key: o.os, count: o.count }))}
            />
            <DistributionBars
              title={t('analytics.chart.roles')}
              icon={Users}
              items={data.roles.map(r => ({ key: r.role, count: r.count }))}
            />
          </div>
        </>
      )}
    </div>
  )
}
