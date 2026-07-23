import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { DatabaseBackup, Play, RotateCcw } from 'lucide-react'
import { api } from '@/lib/api'
import { RestoreWizardModal } from './RestoreWizardModal'

interface BackupJob {
  id: string
  kind: 'backup_full' | 'backup_clinic' | 'restore' | 'pre_restore'
  clinic_id: string | null
  status: 'running' | 'success' | 'failed'
  file_key: string | null
  file_size_bytes: number | null
  started_at: string
}

interface Clinic { id: string; name: string; trade_name?: string | null }

function fmtBytes(bytes: number | null): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const STATUS_BADGE: Record<BackupJob['status'], string> = {
  success: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-amber-100 text-amber-700',
}

export function BackupsPanel() {
  const { t, i18n } = useTranslation()
  const [jobs, setJobs] = useState<BackupJob[]>([])
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterClinicId, setFilterClinicId] = useState('')
  const [running, setRunning] = useState(false)
  const [restoreTarget, setRestoreTarget] = useState<BackupJob | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    const qs = filterClinicId ? `?clinicId=${filterClinicId}` : ''
    api.get(`/admin/backup/list${qs}`)
      .then((data: any) => setJobs(Array.isArray(data?.jobs) ? data.jobs : []))
      .catch(e => setError(e.message ?? t('backups.loadError')))
      .finally(() => setLoading(false))
  }, [filterClinicId, t])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/clinic-config/clinics').then((data: any) => setClinics(Array.isArray(data) ? data : [])).catch(() => {})
  }, [])

  const runNow = async () => {
    setRunning(true)
    setError('')
    try {
      await api.post('/admin/backup/run', { type: 'full' })
      setTimeout(load, 1000)
    } catch (e: any) {
      setError(e.message ?? t('backups.runError'))
    } finally {
      setRunning(false)
    }
  }

  const clinicName = (id: string | null) => {
    if (!id) return '—'
    const c = clinics.find(c => c.id === id)
    return c ? (c.trade_name || c.name) : id
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500 max-w-xl">{t('backups.subtitle')}</p>
        <button
          onClick={runNow}
          disabled={running}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
        >
          <Play className="w-4 h-4" /> {running ? t('backups.running') : t('backups.runNow')}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={filterClinicId}
          onChange={e => setFilterClinicId(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <option value="">{t('backups.filterAll')}</option>
          {clinics.map(c => <option key={c.id} value={c.id}>{c.trade_name || c.name}</option>)}
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <DatabaseBackup className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700">{t('settings.tabs.backups')}</h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">{t('backups.empty')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide border-b border-slate-100">
                  <th className="px-5 py-3">{t('backups.table.date')}</th>
                  <th className="px-5 py-3">{t('backups.table.type')}</th>
                  <th className="px-5 py-3">{t('backups.table.size')}</th>
                  <th className="px-5 py-3">{t('backups.table.status')}</th>
                  <th className="px-5 py-3 text-right">{t('backups.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(j => (
                  <tr key={j.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-600">{new Date(j.started_at).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {t(`backups.type.${j.kind}`)}
                      {j.kind === 'backup_clinic' && <span className="text-slate-400"> · {clinicName(j.clinic_id)}</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-500">{fmtBytes(j.file_size_bytes)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[j.status]}`}>
                        {t(`backups.status.${j.status}`)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {j.status === 'success' && j.file_key && (
                        <button
                          onClick={() => setRestoreTarget(j)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> {t('backups.restore')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {restoreTarget && (
        <RestoreWizardModal
          backupJob={restoreTarget}
          clinics={clinics}
          onClose={() => setRestoreTarget(null)}
          onDone={load}
        />
      )}
    </div>
  )
}
