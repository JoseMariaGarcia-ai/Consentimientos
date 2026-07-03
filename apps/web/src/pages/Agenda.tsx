import { useState } from 'react'
import { CalendarClock, Stethoscope } from 'lucide-react'
import { AppointmentCalendar } from '@/components/agenda/AppointmentCalendar'
import { TreatmentsPanel } from '@/components/agenda/TreatmentsPanel'

export default function Agenda() {
  const [tab, setTab] = useState<'citas' | 'tratamientos'>('citas')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <CalendarClock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda</h1>
          <p className="text-sm text-slate-500">Citas y tratamientos de la clínica</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('citas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'citas' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CalendarClock className="w-4 h-4" />Citas
        </button>
        <button
          onClick={() => setTab('tratamientos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'tratamientos' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Stethoscope className="w-4 h-4" />Tratamientos
        </button>
      </div>

      {tab === 'citas' ? <AppointmentCalendar /> : <TreatmentsPanel />}
    </div>
  )
}
