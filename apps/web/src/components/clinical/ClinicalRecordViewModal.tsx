import { useTranslation } from 'react-i18next'
import { X, Pencil } from 'lucide-react'

interface Props {
  record: any
  onEdit: () => void
  onClose: () => void
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase">{label}</p>
      <p className={`mt-0.5 text-sm whitespace-pre-wrap ${highlight ? 'text-amber-700 bg-amber-50 rounded px-2 py-1' : 'text-slate-700'}`}>{value}</p>
    </div>
  )
}

export function ClinicalRecordViewModal({ record: r, onEdit, onClose }: Props) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
              {r.date ? new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
            </span>
            {r.reason_for_visit && <p className="mt-1.5 font-semibold text-slate-800">{r.reason_for_visit}</p>}
            {r.doctor?.name && <p className="text-xs text-slate-400 mt-0.5">{t('patientDetail.doctor_prefix', { name: r.doctor.name })}</p>}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={onEdit} className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-teal-50"><Pencil className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="px-6 py-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {r.anamnesis && <Field label={t('patientDetail.fields.anamnesis')} value={r.anamnesis} />}
          {r.allergies && <Field label={t('patientDetail.fields.allergies')} value={r.allergies} highlight />}
          {r.current_medications && <Field label={t('patientDetail.fields.current_medications')} value={r.current_medications} />}
          {r.physical_exam && <Field label={t('patientDetail.fields.physical_exam')} value={r.physical_exam} />}
          {r.diagnosis && <Field label={t('patientDetail.fields.diagnosis')} value={r.diagnosis} />}
          {r.treatment_plan && <Field label={t('patientDetail.fields.treatment_plan')} value={r.treatment_plan} />}
          {r.notes && <Field label={t('patientDetail.fields.notes')} value={r.notes} />}
        </div>
      </div>
    </div>
  )
}
