import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Trash2, CalendarDays, CalendarCheck, CalendarX, Save, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '@/lib/api'
import { ExceptionCalendar } from './ExceptionCalendar'

interface TimeRange { start: string; end: string }
interface Pattern { weekday: number; is_open: boolean; time_ranges: TimeRange[] }
interface Exception { id: string; date: string; is_open: boolean; time_ranges: TimeRange[]; notes: string | null }

const WEEKDAY_VALUES = [1, 2, 3, 4, 5, 6, 0]

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function TimeRangeEditor({ ranges, onChange }: { ranges: TimeRange[]; onChange: (r: TimeRange[]) => void }) {
  const { t } = useTranslation()
  const update = (i: number, field: 'start' | 'end', value: string) => {
    onChange(ranges.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }
  const remove = (i: number) => onChange(ranges.filter((_, idx) => idx !== i))
  const add = () => onChange([...ranges, { start: '09:00', end: '14:00' }])

  return (
    <div className="flex flex-col gap-1.5">
      {ranges.map((r, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input type="time" value={r.start} onChange={e => update(i, 'start', e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs w-24" />
          <span className="text-xs text-slate-400">{t('schedulePlanner.time_separator')}</span>
          <input type="time" value={r.end} onChange={e => update(i, 'end', e.target.value)}
            className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs w-24" />
          <button type="button" onClick={() => remove(i)} className="p-1 text-slate-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button type="button" onClick={add} className="flex items-center gap-1 text-xs text-blue-600 hover:underline w-fit">
        <Plus className="w-3 h-3" />{t('schedulePlanner.add_time_range')}
      </button>
    </div>
  )
}

export function SchedulePlanner() {
  const { t } = useTranslation()
  const weekdayLabels = t('schedulePlanner.weekdays', { returnObjects: true }) as string[]
  const WEEKDAYS = WEEKDAY_VALUES.map((value, i) => ({ value, label: weekdayLabels[i] }))
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [exceptions, setExceptions] = useState<Exception[]>([])
  const [loading, setLoading] = useState(true)
  const [savingWeekday, setSavingWeekday] = useState<number | null>(null)

  // Bulk-apply panel state
  const [bulkDays, setBulkDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [bulkRanges, setBulkRanges] = useState<TimeRange[]>([{ start: '09:00', end: '20:00' }])
  const [applying, setApplying] = useState(false)

  // New exception form state — multi-select calendar of loose days
  const todayDate = new Date()
  const [excMonthCursor, setExcMonthCursor] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() })
  const [excSelectedDates, setExcSelectedDates] = useState<Set<string>>(new Set())
  const [excOpen, setExcOpen] = useState(true)
  const [excRanges, setExcRanges] = useState<TimeRange[]>([{ start: '09:00', end: '14:00' }])
  const [excNotes, setExcNotes] = useState('')
  const [savingExc, setSavingExc] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p, e] = await Promise.all([
        api.get('/schedule/patterns').catch(() => []),
        api.get('/schedule/exceptions').catch(() => []),
      ])
      setPatterns(Array.isArray(p) ? p : [])
      setExceptions(Array.isArray(e) ? e.sort((a: Exception, b: Exception) => a.date.localeCompare(b.date)) : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const patternFor = (weekday: number): Pattern =>
    patterns.find(p => p.weekday === weekday) ?? { weekday, is_open: false, time_ranges: [] }

  const updatePatternLocal = (weekday: number, patch: Partial<Pattern>) => {
    setPatterns(ps => {
      const exists = ps.some(p => p.weekday === weekday)
      if (exists) return ps.map(p => (p.weekday === weekday ? { ...p, ...patch } : p))
      return [...ps, { weekday, is_open: false, time_ranges: [], ...patch }]
    })
  }

  const saveWeekday = async (weekday: number) => {
    setSavingWeekday(weekday)
    setError('')
    try {
      const p = patternFor(weekday)
      await api.put(`/schedule/patterns/${weekday}`, { is_open: p.is_open, time_ranges: p.time_ranges })
    } catch (e: any) {
      setError(e.message ?? t('schedulePlanner.errors.save_schedule_failed'))
    } finally {
      setSavingWeekday(null)
    }
  }

  const applyBulk = async () => {
    if (bulkDays.length === 0 || bulkRanges.length === 0) return
    setApplying(true)
    setError('')
    try {
      await api.put('/schedule/patterns', { weekdays: bulkDays, is_open: true, time_ranges: bulkRanges })
      await load()
    } catch (e: any) {
      setError(e.message ?? t('schedulePlanner.errors.apply_pattern_failed'))
    } finally {
      setApplying(false)
    }
  }

  const toggleBulkDay = (d: number) => setBulkDays(ds => (ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]))

  const toggleExcDate = (key: string) => {
    setExcSelectedDates(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const navigateExcMonth = (dir: -1 | 1) => {
    setExcMonthCursor(c => {
      const m = c.month + dir
      if (m < 0) return { year: c.year - 1, month: 11 }
      if (m > 11) return { year: c.year + 1, month: 0 }
      return { year: c.year, month: m }
    })
  }

  const patternOpenByWeekday = useMemo(
    () => Object.fromEntries(patterns.map(p => [p.weekday, p.is_open])) as Record<number, boolean>,
    [patterns]
  )
  const existingExceptionDates = useMemo(() => new Set(exceptions.map(e => e.date)), [exceptions])

  const saveException = async () => {
    if (excSelectedDates.size === 0) { setError(t('schedulePlanner.errors.select_day_required')); return }
    setSavingExc(true)
    setError('')
    try {
      await Promise.all(
        Array.from(excSelectedDates).map(date =>
          api.post('/schedule/exceptions', {
            date,
            is_open: excOpen,
            time_ranges: excOpen ? excRanges : [],
            notes: excNotes || null,
          })
        )
      )
      setExcSelectedDates(new Set())
      setExcNotes('')
      setExcRanges([{ start: '09:00', end: '14:00' }])
      await load()
    } catch (e: any) {
      setError(e.message ?? t('schedulePlanner.errors.save_exception_failed'))
    } finally {
      setSavingExc(false)
    }
  }

  const deleteException = async (id: string) => {
    if (!confirm(t('schedulePlanner.confirm_delete_exception'))) return
    await api.delete(`/schedule/exceptions/${id}`)
    await load()
  }

  if (loading) return <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">{t('schedulePlanner.title')}</h2>
        <p className="text-sm text-slate-500">{t('schedulePlanner.subtitle')}</p>
      </div>

      {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}

      {/* Bulk apply */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-700">{t('schedulePlanner.bulk.title')}</h3>
        </div>
        <p className="text-xs text-slate-500">{t('schedulePlanner.bulk.description')}</p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(w => (
            <button
              key={w.value}
              type="button"
              onClick={() => toggleBulkDay(w.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                bulkDays.includes(w.value) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {w.label.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <TimeRangeEditor ranges={bulkRanges} onChange={setBulkRanges} />
          <button
            onClick={applyBulk}
            disabled={applying || bulkDays.length === 0 || bulkRanges.length === 0}
            className="sm:ml-auto flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex-shrink-0"
          >
            {applying ? t('schedulePlanner.bulk.applying') : t('schedulePlanner.bulk.apply_button')}
          </button>
        </div>
      </div>

      {/* Weekly pattern — per-day fine tuning */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">{t('schedulePlanner.weekly.title')}</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {WEEKDAYS.map(w => {
            const p = patternFor(w.value)
            return (
              <div key={w.value} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex items-center gap-2 w-32 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => updatePatternLocal(w.value, { is_open: !p.is_open, time_ranges: p.time_ranges.length ? p.time_ranges : [{ start: '09:00', end: '20:00' }] })}
                    className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${p.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${p.is_open ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <span className="text-sm font-medium text-slate-700">{w.label}</span>
                </div>
                {p.is_open ? (
                  <TimeRangeEditor ranges={p.time_ranges} onChange={r => updatePatternLocal(w.value, { time_ranges: r })} />
                ) : (
                  <span className="text-xs text-slate-400 italic">{t('schedulePlanner.weekly.closed')}</span>
                )}
                <button
                  onClick={() => saveWeekday(w.value)}
                  disabled={savingWeekday === w.value}
                  className="sm:ml-auto flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex-shrink-0"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingWeekday === w.value ? t('schedulePlanner.weekly.saving') : t('schedulePlanner.weekly.save')}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Individual date exceptions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-700">{t('schedulePlanner.exceptions.title')}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{t('schedulePlanner.exceptions.description')}</p>
        </div>

        <div className="px-5 py-4 border-b border-slate-100 flex flex-col lg:flex-row gap-5">
          <div className="lg:w-80 flex-shrink-0 flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
              {t('schedulePlanner.exceptions.select_days_label')}
            </label>
            <ExceptionCalendar
              year={excMonthCursor.year}
              month={excMonthCursor.month}
              patternOpenByWeekday={patternOpenByWeekday}
              existingExceptionDates={existingExceptionDates}
              selected={excSelectedDates}
              todayKey={toDateKey(todayDate)}
              onNavigate={navigateExcMonth}
              onToggleDay={toggleExcDate}
            />
            {excSelectedDates.size > 0 && (
              <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                <span>
                  {excSelectedDates.size > 1
                    ? t('schedulePlanner.exceptions.days_selected_plural', { count: excSelectedDates.size })
                    : t('schedulePlanner.exceptions.days_selected_singular', { count: excSelectedDates.size })}
                </span>
                <button type="button" onClick={() => setExcSelectedDates(new Set())} className="flex items-center gap-1 text-slate-400 hover:text-red-500">
                  <X className="w-3 h-3" />{t('schedulePlanner.exceptions.clear_selection')}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExcOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${excOpen ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-300 text-slate-600'}`}
              >
                <CalendarCheck className="w-4 h-4" />{t('schedulePlanner.exceptions.open_special')}
              </button>
              <button
                type="button"
                onClick={() => setExcOpen(false)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border ${!excOpen ? 'bg-red-50 border-red-300 text-red-700' : 'border-slate-300 text-slate-600'}`}
              >
                <CalendarX className="w-4 h-4" />{t('schedulePlanner.exceptions.close')}
              </button>
            </div>
            {excOpen && (
              <div>
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide block mb-1">{t('schedulePlanner.exceptions.schedule_label')}</label>
                <TimeRangeEditor ranges={excRanges} onChange={setExcRanges} />
              </div>
            )}
            <input
              value={excNotes}
              onChange={e => setExcNotes(e.target.value)}
              placeholder={t('schedulePlanner.exceptions.notes_placeholder')}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm max-w-sm"
            />
            <button
              onClick={saveException}
              disabled={savingExc || excSelectedDates.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-50 w-fit"
            >
              {savingExc
                ? t('schedulePlanner.exceptions.saving')
                : excSelectedDates.size > 1
                  ? t('schedulePlanner.exceptions.save_button_plural', { count: excSelectedDates.size })
                  : t('schedulePlanner.exceptions.save_button_singular')}
            </button>
          </div>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('schedulePlanner.exceptions.no_exceptions')}</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {exceptions.map(exc => (
              <div key={exc.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(`${exc.date}T00:00:00`).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {exc.is_open
                      ? t('schedulePlanner.exceptions.open_special_status', { ranges: exc.time_ranges.map(r => `${r.start}-${r.end}`).join(', ') })
                      : t('schedulePlanner.exceptions.closed_status')}
                    {exc.notes && ` · ${exc.notes}`}
                  </p>
                </div>
                <button onClick={() => deleteException(exc.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
