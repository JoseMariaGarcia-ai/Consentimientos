import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function dateKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function buildWeeks(year: number, month: number): (string | null)[][] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Mon=0..Sun=6
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = Array(firstWeekday).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(dateKey(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

interface MonthViewProps {
  year: number
  month: number // 0-indexed
  availability: Record<string, { is_open: boolean }>
  appointmentCounts: Record<string, number>
  todayKey: string
  onNavigate: (dir: -1 | 1) => void
  onSelectDay: (dateKey: string) => void
}

export function MonthView({ year, month, availability, appointmentCounts, todayKey, onNavigate, onSelectDay }: MonthViewProps) {
  const { t } = useTranslation()
  const weekdayLabels = t('monthView.weekdays_short', { returnObjects: true }) as string[]
  const monthLabels = t('monthView.months', { returnObjects: true }) as string[]
  const weeks = buildWeeks(year, month)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <button onClick={() => onNavigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-bold text-slate-800">{monthLabels[month]} {year}</h3>
        <button onClick={() => onNavigate(1)} className="p-1.5 rounded-lg hover:bg-slate-100">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {weekdayLabels.map(l => (
          <div key={l} className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide py-2">{l}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((key, i) => {
          if (!key) return <div key={i} className="aspect-square border-b border-r border-slate-50 bg-slate-50/40" />
          const day = Number(key.slice(-2))
          const isToday = key === todayKey
          const isPast = key < todayKey
          // Un día pasado ya no se puede reservar, se pinte como cerrado o
          // abierto en la Planificación de Agenda — mismo color que "cerrado"
          // para que se vea de un vistazo que no admite citas nuevas.
          const isOpen = availability[key]?.is_open && !isPast
          const count = appointmentCounts[key] ?? 0
          return (
            <button
              key={key}
              onClick={() => onSelectDay(key)}
              className={`aspect-square border-b border-r border-slate-50 flex flex-col items-center justify-center gap-0.5 transition-colors relative
                ${isOpen ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-slate-100 hover:bg-slate-200'}
              `}
            >
              <span className={`text-sm ${isToday ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold' : isOpen ? 'text-emerald-800 font-medium' : 'text-slate-400'}`}>
                {day}
              </span>
              {count > 0 && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 rounded-full px-1.5 leading-tight">{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200 inline-block" />{t('monthView.legend.open_day')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />{t('monthView.legend.closed')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" />{t('monthView.legend.today')}</span>
      </div>
    </div>
  )
}
