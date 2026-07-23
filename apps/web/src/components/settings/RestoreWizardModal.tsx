import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, AlertTriangle, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'

interface BackupJob {
  id: string
  kind: 'backup_full' | 'backup_clinic' | 'restore' | 'pre_restore'
  clinic_id: string | null
  status: 'running' | 'success' | 'failed'
  file_key: string | null
}

interface RestoreJob {
  id: string
  status: 'running' | 'success' | 'failed'
  progress: number
  log: { ts: string; message: string }[]
  error_message: string | null
}

interface Clinic { id: string; name: string; trade_name?: string | null }

interface Props {
  backupJob: BackupJob
  clinics: Clinic[]
  onClose: () => void
  onDone: () => void
}

type Step = 1 | 2 | 3 | 4

const POLL_MS = 1500

export function RestoreWizardModal({ backupJob, clinics, onClose, onDone }: Props) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>(1)
  const [clinicId, setClinicId] = useState<string>(backupJob.clinic_id ?? '')
  const [confirmText, setConfirmText] = useState('')
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [restoreJob, setRestoreJob] = useState<RestoreJob | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isClinicRestore = backupJob.kind === 'backup_clinic'
  const clinicName = clinics.find(c => c.id === clinicId)?.trade_name || clinics.find(c => c.id === clinicId)?.name || clinicId

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  const startPolling = (jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const job = await api.get(`/admin/backup/status/${jobId}`)
        setRestoreJob(job)
        if (job.status !== 'running' && pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
          onDone()
        }
      } catch { /* keep polling — transient network error */ }
    }, POLL_MS)
  }

  const handleStartRestore = async () => {
    setStarting(true)
    setStartError('')
    try {
      const res = await api.post('/admin/backup/restore', {
        backup_file: backupJob.file_key,
        restore_type: isClinicRestore ? 'clinic' : 'full',
        clinic_id: isClinicRestore ? clinicId : undefined,
        confirmacion: confirmText,
      })
      setStep(4)
      setRestoreJob({ id: res.jobId, status: 'running', progress: 0, log: [], error_message: null })
      startPolling(res.jobId)
    } catch (e: any) {
      setStartError(e.message ?? t('common.error'))
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">{t('backups.wizard.title')}</h3>
          {step !== 4 && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 flex flex-col gap-5">
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-slate-600">{t('backups.wizard.step1.title')}</p>
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{t('backups.wizard.step1.warning')}</p>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
                  {t('backups.wizard.step1.cancel')}
                </button>
                <button onClick={() => setStep(2)} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-colors">
                  {t('backups.wizard.step1.continue')}
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm font-semibold text-slate-600">{t('backups.wizard.step2.title')}</p>
              {isClinicRestore ? (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('backups.wizard.step2.selectClinicLabel')}</label>
                  <select
                    value={clinicId}
                    onChange={e => setClinicId(e.target.value)}
                    className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.trade_name || c.name}</option>)}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4">{t('backups.wizard.step2.full')}</p>
              )}
              <div className="flex justify-between gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
                  {t('backups.wizard.back')}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={isClinicRestore && !clinicId}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {t('backups.wizard.step1.continue')}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm font-semibold text-slate-600">{t('backups.wizard.step3.title')}</p>
              <p className="text-sm text-slate-500">{t('backups.wizard.step3.instructions')}</p>
              {isClinicRestore && <p className="text-xs text-slate-400">{clinicName}</p>}
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder={t('backups.wizard.step3.placeholder') as string}
                className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
              {startError && <p className="text-sm text-red-500">{startError}</p>}
              <div className="flex justify-between gap-2">
                <button onClick={() => setStep(2)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700">
                  {t('backups.wizard.back')}
                </button>
                <button
                  onClick={handleStartRestore}
                  disabled={confirmText !== 'CONFIRMAR' || starting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
                >
                  {starting ? t('backups.running') : t('backups.wizard.startRestore')}
                </button>
              </div>
            </>
          )}

          {step === 4 && restoreJob && (
            <>
              <p className="text-sm font-semibold text-slate-600">{t('backups.wizard.step4.title')}</p>

              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${restoreJob.status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${restoreJob.progress}%` }}
                />
              </div>

              <div className="bg-slate-900 text-slate-200 rounded-xl p-3 text-xs font-mono max-h-48 overflow-y-auto flex flex-col gap-1">
                {restoreJob.log.map((l, i) => <p key={i}>{l.message}</p>)}
                {restoreJob.status === 'running' && (
                  <p className="flex items-center gap-1.5 text-slate-400"><Loader2 className="w-3 h-3 animate-spin" />{t('backups.wizard.step4.inProgress')}</p>
                )}
              </div>

              {restoreJob.status === 'success' && (
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm font-medium">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  {t('backups.wizard.successMessage')}
                </div>
              )}

              {restoreJob.status === 'failed' && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 text-sm font-medium">
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{t('backups.wizard.errorMessage')}: {restoreJob.error_message}</p>
                      <p className="text-xs font-normal text-red-500 mt-1">{t('backups.wizard.rollbackNotice')}</p>
                    </div>
                  </div>
                </div>
              )}

              {restoreJob.status !== 'running' && (
                <div className="flex justify-end">
                  <button onClick={onClose} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition-colors">
                    {t('backups.wizard.close')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
