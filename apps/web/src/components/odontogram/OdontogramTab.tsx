import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, History, Save, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { Doctor, OdontogramRecord, OdontogramTooth } from '@consentspro/shared-types'
import { OdontogramChart } from './OdontogramChart'
import { ToothDetailPanel } from './ToothDetailPanel'
import { OdontogramHistory } from './OdontogramHistory'
import { OdontogramPdfButton } from './OdontogramPdfButton'

interface Props {
  patientId: string
  patient: any
  clinic: any
  doctors: Doctor[]
}

function defaultDentitionForAge(dateOfBirth?: string): 'permanente' | 'temporal' | 'mixta' {
  if (!dateOfBirth) return 'permanente'
  const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
  if (age < 6) return 'temporal'
  if (age < 13) return 'mixta'
  return 'permanente'
}

export function OdontogramTab({ patientId, patient, clinic, doctors }: Props) {
  const { t } = useTranslation()
  const [records, setRecords] = useState<OdontogramRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [draftTeeth, setDraftTeeth] = useState<OdontogramTooth[]>([])
  const [draftDentitionType, setDraftDentitionType] = useState<'permanente' | 'temporal' | 'mixta'>('permanente')
  const [draftDoctorId, setDraftDoctorId] = useState('')
  const [draftDate, setDraftDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [draftNotes, setDraftNotes] = useState('')

  const [selectedTooth, setSelectedTooth] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/odontogram?patient_id=${patientId}`)
      setRecords(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [patientId])

  const latest = records[0] ?? null

  const startNewVisit = () => {
    const dentitionType = defaultDentitionForAge(patient?.dateOfBirth ?? patient?.date_of_birth)
    setDraftDentitionType(latest?.dentition_type ?? dentitionType)
    setDraftTeeth(latest ? latest.teeth.map(tth => ({ ...tth, faces: { ...tth.faces } })) : [])
    setDraftDoctorId(doctors[0]?.id ?? '')
    setDraftDate(new Date().toISOString().slice(0, 10))
    setDraftNotes('')
    setError('')
    setEditing(true)
  }

  const draftToothMap = useMemo(() => new Map(draftTeeth.map(tth => [tth.number, tth])), [draftTeeth])

  const handleToothSave = (tooth: OdontogramTooth) => {
    setDraftTeeth(prev => {
      const next = prev.filter(t => t.number !== tooth.number)
      next.push(tooth)
      return next
    })
  }

  const handleSaveVisit = async () => {
    if (!draftDoctorId) { setError(t('odontogram.errors.doctorRequired')); return }
    setSaving(true)
    setError('')
    try {
      const created = await api.post('/odontogram', {
        patient_id: patientId,
        doctor_id: draftDoctorId,
        record_date: new Date(draftDate).toISOString(),
        dentition_type: draftDentitionType,
        teeth: draftTeeth,
        notes: draftNotes || null,
      })
      setRecords(prev => [created, ...prev])
      setEditing(false)
    } catch (err: any) {
      setError(err.message ?? t('odontogram.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">{t('common.loading')}</div>

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          {!editing && latest && (
            <p className="text-sm text-slate-500">
              {t('odontogram.lastVisit')}: <span className="font-semibold text-slate-700">{new Date(latest.record_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              {latest.doctor?.name && <span> · {latest.doctor.name}</span>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!editing && latest && (
            <OdontogramPdfButton clinic={clinic} patient={patient} record={latest} />
          )}
          {!editing && records.length > 0 && (
            <button onClick={() => setHistoryOpen(true)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">
              <History className="w-3.5 h-3.5" />{t('odontogram.viewHistory')}
            </button>
          )}
          {!editing && (
            <button onClick={startNewVisit} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm">
              <Plus className="w-4 h-4" />{t('odontogram.newVisit')}
            </button>
          )}
          {editing && (
            <>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                <X className="w-4 h-4" />{t('common.cancel')}
              </button>
              <button onClick={handleSaveVisit} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50">
                <Save className="w-4 h-4" />{saving ? t('common.saving') : t('odontogram.saveVisit')}
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('odontogram.visitDate')}</label>
            <input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('odontogram.doctor')}</label>
            <select value={draftDoctorId} onChange={e => setDraftDoctorId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
              <option value="">{t('odontogram.selectDoctor')}</option>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('odontogram.visitNotes')}</label>
            <input value={draftNotes} onChange={e => setDraftNotes(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-full" />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {editing ? (
        <OdontogramChart
          teeth={draftTeeth}
          dentitionType={draftDentitionType}
          onDentitionTypeChange={setDraftDentitionType}
          onToothClick={setSelectedTooth}
        />
      ) : latest ? (
        <OdontogramChart teeth={latest.teeth} dentitionType={latest.dentition_type} readOnly />
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          {t('odontogram.noRecords')}
        </div>
      )}

      {selectedTooth && editing && (
        <ToothDetailPanel
          toothNumber={selectedTooth}
          tooth={draftToothMap.get(selectedTooth)}
          history={records}
          onSave={handleToothSave}
          onClose={() => setSelectedTooth(null)}
        />
      )}
      {selectedTooth && !editing && latest && (
        <ToothDetailPanel
          toothNumber={selectedTooth}
          tooth={latest.teeth.find(tth => tth.number === selectedTooth)}
          history={records}
          currentRecordId={latest.id}
          onClose={() => setSelectedTooth(null)}
          readOnly
        />
      )}

      {historyOpen && (
        <OdontogramHistory records={records} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  )
}
