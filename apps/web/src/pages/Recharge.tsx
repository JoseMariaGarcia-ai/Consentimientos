import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Check, Zap, CheckCircle2, XCircle, CreditCard } from 'lucide-react'
import { api } from '../lib/api'

export interface Plan {
  id: string
  monthlyPrice: number
  color: string
  priceColor: string
  hasBadge: boolean
}

export const PLANS: Plan[] = [
  { id: 'base', monthlyPrice: 49, color: 'bg-[#6B21A8]', priceColor: 'text-[#C9A84C]', hasBadge: false },
  { id: 'pro', monthlyPrice: 79, color: 'bg-[#0D1B2E]', priceColor: 'text-[#C9A84C]', hasBadge: true },
  { id: 'ia', monthlyPrice: 119, color: 'bg-[#14532D]', priceColor: 'text-[#C9A84C]', hasBadge: false },
  { id: 'ia-plus', monthlyPrice: 159, color: 'bg-[#1C1408]', priceColor: 'text-[#C9A84C]', hasBadge: true },
  { id: 'redes', monthlyPrice: 599, color: 'bg-[#831843]', priceColor: 'text-[#C9A84C]', hasBadge: true },
]

export const PLAN_KEY: Record<string, string> = { base: 'base', pro: 'pro', ia: 'ia', 'ia-plus': 'ia_plus', redes: 'redes' }

const ANNUAL_DISCOUNT = 0.2

function PlanCard({ plan }: { plan: Plan }) {
  const { t } = useTranslation()
  const [cycle, setCycle] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isAnnual = cycle === 'annual'
  const displayPrice = isAnnual
    ? Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT))
    : plan.monthlyPrice

  const key = PLAN_KEY[plan.id]
  const name = t(`recharge.plans.${key}.name`)
  const badge = plan.hasBadge ? t(`recharge.plans.${key}.badge`) : null
  const features = t(`recharge.plans.${key}.features`, { returnObjects: true }) as string[]

  async function handleHire() {
    setLoading(true)
    setError(null)
    try {
      const { url } = await api.post('/billing/checkout', { planId: plan.id, cycle })
      window.location.href = url
    } catch (err) {
      setLoading(false)
      setError(err instanceof Error ? err.message : t('recharge.checkout_error'))
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative flex flex-col">
      {badge && (
        <div className="absolute top-4 right-4 text-[10px] font-bold bg-[#C9A84C] text-[#0D1B2E] px-2.5 py-1 rounded-full uppercase tracking-wide z-10">
          {badge}
        </div>
      )}

      {/* Header */}
      <div className={`${plan.color} px-6 pt-6 pb-6`}>
        <p className="text-white font-bold text-lg">{name}</p>

        {/* Mensual / Anual toggle */}
        <div className="flex items-center gap-1 mt-3 bg-white/10 rounded-lg p-1 w-fit">
          <button
            type="button"
            onClick={() => setCycle('monthly')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              !isAnnual ? 'bg-white text-slate-800' : 'text-white/60 hover:text-white'
            }`}
          >
            {t('recharge.monthly')}
          </button>
          <button
            type="button"
            onClick={() => setCycle('annual')}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              isAnnual ? 'bg-white text-slate-800' : 'text-white/60 hover:text-white'
            }`}
          >
            {t('recharge.annual')}
          </button>
        </div>

        <div className="flex items-end gap-1 mt-3">
          <span className={`text-4xl font-black ${plan.priceColor}`}>{displayPrice} €</span>
          <span className="text-white/60 text-sm mb-1">{t('recharge.per_month')}</span>
        </div>

        {isAnnual ? (
          <p className="text-emerald-400 text-xs font-semibold mt-1">{t('recharge.save_20_annual')}</p>
        ) : (
          <p className="text-white/40 text-xs mt-1">{t('recharge.switch_annual_save')}</p>
        )}
      </div>

      {/* Features */}
      <div className="px-6 py-5 flex flex-col gap-2.5 flex-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-slate-700">{f}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={handleHire}
          disabled={loading}
          className="w-full py-2.5 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? t('recharge.redirecting') : t('recharge.hire_plan')}
        </button>
        {error && (
          <div className="mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface SubscriptionStatus {
  plan_id: string
  billing_cycle: 'monthly' | 'annual'
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

function bucketOf(status: string): 'active' | 'past_due' | 'canceled' {
  if (status === 'active' || status === 'trialing') return 'active'
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled'
  return 'past_due'
}

const BUCKET_BADGE: Record<'active' | 'past_due' | 'canceled', string> = {
  active: 'bg-emerald-100 text-emerald-700',
  past_due: 'bg-amber-100 text-amber-700',
  canceled: 'bg-slate-100 text-slate-600',
}

function CurrentPlanStatus() {
  const { t, i18n } = useTranslation()
  const [sub, setSub] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get('/billing/status')
      .then(data => setSub(data ?? null))
      .catch(() => setSub(null))
      .finally(() => setLoading(false))
  }, [])

  async function handleManage() {
    setPortalLoading(true)
    setError(null)
    try {
      const { url } = await api.post('/billing/portal', {})
      window.location.href = url
    } catch (err) {
      setPortalLoading(false)
      setError(err instanceof Error ? err.message : t('recharge.currentPlan.manageError'))
    }
  }

  if (loading || !sub) return null

  const key = PLAN_KEY[sub.plan_id]
  const planName = key ? t(`recharge.plans.${key}.name`) : sub.plan_id
  const bucket = bucketOf(sub.status)
  const dateStr = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-700">{t('recharge.currentPlan.title')}: {planName}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BUCKET_BADGE[bucket]}`}>
              {t(`subscriptionsPanel.status.${bucket === 'past_due' ? 'past_due' : bucket}`)}
            </span>
          </div>
          {dateStr && (
            <p className="text-xs text-slate-500 mt-1">
              {sub.cancel_at_period_end
                ? `${t('subscriptionsPanel.cancelsAtPeriodEnd')} — ${dateStr}`
                : `${t('recharge.currentPlan.renewsOn')} ${dateStr}`}
            </p>
          )}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={handleManage}
        disabled={portalLoading}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
      >
        {portalLoading ? t('recharge.currentPlan.manageLoading') : t('recharge.currentPlan.manage')}
      </button>
    </div>
  )
}

export default function Recharge() {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutResult = searchParams.get('checkout')

  function dismissCheckoutBanner() {
    searchParams.delete('checkout')
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('recharge.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('recharge.subtitle')}</p>
        </div>
      </div>

      <CurrentPlanStatus />

      {checkoutResult === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 flex-1">{t('recharge.checkout_success')}</p>
          <button type="button" onClick={dismissCheckoutBanner} className="text-xs text-emerald-700 underline">
            {t('recharge.dismiss')}
          </button>
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <XCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <p className="text-sm text-slate-600 flex-1">{t('recharge.checkout_cancelled')}</p>
          <button type="button" onClick={dismissCheckoutBanner} className="text-xs text-slate-500 underline">
            {t('recharge.dismiss')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {PLANS.map(plan => <PlanCard key={plan.id} plan={plan} />)}
      </div>

      {/* Plan IA / IA Premium note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm text-amber-800 leading-relaxed">
          <strong>{t('recharge.note_title')}</strong> {t('recharge.note_text')}
        </p>
      </div>

      {/* Plan Redes note */}
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
        <p className="text-sm text-rose-800 leading-relaxed">
          <strong>{t('recharge.note_redes_title')}</strong> {t('recharge.note_redes_text')}
        </p>
      </div>
    </div>
  )
}
