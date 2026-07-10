import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Users, Plus, Copy, Check, ShieldAlert, FileDown, Loader2, Pencil,
  ToggleLeft, ToggleRight, Link as LinkIcon,
} from 'lucide-react'
import { api } from '@/lib/api'
import { EmployeeModal } from './EmployeeModal'
import { timeTrackingPdfBlob } from '@/lib/pdf/timeTrackingPdf'
import { downloadTimeTrackingCsv } from '@/lib/timeTrackingCsv'

const METHODS = ['web', 'qr', 'pin'] as const
const STATUS_BADGE: Record<string, string> = {
  dentro: 'bg-emerald-100 text-emerald-700',
  fuera: 'bg-slate-100 text-slate-600',
  en_pausa: 'bg-amber-100 text-amber-700',
}
const APP_URL = import.meta.env.VITE_APP_URL ?? window.location.origin

function toDateStr(d: Date) { return d.toISOString().slice(0, 10) }

export function TimeTrackingAdminPanel() {
  const { t, i18n } = useTranslation()
  const [employees, setEmployees] = useState<any[]>([])
  const [appUsers, setAppUsers] = useState<any[]>([])
  const [clinic, setClinic] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean; initial?: any }>({ open: false })
  const [methods, setMethods] = useState<string[]>(['web'])
  const [savingMethods, setSavingMethods] = useState(false)
  const [copied, setCopied] = useState(false)
  const [integrityIssues, setIntegrityIssues] = useState<number | null>(null)

  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [dateFrom, setDateFrom] = useState(toDateStr(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [dateTo, setDateTo] = useState('')
  const [days, setDays] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)
  const [compType, setCompType] = useState<'economica' | 'descanso'>('economica')
  const [compNotes, setCompNotes] = useState('')
  const [compSaving, setCompSaving] = useState(false)
  const [compSaved, setCompSaved] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [emps, users, c, settings] = await Promise.all([
        api.get('/timetracking/employees').catch(() => []),
        api.get('/users').catch(() => []),
        api.get('/clinic').catch(() => ({})),
        api.get('/timetracking/settings').catch(() => ({ methods: ['web'] })),
      ])
      setEmployees(Array.isArray(emps) ? emps : [])
      setAppUsers(Array.isArray(users) ? users.filter((u: any) => u.role === 'clinica' || u.role === 'admin') : [])
      setClinic(c)
      setMethods(settings?.methods ?? ['web'])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    api.get('/timetracking/integrity/check').then((r: any) => setIntegrityIssues(Array.isArray(r?.issues) ? r.issues.length : 0)).catch(() => {})
  }, [])

  const loadHours = useCallback(async () => {
    if (!selectedEmployee) { setDays([]); return }
    const params = new URLSearchParams({ employee_id: selectedEmployee })
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    const data = await api.get(`/timetracking/hours?${params.toString()}`).catch(() => [])
    setDays(Array.isArray(data) ? data : [])
  }, [selectedEmployee, dateFrom, dateTo])

  useEffect(() => { loadHours() }, [loadHours])

  const handleSaveEmployee = async (data: any) => {
    if (modal.initial?.id) await api.put(`/timetracking/employees/${modal.initial.id}`, data)
    else await api.post('/timetracking/employees', data)
    await load()
  }

  const toggleActive = async (emp: any) => {
    await api.put(`/timetracking/employees/${emp.id}`, { active: !emp.active })
    await load()
  }

  const toggleMethod = (m: string) => {
    setMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }
  const saveMethods = async () => {
    setSavingMethods(true)
    try {
      const clean = methods.length ? methods : ['web']
      const res: any = await api.put('/timetracking/settings', { methods: clean })
      setMethods(res.methods)
    } finally {
      setSavingMethods(false)
    }
  }

  const kioskLink = clinic?.id ? `${APP_URL}/fichar?clinic=${clinic.id}` : ''
  const copyKioskLink = () => {
    navigator.clipboard.writeText(kioskLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const totalPeriodHours = days.reduce((s, d) => s + d.hours, 0)
  const totalOvertimeHours = days.reduce((s, d) => s + d.overtimeHours, 0)

  const fetchExportData = async () => {
    const params = new URLSearchParams({ employee_id: selectedEmployee })
    if (dateFrom) params.set('date_from', dateFrom)
    if (dateTo) params.set('date_to', dateTo)
    return api.get(`/timetracking/export?${params.toString()}`)
  }

  const handleExportPdf = async () => {
    if (!selectedEmployee) return
    setExporting(true)
    try {
      const data = await fetchExportData()
      const blob = await timeTrackingPdfBlob(data, i18n.language)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fichajes_${data.employee?.full_name ?? 'informe'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) { setError(e.message) }
    finally { setExporting(false) }
  }

  const handleExportCsv = async () => {
    if (!selectedEmployee) return
    setExporting(true)
    try {
      const data = await fetchExportData()
      downloadTimeTrackingCsv(data)
    } catch (e: any) { setError(e.message) }
    finally { setExporting(false) }
  }

  const saveCompensation = async () => {
    if (!selectedEmployee || !dateFrom) return
    setCompSaving(true)
    try {
      await api.post('/timetracking/overtime', {
        employee_id: selectedEmployee,
        period_start: dateFrom,
        period_end: dateTo || dateFrom,
        compensation_type: compType,
        notes: compNotes || null,
      })
      setCompNotes('')
      setCompSaved(true)
      setTimeout(() => setCompSaved(false), 2500)
    } catch (e: any) { setError(e.message) }
    finally { setCompSaving(false) }
  }

  return (
    <div className="flex flex-col gap-5">
      {integrityIssues !== null && integrityIssues > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800 flex-1">{t('timeTracking.integrityAlarm', { count: integrityIssues })}</p>
        </div>
      )}

      {/* Métodos de fichaje */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <p className="text-sm font-bold text-slate-700">{t('timeTracking.methodsTitle')}</p>
        <div className="flex flex-wrap gap-3">
          {METHODS.map(m => (
            <label key={m} className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={methods.includes(m)} onChange={() => toggleMethod(m)} className="w-4 h-4 accent-blue-600" />
              {t(`timeTracking.method.${m}`)}
            </label>
          ))}
          <button onClick={saveMethods} disabled={savingMethods} className="ml-auto px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {savingMethods ? t('common.saving') : t('common.save')}
          </button>
        </div>
        {methods.includes('pin') && clinic?.id && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <LinkIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-xs text-slate-500 font-mono truncate flex-1">{kioskLink}</span>
            <button onClick={copyKioskLink} className="p-1 text-slate-400 hover:text-blue-600 flex-shrink-0">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
        <p className="text-[11px] text-slate-400">{t('timeTracking.methodsHint')}</p>
      </div>

      {/* Empleados */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700">{t('timeTracking.employeesTitle')}</h3>
          </div>
          <button onClick={() => setModal({ open: true })} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" />{t('timeTracking.addEmployee')}
          </button>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">{t('common.loading')}</div>
        ) : employees.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">{t('timeTracking.noEmployees')}</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {employees.map(emp => (
              <div key={emp.id} className={`flex items-center gap-3 px-5 py-3 ${!emp.active ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{emp.full_name}</p>
                  <p className="text-xs text-slate-400">{emp.dni_nie}{emp.role ? ` · ${emp.role}` : ''}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[emp.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {t(`timeTracking.status.${emp.status}`)}
                </span>
                <button onClick={() => toggleActive(emp)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                  {emp.active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <button onClick={() => setModal({ open: true, initial: emp })} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Horas y exportación */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
        <p className="text-sm font-bold text-slate-700">{t('timeTracking.hoursTitle')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('timeTracking.employee')}</label>
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="">{t('timeTracking.selectEmployee')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.from')}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('invoicing.to')}</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <button onClick={handleExportPdf} disabled={!selectedEmployee || exporting} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 disabled:opacity-40">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}PDF
          </button>
          <button onClick={handleExportCsv} disabled={!selectedEmployee || exporting} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 disabled:opacity-40">
            <FileDown className="w-3.5 h-3.5" />CSV
          </button>
        </div>

        {selectedEmployee && (
          <>
            {days.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t('timeTracking.noHours')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 uppercase tracking-wide border-b border-slate-100">
                      <th className="py-2 pr-4">{t('timeTracking.date')}</th>
                      <th className="py-2 pr-4 text-right">{t('timeTracking.hours')}</th>
                      <th className="py-2 pr-4 text-right">{t('timeTracking.overtime')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {days.map(d => (
                      <tr key={d.date}>
                        <td className="py-2 pr-4 text-slate-700">{new Date(d.date).toLocaleDateString(i18n.language)}</td>
                        <td className="py-2 pr-4 text-right text-slate-700">{d.hours.toFixed(2)}</td>
                        <td className={`py-2 pr-4 text-right font-medium ${d.overtimeHours > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
                          {d.overtimeHours > 0 ? d.overtimeHours.toFixed(2) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
              <span className="text-xs font-semibold text-white uppercase tracking-wide">{t('timeTracking.periodTotal')}</span>
              <span className="text-base font-bold text-amber-400">
                {totalPeriodHours.toFixed(2)} h {totalOvertimeHours > 0 && `(+${totalOvertimeHours.toFixed(2)} h ${t('timeTracking.overtimeShort')})`}
              </span>
            </div>

            {totalOvertimeHours > 0 && (
              <div className="flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('timeTracking.compensationType')}</label>
                  <select value={compType} onChange={e => setCompType(e.target.value as any)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    <option value="economica">{t('timeTracking.compensationEconomic')}</option>
                    <option value="descanso">{t('timeTracking.compensationRest')}</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('timeTracking.compensationNotes')}</label>
                  <input value={compNotes} onChange={e => setCompNotes(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full" />
                </div>
                <button onClick={saveCompensation} disabled={compSaving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                  {compSaving ? t('common.saving') : compSaved ? t('timeTracking.compensationSaved') : t('timeTracking.compensationSave')}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {modal.open && (
        <EmployeeModal
          initial={modal.initial}
          appUsers={appUsers}
          onSave={handleSaveEmployee}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
