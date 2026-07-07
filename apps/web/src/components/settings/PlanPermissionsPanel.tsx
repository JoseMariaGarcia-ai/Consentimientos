import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layers, Check, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { ALL_MODULES } from '@/lib/modules'

const PLANS = ['base', 'pro', 'ia', 'ia-plus'] as const
const PLAN_KEY: Record<string, string> = { base: 'base', pro: 'pro', ia: 'ia', 'ia-plus': 'ia_plus' }

type Matrix = Record<string, Record<string, boolean>>

export function PlanPermissionsPanel() {
  const { t } = useTranslation()
  const [matrix, setMatrix] = useState<Matrix>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    setLoading(true)
    api.get('/plan-permissions')
      .then((data: any) => setMatrix(data ?? {}))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const toggle = (plan: string, module: string) => {
    setMatrix(m => ({ ...m, [plan]: { ...m[plan], [module]: !m[plan]?.[module] } }))
  }

  const handleSave = async () => {
    setSaving(true); setError(''); setSaved(false)
    try {
      await Promise.all(
        PLANS.map(plan => api.put(`/plan-permissions/${plan}`, { permissions: matrix[plan] ?? {} }))
      )
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const modules = ALL_MODULES.filter(mod => mod.key !== 'settings')

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <Layers className="w-4 h-4 text-indigo-500" />
        <h3 className="text-sm font-bold text-slate-700">{t('planPermissions.title')}</h3>
      </div>
      <p className="text-xs text-slate-400 -mt-3">{t('planPermissions.subtitle')}</p>

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">{t('common.loading')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('planPermissions.section')}</th>
                {PLANS.map(plan => (
                  <th key={plan} className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {t(`recharge.plans.${PLAN_KEY[plan]}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map(mod => (
                <tr key={mod.key}>
                  <td className="py-2.5 pr-4 text-slate-700">{t(mod.labelKey)}</td>
                  {PLANS.map(plan => (
                    <td key={plan} className="text-center py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={!!matrix[plan]?.[mod.key]}
                        onChange={() => toggle(plan, mod.key)}
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && <p className="text-xs text-red-500">⚠️ {error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving
            ? <><Loader2 className="w-4 h-4 animate-spin" />{t('planPermissions.saving')}</>
            : saved
            ? <><Check className="w-4 h-4" />{t('planPermissions.saved')}</>
            : t('planPermissions.save')}
        </button>
      </div>
    </div>
  )
}
