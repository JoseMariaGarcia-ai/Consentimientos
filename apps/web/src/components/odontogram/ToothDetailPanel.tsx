import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { OdontogramRecord, OdontogramTooth, ToothStatus } from '@consentspro/shared-types'
import {
  FACE_NAMES, FACE_CONDITIONS, TOOTH_STATUSES, TOOTH_MATERIALS, toothName, emptyTooth,
} from './toothMeta'
import { ToothSvg } from './ToothSvg'

interface Props {
  toothNumber: string
  tooth: OdontogramTooth | undefined
  history: OdontogramRecord[] // todas las visitas del paciente, más recientes primero
  currentRecordId?: string
  onSave?: (tooth: OdontogramTooth) => void
  onClose: () => void
  readOnly?: boolean
}

export function ToothDetailPanel({ toothNumber, tooth, history, currentRecordId, onSave, onClose, readOnly }: Props) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<OdontogramTooth>(() => tooth ?? emptyTooth(toothNumber))

  const miniHistory = history
    .filter(r => r.id !== currentRecordId)
    .map(r => ({ record: r, tooth: r.teeth.find(x => x.number === toothNumber) }))
    .filter(x => x.tooth)

  const updateFace = (face: typeof FACE_NAMES[number], patch: Partial<OdontogramTooth['faces'][typeof face]>) => {
    setDraft(d => ({ ...d, faces: { ...d.faces, [face]: { ...d.faces[face], ...patch } } }))
  }

  const handleSave = () => {
    onSave?.(draft)
    onClose()
  }

  const showMaterialFor = (condition: string) => condition === 'obturada' || condition === 'sellante'
  const showGeneralMaterial = draft.status === 'corona' || draft.status === 'puente' || draft.status === 'implante'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <ToothSvg tooth={draft} size={40} />
            <div>
              <h2 className="text-base font-bold text-slate-800">{t('odontogram.tooth.number_label', { number: toothNumber })}</h2>
              <p className="text-xs text-slate-400">{toothName(toothNumber)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('odontogram.tooth.general_status')}</label>
            <select
              value={draft.status}
              disabled={readOnly}
              onChange={e => setDraft(d => ({ ...d, status: e.target.value as ToothStatus }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
            >
              {TOOTH_STATUSES.map(s => <option key={s} value={s}>{t(`odontogram.toothStatus.${s}`)}</option>)}
            </select>
          </div>

          {showGeneralMaterial && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('odontogram.tooth.material')}</label>
              <select
                value={draft.material ?? ''}
                disabled={readOnly}
                onChange={e => setDraft(d => ({ ...d, material: e.target.value || null }))}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
              >
                <option value="">—</option>
                {TOOTH_MATERIALS.map(m => <option key={m} value={m}>{t(`odontogram.material.${m}`)}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('odontogram.tooth.faces')}</label>
            {FACE_NAMES.map(face => (
              <div key={face} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-xs font-semibold text-slate-600 w-32 flex-shrink-0">{t(`odontogram.face.${face}`)}</span>
                <select
                  value={draft.faces[face]?.condition ?? 'sana'}
                  disabled={readOnly}
                  onChange={e => updateFace(face, { condition: e.target.value as any })}
                  className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-xs disabled:bg-white"
                >
                  {FACE_CONDITIONS.map(c => <option key={c} value={c}>{t(`odontogram.faceCondition.${c}`)}</option>)}
                </select>
                {showMaterialFor(draft.faces[face]?.condition ?? 'sana') && (
                  <select
                    value={draft.faces[face]?.material ?? ''}
                    disabled={readOnly}
                    onChange={e => updateFace(face, { material: e.target.value || null })}
                    className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs disabled:bg-white"
                  >
                    <option value="">{t('odontogram.tooth.material')}</option>
                    {TOOTH_MATERIALS.map(m => <option key={m} value={m}>{t(`odontogram.material.${m}`)}</option>)}
                  </select>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('odontogram.tooth.notes')}</label>
            <textarea
              value={draft.notes}
              disabled={readOnly}
              onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
              rows={2}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm disabled:bg-slate-50"
            />
          </div>

          {miniHistory.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-4">
              <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('odontogram.tooth.mini_history')}</label>
              <ul className="flex flex-col gap-1.5">
                {miniHistory.map(({ record, tooth: ht }) => (
                  <li key={record.id} className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-slate-600">{new Date(record.record_date).toLocaleDateString('es-ES')}</span>
                    <span>{t(`odontogram.toothStatus.${ht!.status}`)}</span>
                    {record.doctor?.name && <span className="text-slate-400">· {record.doctor.name}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {!readOnly && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              {t('common.cancel')}
            </button>
            <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              {t('common.save')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
