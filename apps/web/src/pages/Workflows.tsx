import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Workflow as WorkflowIcon } from 'lucide-react'
import { api } from '@/lib/api'

const KNOWN_WORKFLOWS = ['appointment_confirmation', 'appointment_reminder']

export default function Workflows() {
  const { t } = useTranslation()
  const [workflows, setWorkflows] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    api.get('/workflows')
      .then((data: any[]) => {
        const map = Object.fromEntries((data ?? []).map(w => [w.key, w.enabled]))
        setWorkflows(map)
      })
      .catch(() => setWorkflows({}))
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (key: string) => {
    const next = !workflows[key]
    setSaving(key)
    setWorkflows(prev => ({ ...prev, [key]: next }))
    try {
      await api.put(`/workflows/${key}`, { enabled: next })
    } catch {
      setWorkflows(prev => ({ ...prev, [key]: !next }))
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <WorkflowIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('workflows.title')}</h1>
          <p className="text-sm text-slate-500">{t('workflows.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
      ) : (
        <div className="flex flex-col gap-3">
          {KNOWN_WORKFLOWS.map(key => {
            const enabled = workflows[key] ?? true
            return (
              <div key={key} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-800">{t(`workflows.items.${key}.name`)}</p>
                  <p className="text-sm text-slate-500 mt-1">{t(`workflows.items.${key}.description`)}</p>
                </div>
                <button
                  onClick={() => toggle(key)}
                  disabled={saving === key}
                  role="switch"
                  aria-checked={enabled}
                  className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-50 ${
                    enabled ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
