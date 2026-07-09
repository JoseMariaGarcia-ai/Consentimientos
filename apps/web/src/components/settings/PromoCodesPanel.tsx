import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Ticket, Plus, Copy, Check, Trash2, Power } from 'lucide-react'
import { api } from '@/lib/api'
import { PLANS, PLAN_KEY } from '@/pages/Recharge'

interface PromoCode {
  id: string
  code: string
  plan_id: string
  trial_days: number
  campaign_name: string | null
  max_uses: number | null
  used_count: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

type Status = 'active' | 'inactive' | 'expired' | 'exhausted'

function statusOf(p: PromoCode): Status {
  if (!p.is_active) return 'inactive'
  if (p.expires_at && new Date(p.expires_at) < new Date()) return 'expired'
  if (p.max_uses != null && p.used_count >= p.max_uses) return 'exhausted'
  return 'active'
}

const STATUS_BADGE: Record<Status, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  expired: 'bg-red-100 text-red-700',
  exhausted: 'bg-amber-100 text-amber-700',
}

function fmtDate(iso: string | null, locale: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin

const emptyForm = {
  code: '',
  plan_id: 'pro',
  trial_days: 10,
  campaign_name: '',
  max_uses: '',
  expires_at: '',
}

export function PromoCodesPanel() {
  const { t, i18n } = useTranslation()
  const [codes, setCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError('')
    api.get('/promo-codes')
      .then((data: any) => setCodes(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message ?? t('common.error')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.code.trim()) { setFormError(t('promoCodes.form.codeRequired')); return }
    setSaving(true)
    setFormError('')
    try {
      await api.post('/promo-codes', {
        code: form.code.trim(),
        plan_id: form.plan_id,
        trial_days: Number(form.trial_days) || 10,
        campaign_name: form.campaign_name.trim() || null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        expires_at: form.expires_at || null,
      })
      setForm(emptyForm)
      setFormOpen(false)
      load()
    } catch (e: any) {
      setFormError(e.message ?? t('promoCodes.form.error'))
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(p: PromoCode) {
    try {
      await api.put(`/promo-codes/${p.id}`, {
        plan_id: p.plan_id,
        trial_days: p.trial_days,
        campaign_name: p.campaign_name,
        max_uses: p.max_uses,
        expires_at: p.expires_at,
        is_active: !p.is_active,
      })
      load()
    } catch (e: any) {
      setError(e.message ?? t('common.error'))
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t('promoCodes.deleteConfirm'))) return
    try {
      await api.delete(`/promo-codes/${id}`)
      load()
    } catch (e: any) {
      setError(e.message ?? t('common.error'))
    }
  }

  function copyLink(p: PromoCode) {
    const link = `${APP_URL}/?promo=${encodeURIComponent(p.code)}#pricing`
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(p.id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  function planName(planId: string) {
    const key = PLAN_KEY[planId]
    return key ? t(`recharge.plans.${key}.name`) : planId
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500 max-w-xl">{t('promoCodes.subtitle')}</p>
        <button
          onClick={() => { setForm(emptyForm); setFormError(''); setFormOpen(v => !v) }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('promoCodes.newCode')}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {formOpen && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('promoCodes.form.code')}</label>
              <input
                type="text"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="PRO10META"
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-400">{t('promoCodes.form.codeHint')}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('promoCodes.form.plan')}</label>
              <select
                value={form.plan_id}
                onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PLANS.map(p => <option key={p.id} value={p.id}>{planName(p.id)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('promoCodes.form.trialDays')}</label>
              <input
                type="number"
                min={1}
                value={form.trial_days}
                onChange={e => setForm(f => ({ ...f, trial_days: Number(e.target.value) }))}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('promoCodes.form.campaign')}</label>
              <input
                type="text"
                value={form.campaign_name}
                onChange={e => setForm(f => ({ ...f, campaign_name: e.target.value }))}
                placeholder={t('promoCodes.form.campaignHint') as string}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('promoCodes.form.maxUses')}</label>
              <input
                type="number"
                min={1}
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                placeholder={t('promoCodes.unlimited') as string}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('promoCodes.form.expiresAt')}</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">{t('promoCodes.form.onceHint')}</p>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving ? t('common.saving') : t('promoCodes.form.save')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Ticket className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">{t('settings.tabs.promoCodes')}</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : codes.length === 0 ? (
          <div className="p-12 text-center text-slate-400">{t('promoCodes.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3">{t('promoCodes.table.code')}</th>
                  <th className="px-5 py-3">{t('promoCodes.table.plan')}</th>
                  <th className="px-5 py-3">{t('promoCodes.table.trialDays')}</th>
                  <th className="px-5 py-3">{t('promoCodes.table.campaign')}</th>
                  <th className="px-5 py-3">{t('promoCodes.table.uses')}</th>
                  <th className="px-5 py-3">{t('promoCodes.table.status')}</th>
                  <th className="px-5 py-3">{t('promoCodes.table.expires')}</th>
                  <th className="px-5 py-3 text-right">{t('promoCodes.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {codes.map(p => {
                  const status = statusOf(p)
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono font-semibold text-slate-700">{p.code}</td>
                      <td className="px-5 py-3 text-slate-600">{planName(p.plan_id)}</td>
                      <td className="px-5 py-3 text-slate-500">{p.trial_days}</td>
                      <td className="px-5 py-3 text-slate-500">{p.campaign_name ?? '—'}</td>
                      <td className="px-5 py-3 text-slate-500">{p.used_count} / {p.max_uses ?? t('promoCodes.unlimited')}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>
                          {t(`promoCodes.status.${status}`)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{fmtDate(p.expires_at, i18n.language)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => copyLink(p)}
                            title={t('promoCodes.copyLink') as string}
                            className="p-1.5 text-slate-400 hover:text-blue-600"
                          >
                            {copiedId === p.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => toggleActive(p)}
                            title={(p.is_active ? t('promoCodes.deactivate') : t('promoCodes.activate')) as string}
                            className={`p-1.5 ${p.is_active ? 'text-emerald-500 hover:text-slate-500' : 'text-slate-300 hover:text-emerald-600'}`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            title={t('common.delete') as string}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
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
