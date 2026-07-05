import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarClock, Stethoscope, Settings2 } from 'lucide-react'
import { AppointmentCalendar } from '@/components/agenda/AppointmentCalendar'
import { TreatmentsPanel } from '@/components/agenda/TreatmentsPanel'
import { SchedulePlanner } from '@/components/agenda/SchedulePlanner'

export default function Agenda() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'citas' | 'tratamientos' | 'planificacion'>('citas')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('agenda.title')}</h1>
          <p className="text-sm text-slate-500">{t('agenda.subtitle')}</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
        <button
          onClick={() => setTab('citas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'citas' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CalendarClock className="w-4 h-4" />{t('agenda.tab_appointments')}
        </button>
        <button
          onClick={() => setTab('tratamientos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'tratamientos' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Stethoscope className="w-4 h-4" />{t('agenda.tab_treatments')}
        </button>
        <button
          onClick={() => setTab('planificacion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'planificacion' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Settings2 className="w-4 h-4" />{t('agenda.tab_planning')}
        </button>
      </div>

      {tab === 'citas' ? <AppointmentCalendar /> : tab === 'tratamientos' ? <TreatmentsPanel /> : <SchedulePlanner />}
    </div>
  )
}
