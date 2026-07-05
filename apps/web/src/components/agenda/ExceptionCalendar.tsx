import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
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

interface ExceptionCalendarProps {
  year: number
  month: number // 0-indexed
  patternOpenByWeekday: Record<number, boolean>
  existingExceptionDates: Set<string>
  selected: Set<string>
  todayKey: string
  onNavigate: (dir: -1 | 1) => void
  onToggleDay: (dateKey: string) => void
}

export function ExceptionCalendar({
  year, month, patternOpenByWeekday, existingExceptionDates, selected, todayKey, onNavigate, onToggleDay,
}: ExceptionCalendarProps) {
  const { t } = useTranslation()
  const weekdayLabels = t('exceptionCalendar.weekdays_short', { returnObjects: true }) as string[]
  const monthLabels = t('exceptionCalendar.months', { returnObjects: true }) as string[]
  const weeks = buildWeeks(year, month)

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50">
        <button type="button" onClick={() => onNavigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-200">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h4 className="text-sm font-bold text-slate-700">{monthLabels[month]} {year}</h4>
        <button type="button" onClick={() => onNavigate(1)} className="p-1.5 rounded-lg hover:bg-slate-200">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
        {weekdayLabels.map(l => (
          <div key={l} className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-wide py-1.5">{l}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weeks.flat().map((key, i) => {
          if (!key) return <div key={i} className="aspect-square border-b border-r border-slate-50 bg-slate-50/40" />
          const day = Number(key.slice(-2))
          const weekday = new Date(`${key}T00:00:00`).getDay()
          const patternOpen = !!patternOpenByWeekday[weekday]
          const hasException = existingExceptionDates.has(key)
          const isSelected = selected.has(key)
          const isToday = key === todayKey
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleDay(key)}
              className={`aspect-square border-b border-r border-slate-50 flex flex-col items-center justify-center gap-0.5 relative transition-colors
                ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : patternOpen ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-slate-100 hover:bg-slate-200'}
              `}
            >
              <span className={`text-xs leading-none ${
                isSelected
                  ? 'text-white font-bold'
                  : isToday
                    ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold'
                    : patternOpen
                      ? 'text-emerald-800 font-medium'
                      : 'text-slate-400'
              }`}>
                {day}
              </span>
              {hasException && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-1.5" title={t('exceptionCalendar.has_exception_tooltip')} />
              )}
              {isSelected && <Check className="w-3 h-3 text-white absolute bottom-1" />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-t border-slate-100 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-50 border border-emerald-200 inline-block" />{t('exceptionCalendar.legend.usually_open')}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-300 inline-block" />{t('exceptionCalendar.legend.usually_closed')}</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />{t('exceptionCalendar.legend.has_exception')}</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />{t('exceptionCalendar.legend.selected')}</span>
      </div>
    </div>
  )
}
