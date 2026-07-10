import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, X } from 'lucide-react'

interface Props {
  initial?: { id: string; full_name: string; dni_nie: string; role: string | null; email: string | null; active: boolean } | null
  appUsers: any[]
  onSave: (data: any) => Promise<void>
  onClose: () => void
}

export function EmployeeModal({ initial, appUsers, onSave, onClose }: Props) {
  const { t } = useTranslation()
  const isEdit = !!initial
  const [fullName, setFullName] = useState(initial?.full_name ?? '')
  const [dniNie, setDniNie] = useState(initial?.dni_nie ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [appUserId, setAppUserId] = useState('')
  const [pin, setPin] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    if (!fullName.trim()) { setError(t('employeeModal.errors.fullName')); return }
    if (!isEdit && !dniNie.trim()) { setError(t('employeeModal.errors.dniNie')); return }
    if (pin && !/^\d{4,6}$/.test(pin)) { setError(t('employeeModal.errors.pinFormat')); return }
    setSaving(true)
    try {
      const payload: any = { full_name: fullName.trim(), role: role.trim() || null, email: email.trim() || null }
      if (!isEdit) { payload.dni_nie = dniNie.trim(); payload.app_user_id = appUserId || null }
      if (pin) payload.pin = pin
      await onSave(payload)
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('employeeModal.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {isEdit ? t('employeeModal.titleEdit') : t('employeeModal.titleNew')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('employeeModal.form.fullName')}</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('employeeModal.form.dniNie')}</label>
              <input value={dniNie} onChange={e => setDniNie(e.target.value.toUpperCase())} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('employeeModal.form.role')}</label>
            <input value={role} onChange={e => setRole(e.target.value)} placeholder={t('employeeModal.form.rolePlaceholder')} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('employeeModal.form.email')}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('employeeModal.form.linkedUser')}</label>
              <select value={appUserId} onChange={e => setAppUserId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('employeeModal.form.noLinkedUser')}</option>
                {appUsers.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
              </select>
              <p className="text-[11px] text-slate-400">{t('employeeModal.form.linkedUserHint')}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('employeeModal.form.pin')}</label>
            <input
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={isEdit ? t('employeeModal.form.pinEditPlaceholder') : t('employeeModal.form.pinPlaceholder')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">{t('employeeModal.form.pinHint')}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
