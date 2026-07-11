import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { OdontogramTooth } from '@consentspro/shared-types'
import { ToothSvg } from './ToothSvg'
import {
  PERMANENT_QUADRANTS, TEMPORARY_QUADRANTS, FACE_CONDITION_COLOR, emptyTooth,
} from './toothMeta'

interface Props {
  teeth: OdontogramTooth[]
  dentitionType: 'permanente' | 'temporal' | 'mixta'
  onDentitionTypeChange?: (t: 'permanente' | 'temporal' | 'mixta') => void
  changedNumbers?: Set<string>
  onToothClick?: (number: string) => void
  readOnly?: boolean
}

export function OdontogramChart({ teeth, dentitionType, onDentitionTypeChange, changedNumbers, onToothClick, readOnly }: Props) {
  const { t } = useTranslation()
  const byNumber = useMemo(() => {
    const m = new Map<string, OdontogramTooth>()
    for (const tooth of teeth) m.set(tooth.number, tooth)
    return m
  }, [teeth])

  const showPermanent = dentitionType === 'permanente' || dentitionType === 'mixta'
  const showTemporary = dentitionType === 'temporal' || dentitionType === 'mixta'

  const renderRow = (quadrantLeft: string[], quadrantRight: string[]) => (
    <div className="flex items-center justify-center gap-3">
      <div className="flex gap-1">
        {quadrantLeft.map(n => (
          <ToothSvg
            key={n}
            tooth={byNumber.get(n) ?? emptyTooth(n)}
            changed={changedNumbers?.has(n)}
            onToothClick={() => onToothClick?.(n)}
            onFaceClick={() => onToothClick?.(n)}
          />
        ))}
      </div>
      <div className="w-px self-stretch bg-slate-300" />
      <div className="flex gap-1">
        {quadrantRight.map(n => (
          <ToothSvg
            key={n}
            tooth={byNumber.get(n) ?? emptyTooth(n)}
            changed={changedNumbers?.has(n)}
            onToothClick={() => onToothClick?.(n)}
            onFaceClick={() => onToothClick?.(n)}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {!readOnly && onDentitionTypeChange && (
        <div className="flex items-center gap-2">
          {(['permanente', 'temporal', 'mixta'] as const).map(dt => (
            <button
              key={dt}
              onClick={() => onDentitionTypeChange(dt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                dentitionType === dt ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t(`odontogram.dentition.${dt}`)}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 overflow-x-auto">
        {showPermanent && (
          <div className="flex flex-col gap-3 min-w-max mx-auto">
            {renderRow(PERMANENT_QUADRANTS[0], PERMANENT_QUADRANTS[1])}
            {renderRow(PERMANENT_QUADRANTS[2], PERMANENT_QUADRANTS[3])}
          </div>
        )}
        {showPermanent && showTemporary && <div className="border-t border-dashed border-slate-200" />}
        {showTemporary && (
          <div className="flex flex-col gap-3 min-w-max mx-auto">
            <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{t('odontogram.dentition.temporal')}</p>
            {renderRow(TEMPORARY_QUADRANTS[0], TEMPORARY_QUADRANTS[1])}
            {renderRow(TEMPORARY_QUADRANTS[2], TEMPORARY_QUADRANTS[3])}
          </div>
        )}
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        {(Object.keys(FACE_CONDITION_COLOR) as (keyof typeof FACE_CONDITION_COLOR)[]).map(cond => (
          <span key={cond} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm border border-slate-300" style={{ backgroundColor: FACE_CONDITION_COLOR[cond] }} />
            {t(`odontogram.faceCondition.${cond}`)}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-slate-300 bg-slate-300" />
          {t('odontogram.legend.absent')}
        </span>
      </div>
    </div>
  )
}
