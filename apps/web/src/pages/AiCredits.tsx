import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Sparkles, CheckCircle2, XCircle, CreditCard, Zap } from 'lucide-react'
import { api } from '../lib/api'

interface Balance {
  balanceCents: number
  lastRechargeAmountCents: number
  pctRemaining: number
  autoRecharge: boolean
  autoRechargeAmountCents: number
  autoRechargeThresholdPct: number
  hasPaymentMethod: boolean
}

interface Transaction {
  id: string
  transaction_type: string
  amount_cents: string
  balance_after_cents: string
  service: string | null
  real_cost_cents: string | null
  margin_cents: string | null
  notes: string | null
  created_at: string
}

const SERVICES = ['anthropic', 'openrouter', 'retell', 'ycloud'] as const

function pctColor(pct: number): string {
  if (pct <= 5) return 'bg-red-500'
  if (pct <= 10) return 'bg-orange-500'
  if (pct <= 20) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function BalanceCard({ balance, onChanged }: { balance: Balance; onChanged: () => void }) {
  const { t, i18n } = useTranslation()
  const money = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' })
  const [presets, setPresets] = useState<number[]>([])
  const [customAmount, setCustomAmount] = useState('')
  const [loadingRecharge, setLoadingRecharge] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savingCard, setSavingCard] = useState(false)
  const [autoRecharge, setAutoRecharge] = useState(balance.autoRecharge)
  const [autoAmount, setAutoAmount] = useState(String(balance.autoRechargeAmountCents / 100))
  const [autoThreshold, setAutoThreshold] = useState(String(balance.autoRechargeThresholdPct))
  const [savingAuto, setSavingAuto] = useState(false)

  useEffect(() => {
    api.get('/ai-credits/presets').then(d => setPresets(d.presets ?? [])).catch(() => setPresets([]))
  }, [])

  async function recharge(amountCents: number) {
    setError(null)
    setLoadingRecharge(amountCents)
    try {
      const { url } = await api.post('/ai-credits/recharge', { amountCents })
      window.location.href = url
    } catch (err) {
      setLoadingRecharge(null)
      setError(err instanceof Error ? err.message : t('aiCredits.rechargeError'))
    }
  }

  async function handleCustomRecharge() {
    const euros = Number(customAmount.replace(',', '.'))
    if (!Number.isFinite(euros) || euros < 5) {
      setError(t('aiCredits.customAmountInvalid'))
      return
    }
    await recharge(Math.round(euros * 100))
  }

  async function handleSaveCard() {
    setSavingCard(true)
    setError(null)
    try {
      const { url } = await api.post('/ai-credits/setup-intent', {})
      window.location.href = url
    } catch (err) {
      setSavingCard(false)
      setError(err instanceof Error ? err.message : t('aiCredits.saveCardError'))
    }
  }

  async function handleSaveAutoRecharge() {
    setSavingAuto(true)
    setError(null)
    try {
      await api.put('/ai-credits/auto-recharge', {
        enabled: autoRecharge,
        amountCents: Math.round(Number(autoAmount.replace(',', '.')) * 100),
        thresholdPct: Number(autoThreshold),
      })
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiCredits.autoRechargeError'))
    } finally {
      setSavingAuto(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-slate-500">{t('aiCredits.currentBalance')}</p>
          <p className="text-4xl font-black text-slate-800">{money.format(balance.balanceCents / 100)}</p>
        </div>
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{t('aiCredits.remaining')}</span>
            <span>{Math.max(0, Math.round(balance.pctRemaining))}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pctColor(balance.pctRemaining)}`}
              style={{ width: `${Math.min(100, Math.max(0, balance.pctRemaining))}%` }}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
          <p className="text-xs text-red-700 font-medium">{error}</p>
        </div>
      )}

      {/* Recarga */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">{t('aiCredits.rechargeTitle')}</p>
        <div className="flex flex-wrap gap-2">
          {presets.map(cents => (
            <button
              key={cents}
              type="button"
              onClick={() => recharge(cents)}
              disabled={loadingRecharge !== null}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:border-brand hover:bg-blue-50 text-sm font-semibold text-slate-700 transition-colors disabled:opacity-60"
            >
              {loadingRecharge === cents ? t('aiCredits.redirecting') : money.format(cents / 100)}
            </button>
          ))}
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder={t('aiCredits.customAmountPlaceholder')}
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              className="w-28 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            <button
              type="button"
              onClick={handleCustomRecharge}
              disabled={loadingRecharge !== null || !customAmount}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {t('aiCredits.rechargeCustom')}
            </button>
          </div>
        </div>
      </div>

      {/* Auto-recarga */}
      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <div>
              <p className="text-sm font-semibold text-slate-700">{t('aiCredits.autoRechargeTitle')}</p>
              <p className="text-xs text-slate-500">
                {balance.hasPaymentMethod ? t('aiCredits.cardSaved') : t('aiCredits.noCardSaved')}
              </p>
            </div>
          </div>
          {!balance.hasPaymentMethod && (
            <button
              type="button"
              onClick={handleSaveCard}
              disabled={savingCard}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-slate-700 transition-colors disabled:opacity-60"
            >
              {savingCard ? t('aiCredits.redirecting') : t('aiCredits.saveCard')}
            </button>
          )}
        </div>

        {balance.hasPaymentMethod && (
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={autoRecharge}
                onChange={e => setAutoRecharge(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand/30"
              />
              {t('aiCredits.enableAutoRecharge')}
            </label>
            {autoRecharge && (
              <div className="flex flex-wrap gap-3 items-center pl-6">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  {t('aiCredits.autoAmount')}
                  <input
                    type="text" inputMode="decimal" value={autoAmount}
                    onChange={e => setAutoAmount(e.target.value)}
                    className="w-20 px-2 py-1 rounded-lg border border-slate-200 text-sm"
                  />
                  €
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  {t('aiCredits.autoThreshold')}
                  <input
                    type="text" inputMode="decimal" value={autoThreshold}
                    onChange={e => setAutoThreshold(e.target.value)}
                    className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-sm"
                  />
                  %
                </label>
              </div>
            )}
            <button
              type="button"
              onClick={handleSaveAutoRecharge}
              disabled={savingAuto}
              className="self-start px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {savingAuto ? t('common.saving') : t('common.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function TransactionsTable() {
  const { t, i18n } = useTranslation()
  const money = new Intl.NumberFormat(i18n.language, { style: 'currency', currency: 'EUR' })
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [service, setService] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    const qs = service ? `?service=${service}` : ''
    api.get(`/ai-credits/transactions${qs}`)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false))
  }, [service])

  useEffect(() => { load() }, [load])

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <p className="text-sm font-semibold text-slate-700">{t('aiCredits.history')}</p>
        <select
          value={service}
          onChange={e => setService(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm"
        >
          <option value="">{t('aiCredits.allServices')}</option>
          {SERVICES.map(s => <option key={s} value={s}>{t(`aiCredits.services.${s}`)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">{t('common.loading')}</div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">{t('aiCredits.noTransactions')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                <th className="pb-2 pr-4">{t('aiCredits.table.date')}</th>
                <th className="pb-2 pr-4">{t('aiCredits.table.type')}</th>
                <th className="pb-2 pr-4">{t('aiCredits.table.service')}</th>
                <th className="pb-2 pr-4 text-right">{t('aiCredits.table.amount')}</th>
                <th className="pb-2 text-right">{t('aiCredits.table.balanceAfter')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const amount = Number(tx.amount_cents)
                return (
                  <tr key={tx.id} className="border-t border-slate-100">
                    <td className="py-2 pr-4 text-slate-500">{new Date(tx.created_at).toLocaleString(i18n.language)}</td>
                    <td className="py-2 pr-4 text-slate-700">{t(`aiCredits.types.${tx.transaction_type}`)}</td>
                    <td className="py-2 pr-4 text-slate-500">{tx.service ? t(`aiCredits.services.${tx.service}`) : '—'}</td>
                    <td className={`py-2 pr-4 text-right font-semibold ${amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {amount < 0 ? '' : '+'}{money.format(amount / 100)}
                    </td>
                    <td className="py-2 text-right text-slate-500">{money.format(Number(tx.balance_after_cents) / 100)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AiCredits() {
  const { t } = useTranslation()
  const [balance, setBalance] = useState<Balance | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const checkoutResult = searchParams.get('checkout')

  const loadBalance = useCallback(() => {
    api.get('/ai-credits/balance').then(setBalance).catch(() => setBalance(null))
  }, [])

  useEffect(() => { loadBalance() }, [loadBalance])

  function dismissBanner() {
    searchParams.delete('checkout')
    setSearchParams(searchParams, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('aiCredits.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('aiCredits.subtitle')}</p>
        </div>
      </div>

      {checkoutResult === 'success' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-800 flex-1">{t('aiCredits.checkoutSuccess')}</p>
          <button type="button" onClick={dismissBanner} className="text-xs text-emerald-700 underline">{t('recharge.dismiss')}</button>
        </div>
      )}
      {checkoutResult === 'cancelled' && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <XCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <p className="text-sm text-slate-600 flex-1">{t('aiCredits.checkoutCancelled')}</p>
          <button type="button" onClick={dismissBanner} className="text-xs text-slate-500 underline">{t('recharge.dismiss')}</button>
        </div>
      )}

      {balance ? (
        <BalanceCard balance={balance} onChanged={loadBalance} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex items-center justify-center text-slate-400 gap-2">
          <Zap className="w-4 h-4" />
          {t('common.loading')}
        </div>
      )}

      <TransactionsTable />
    </div>
  )
}
