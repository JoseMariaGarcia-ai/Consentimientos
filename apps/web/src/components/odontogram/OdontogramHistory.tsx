import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GitCompare, X } from 'lucide-react'
import type { OdontogramRecord } from '@consentspro/shared-types'
import { OdontogramChart } from './OdontogramChart'
import { FACE_NAMES, toothChanged } from './toothMeta'

interface Props {
  records: OdontogramRecord[] // más recientes primero
  onClose: () => void
}

interface Transition { key: string; count: number; teeth: string[] }

function buildSummary(older: OdontogramRecord, newer: OdontogramRecord, t: (k: string, o?: any) => string): string[] {
  const oldMap = new Map(older.teeth.map(x => [x.number, x]))
  const newMap = new Map(newer.teeth.map(x => [x.number, x]))
  const numbers = new Set([...oldMap.keys(), ...newMap.keys()])
  const transitions: Record<string, Transition> = {}

  const add = (key: string, number: string) => {
    if (!transitions[key]) transitions[key] = { key, count: 0, teeth: [] }
    transitions[key].count += 1
    transitions[key].teeth.push(number)
  }

  for (const number of numbers) {
    const a = oldMap.get(number)
    const b = newMap.get(number)
    if (!b) continue
    if (a?.status !== b.status) {
      if (b.status === 'extraido') add('extraction', number)
      else if (b.status === 'a_extraer') add('toExtract', number)
      else if (b.status === 'corona') add('crown', number)
      else if (b.status === 'implante') add('implant', number)
      else if (b.status === 'endodoncia') add('endodontics', number)
      else if (b.status === 'puente') add('bridge', number)
    }
    for (const face of FACE_NAMES) {
      const fa = a?.faces[face]?.condition ?? 'sana'
      const fb = b.faces[face]?.condition ?? 'sana'
      if (fa === fb) continue
      if (fb === 'caries') add('newCaries', number)
      else if (fa === 'caries' && fb === 'obturada') add('fillingCompleted', number)
      else if (fb === 'sellante') add('sealant', number)
      else if (fb === 'fractura') add('fracture', number)
    }
  }

  return Object.values(transitions).map(tr =>
    t(`odontogram.history.summary.${tr.key}`, { count: tr.count, teeth: [...new Set(tr.teeth)].join(', ') })
  )
}

export function OdontogramHistory({ records, onClose }: Props) {
  const { t } = useTranslation()
  const sorted = useMemo(() => [...records].sort((a, b) => a.record_date.localeCompare(b.record_date)), [records])
  const [selectedId, setSelectedId] = useState<string | null>(sorted[sorted.length - 1]?.id ?? null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareFromId, setCompareFromId] = useState<string | null>(sorted[0]?.id ?? null)
  const [compareToId, setCompareToId] = useState<string | null>(sorted[sorted.length - 1]?.id ?? null)

  const selected = sorted.find(r => r.id === selectedId) ?? null
  const compareFrom = sorted.find(r => r.id === compareFromId) ?? null
  const compareTo = sorted.find(r => r.id === compareToId) ?? null

  const changedNumbers = useMemo(() => {
    if (!compareFrom || !compareTo) return new Set<string>()
    const oldMap = new Map(compareFrom.teeth.map(x => [x.number, x]))
    const newMap = new Map(compareTo.teeth.map(x => [x.number, x]))
    const numbers = new Set([...oldMap.keys(), ...newMap.keys()])
    const changed = new Set<string>()
    for (const n of numbers) if (toothChanged(oldMap.get(n), newMap.get(n))) changed.add(n)
    return changed
  }, [compareFrom, compareTo])

  const summary = useMemo(() => {
    if (!compareFrom || !compareTo || compareFrom.id === compareTo.id) return []
    return buildSummary(compareFrom, compareTo, t)
  }, [compareFrom, compareTo, t])

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">{t('odontogram.history.title')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCompareMode(m => !m)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${compareMode ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <GitCompare className="w-3.5 h-3.5" />{t('odontogram.history.compareMode')}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Línea de tiempo */}
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {sorted.map((r, i) => (
              <button
                key={r.id}
                onClick={() => (compareMode ? setCompareToId(r.id) : setSelectedId(r.id))}
                className="flex flex-col items-center gap-1 flex-shrink-0 px-2"
                title={new Date(r.record_date).toLocaleDateString('es-ES')}
              >
                <span
                  className={`w-3 h-3 rounded-full border-2 ${
                    (compareMode ? r.id === compareToId || r.id === compareFromId : r.id === selectedId)
                      ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'
                  }`}
                />
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(r.record_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                {i < sorted.length - 1 && <span className="hidden" />}
              </button>
            ))}
          </div>

          {!compareMode && selected && (
            <>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{new Date(selected.record_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                {selected.doctor?.name && <span>· {selected.doctor.name}</span>}
                {selected.notes && <span className="text-slate-400">· {selected.notes}</span>}
              </div>
              <OdontogramChart teeth={selected.teeth} dentitionType={selected.dentition_type} readOnly />
            </>
          )}

          {compareMode && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('odontogram.history.from')}</label>
                  <select value={compareFromId ?? ''} onChange={e => setCompareFromId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    {sorted.map(r => <option key={r.id} value={r.id}>{new Date(r.record_date).toLocaleDateString('es-ES')}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{t('odontogram.history.to')}</label>
                  <select value={compareToId ?? ''} onChange={e => setCompareToId(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg text-sm">
                    {sorted.map(r => <option key={r.id} value={r.id}>{new Date(r.record_date).toLocaleDateString('es-ES')}</option>)}
                  </select>
                </div>
              </div>

              {summary.length > 0 ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 flex flex-col gap-1">
                  {summary.map((line, i) => <p key={i}>• {line}</p>)}
                </div>
              ) : compareFrom && compareTo && compareFrom.id !== compareTo.id ? (
                <p className="text-sm text-slate-400">{t('odontogram.history.noChanges')}</p>
              ) : null}

              {compareTo && (
                <OdontogramChart teeth={compareTo.teeth} dentitionType={compareTo.dentition_type} changedNumbers={changedNumbers} readOnly />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
