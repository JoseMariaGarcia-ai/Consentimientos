import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, RefreshCw, ExternalLink, AlertTriangle, X } from 'lucide-react'
import { api } from '../lib/api'

interface ClinicRevenueRow {
  clinic_id: string
  name: string
  trade_name: string | null
  balance_cents: string
  auto_recharge: boolean
  total_recharged_cents: string
  last_recharge_at: string | null
}

interface IntegrityAlarm {
  id: string
  clinic_id: string
  clinic_name: string
  expected_balance_cents: string
  actual_balance_cents: string
  detected_at: string
}

interface ProviderBalance {
  provider: 'anthropic' | 'retell' | 'ycloud'
  hasApi: boolean
  amount: number | null
  currency: string | null
  dashboardUrl: string
  note: string
  checkedAt: string
  error: string | null
}

function money(i18n: any, cents: number) {
  return new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

function ProviderBalanceOverview() {
  const { t, i18n } = useTranslation()
  const [balances, setBalances] = useState<ProviderBalance[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback((refresh = false) => {
    setRefreshing(true)
    api.get(`/admin/provider-balances${refresh ? '?refresh=1' : ''}`)
      .then(setBalances)
      .catch(() => setBalances([]))
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-700">{t('aiRevenue.providerBalances.title')}</p>
          <p className="text-xs text-slate-500 mt-0.5">{t('aiRevenue.providerBalances.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {t('aiRevenue.providerBalances.refresh')}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(balances ?? []).map(b => (
          <div key={b.provider} className="border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
            <p className="text-sm font-bold text-slate-800 capitalize">{b.provider}</p>
            {b.hasApi && b.amount !== null ? (
              <p className="text-2xl font-black text-slate-800">
                {b.amount.toLocaleString(i18n.language, { maximumFractionDigits: 2 })} {b.currency}
              </p>
            ) : (
              <p className="text-xs text-slate-500">{b.note}</p>
            )}
            {b.error && <p className="text-xs text-red-600">{b.error}</p>}
            <a
              href={b.dashboardUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-brand font-semibold hover:underline mt-auto"
            >
              {t('aiRevenue.providerBalances.openDashboard')} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}

function IntegrityAlarms() {
  const { t, i18n } = useTranslation()
  const [alarms, setAlarms] = useState<IntegrityAlarm[]>([])
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const load = useCallback(() => {
    api.get('/admin/ai-revenue/integrity-alarms').then(setAlarms).catch(() => setAlarms([]))
  }, [])

  useEffect(() => { load() }, [load])

  async function resolve(id: string) {
    if (!notes.trim()) return
    await api.post(`/admin/ai-revenue/integrity-alarms/${id}/resolve`, { notes })
    setResolvingId(null)
    setNotes('')
    load()
  }

  if (alarms.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <p className="text-sm font-bold text-red-800">{t('aiRevenue.integrityAlarms.title')}</p>
      </div>
      {alarms.map(a => (
        <div key={a.id} className="bg-white border border-red-200 rounded-xl p-3 flex flex-col gap-2">
          <p className="text-sm text-slate-700">
            <strong>{a.clinic_name}</strong> — {t('aiRevenue.integrityAlarms.expected')}: {money(i18n, Number(a.expected_balance_cents))},{' '}
            {t('aiRevenue.integrityAlarms.actual')}: {money(i18n, Number(a.actual_balance_cents))}
          </p>
          {resolvingId === a.id ? (
            <div className="flex items-center gap-2">
              <input
                type="text" value={notes} onChange={e => setNotes(e.target.value)}
                placeholder={t('aiRevenue.integrityAlarms.notesPlaceholder')}
                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
              />
              <button onClick={() => resolve(a.id)} className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold">
                {t('aiRevenue.integrityAlarms.confirm')}
              </button>
              <button onClick={() => setResolvingId(null)} className="p-1.5 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <button
              onClick={() => setResolvingId(a.id)}
              className="self-start text-xs font-semibold text-red-700 hover:underline"
            >
              {t('aiRevenue.integrityAlarms.resolve')}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

function AiRevenueDetail({ clinicId, onClose }: { clinicId: string; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const [detail, setDetail] = useState<any>(null)

  useEffect(() => {
    api.get(`/admin/ai-revenue/${clinicId}`).then(setDetail).catch(() => setDetail(null))
  }, [clinicId])

  if (!detail) return (
    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-sm">{t('common.loading')}</div>
  )

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-slate-800">{detail.clinic.trade_name ?? detail.clinic.name}</p>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500">{t('aiRevenue.detail.balance')}</p>
          <p className="text-lg font-bold text-slate-800">{money(i18n, Number(detail.account?.balance_cents ?? 0))}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('aiRevenue.detail.monthProfit')}</p>
          <p className="text-lg font-bold text-emerald-600">{money(i18n, detail.monthToDate.profitCents)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('aiRevenue.detail.historicProfit')}</p>
          <p className="text-lg font-bold text-emerald-600">{money(i18n, detail.historicTotals.profitCents)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('aiRevenue.detail.historicCost')}</p>
          <p className="text-lg font-bold text-slate-800">{money(i18n, detail.historicTotals.realCostCents)}</p>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">{t('aiRevenue.detail.byService')}</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase">
              <th className="pb-1">{t('aiCredits.table.service')}</th>
              <th className="pb-1 text-right">{t('aiRevenue.detail.realCost')}</th>
              <th className="pb-1 text-right">{t('aiRevenue.detail.charged')}</th>
            </tr>
          </thead>
          <tbody>
            {detail.byService.map((s: any) => (
              <tr key={s.service} className="border-t border-slate-100">
                <td className="py-1.5">{t(`aiCredits.services.${s.service}`)}</td>
                <td className="py-1.5 text-right">{money(i18n, Number(s.real_cost_cents))}</td>
                <td className="py-1.5 text-right font-semibold">{money(i18n, Number(s.charged_cents))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AiRevenueOverview({ onSelect }: { onSelect: (clinicId: string) => void }) {
  const { t, i18n } = useTranslation()
  const [rows, setRows] = useState<ClinicRevenueRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/ai-revenue').then(setRows).catch(() => setRows([])).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">{t('common.loading')}</div>

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <p className="text-sm font-semibold text-slate-700 mb-4">{t('aiRevenue.overview.title')}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
              <th className="pb-2">{t('aiRevenue.overview.clinic')}</th>
              <th className="pb-2 text-right">{t('aiRevenue.overview.balance')}</th>
              <th className="pb-2 text-right">{t('aiRevenue.overview.totalRecharged')}</th>
              <th className="pb-2 text-center">{t('aiRevenue.overview.autoRecharge')}</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr
                key={r.clinic_id}
                onClick={() => onSelect(r.clinic_id)}
                className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
              >
                <td className="py-2 font-medium text-slate-700">{r.trade_name ?? r.name}</td>
                <td className="py-2 text-right">{money(i18n, Number(r.balance_cents))}</td>
                <td className="py-2 text-right text-slate-500">{money(i18n, Number(r.total_recharged_cents))}</td>
                <td className="py-2 text-center">
                  {r.auto_recharge
                    ? <span className="text-emerald-600 text-xs font-semibold">{t('common.yes')}</span>
                    : <span className="text-slate-400 text-xs">{t('common.no')}</span>}
                </td>
                <td className="py-2 text-right text-xs text-brand font-semibold">{t('aiRevenue.overview.viewDetail')} →</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AiRevenue() {
  const { t } = useTranslation()
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('aiRevenue.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('aiRevenue.subtitle')}</p>
        </div>
      </div>

      <ProviderBalanceOverview />
      <IntegrityAlarms />
      <AiRevenueOverview onSelect={setSelectedClinic} />
      {selectedClinic && <AiRevenueDetail clinicId={selectedClinic} onClose={() => setSelectedClinic(null)} />}
    </div>
  )
}
