import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CreditCard, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'

interface Subscription {
  id: string
  clinic_id: string
  clinic_name: string
  plan_id: string
  plan_name: string
  billing_cycle: 'monthly' | 'annual'
  amount: number
  status: string
  activated_at: string
  expires_at: string | null
  cancel_at_period_end: boolean
}

type Bucket = 'all' | 'active' | 'past_due' | 'canceled'

function bucketOf(status: string): Exclude<Bucket, 'all'> {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled'
  return 'past_due' // past_due, unpaid, incomplete, paused
}

function fmtDate(iso: string | null, locale: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function SubscriptionsPanel() {
  const { t, i18n } = useTranslation()
  const [subs, setSubs] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<Bucket>('all')

  const load = () => {
    setLoading(true)
    setError('')
    api.get('/billing/subscriptions')
      .then((data: any) => setSubs(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message ?? t('subscriptionsPanel.loadError')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(
    () => filter === 'all' ? subs : subs.filter(s => bucketOf(s.status) === filter),
    [subs, filter]
  )

  const counts = useMemo(() => {
    const c: Record<Bucket, number> = { all: subs.length, active: 0, past_due: 0, canceled: 0 }
    for (const s of subs) c[bucketOf(s.status)]++
    return c
  }, [subs])

  const FILTERS: { key: Bucket; label: string }[] = [
    { key: 'all', label: t('subscriptionsPanel.filters.all') },
    { key: 'active', label: t('subscriptionsPanel.filters.active') },
    { key: 'past_due', label: t('subscriptionsPanel.filters.pastDue') },
    { key: 'canceled', label: t('subscriptionsPanel.filters.canceled') },
  ]

  const BUCKET_BADGE: Record<Exclude<Bucket, 'all'>, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    past_due: 'bg-amber-100 text-amber-700',
    canceled: 'bg-slate-100 text-slate-600',
  }

  const amountFormatter = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.key ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f.label} <span className="text-xs text-slate-400">({counts[f.key]})</span>
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('subscriptionsPanel.refresh')}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">{t('settings.tabs.subscriptions')}</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">{t('subscriptionsPanel.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3">{t('subscriptionsPanel.table.clinic')}</th>
                  <th className="px-5 py-3">{t('subscriptionsPanel.table.plan')}</th>
                  <th className="px-5 py-3">{t('subscriptionsPanel.table.cycle')}</th>
                  <th className="px-5 py-3">{t('subscriptionsPanel.table.amount')}</th>
                  <th className="px-5 py-3">{t('subscriptionsPanel.table.status')}</th>
                  <th className="px-5 py-3">{t('subscriptionsPanel.table.activatedAt')}</th>
                  <th className="px-5 py-3">{t('subscriptionsPanel.table.expiresAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(s => {
                  const bucket = bucketOf(s.status)
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-700">{s.clinic_name}</td>
                      <td className="px-5 py-3 text-slate-600">{s.plan_name}</td>
                      <td className="px-5 py-3 text-slate-500">
                        {s.billing_cycle === 'annual' ? t('subscriptionsPanel.cycle.annual') : t('subscriptionsPanel.cycle.monthly')}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{amountFormatter.format(s.amount)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BUCKET_BADGE[bucket]}`}>
                          {t(`subscriptionsPanel.status.${bucket}`)}
                        </span>
                        {s.cancel_at_period_end && bucket === 'active' && (
                          <span className="block text-xs text-amber-600 mt-0.5">{t('subscriptionsPanel.cancelsAtPeriodEnd')}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(s.activated_at, i18n.language)}</td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(s.expires_at, i18n.language)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
