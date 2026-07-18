import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, X } from 'lucide-react'

const FORGOTTEN_TYPES = ['olvido_entrada', 'olvido_salida']
const ABSENCE_TYPES = ['ausencia_justificada', 'ausencia_injustificada']
const INCIDENT_TYPES = [...FORGOTTEN_TYPES, ...ABSENCE_TYPES, 'otro']

interface Props {
  employees?: any[]
  isManager: boolean
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

export function TimeIncidentModal({ employees = [], isManager, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const [employeeId, setEmployeeId] = useState('')
  const [incidentType, setIncidentType] = useState('olvido_salida')
  const [proposedTimestamp, setProposedTimestamp] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isForgotten = FORGOTTEN_TYPES.includes(incidentType)
  const isAbsence = ABSENCE_TYPES.includes(incidentType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (isManager && !employeeId) { setError(t('timeIncidentModal.errors.employeeRequired')); return }
    if (!reason.trim()) { setError(t('timeIncidentModal.errors.reasonRequired')); return }
    if (isForgotten && !proposedTimestamp) { setError(t('timeIncidentModal.errors.timestampRequired')); return }
    if (isAbsence && !dateFrom) { setError(t('timeIncidentModal.errors.dateRequired')); return }

    setSaving(true)
    try {
      await onSave({
        ...(isManager ? { employee_id: employeeId } : {}),
        incident_type: incidentType,
        reason: reason.trim(),
        ...(isForgotten ? { proposed_timestamp: new Date(proposedTimestamp).toISOString() } : {}),
        ...(isAbsence ? { date_from: dateFrom, date_to: dateTo || dateFrom } : {}),
      })
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('timeIncidentModal.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-800">{t('timeIncidentModal.title')}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {isManager && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('timeIncidentModal.form.employee')}</label>
              <select value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                <option value="">{t('timeIncidentModal.form.selectEmployee')}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('timeIncidentModal.form.type')}</label>
            <select value={incidentType} onChange={e => setIncidentType(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              {INCIDENT_TYPES.map(type => (
                <option key={type} value={type}>{t(`timeTracking.incidentType.${type}`)}</option>
              ))}
            </select>
          </div>

          {isForgotten && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('timeIncidentModal.form.proposedTimestamp')}</label>
              <input
                type="datetime-local"
                value={proposedTimestamp}
                onChange={e => setProposedTimestamp(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <p className="text-[11px] text-slate-400">{t('timeIncidentModal.form.proposedTimestampHint')}</p>
            </div>
          )}

          {isAbsence && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('timeIncidentModal.form.dateFrom')}</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('timeIncidentModal.form.dateTo')}</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                <p className="text-[11px] text-slate-400">{t('timeIncidentModal.form.dateToHint')}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('timeIncidentModal.form.reason')}</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('timeIncidentModal.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
