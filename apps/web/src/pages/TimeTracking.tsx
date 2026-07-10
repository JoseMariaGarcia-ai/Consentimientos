import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, User, Users } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { OwnClockPanel } from '@/components/timetracking/OwnClockPanel'
import { TimeTrackingAdminPanel } from '@/components/timetracking/TimeTrackingAdminPanel'

const MANAGER_ROLES = ['superadmin', 'admin', 'clinica']

export default function TimeTracking() {
  const { t } = useTranslation()
  const { role } = useAuth()
  const isManager = MANAGER_ROLES.includes(role ?? '')
  const [tab, setTab] = useState<'self' | 'admin'>('self')

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{t('timeTracking.title')}</h1>
          <p className="text-sm text-slate-500">{t('timeTracking.subtitle')}</p>
        </div>
      </div>

      {isManager && (
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('self')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'self' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <User className="w-4 h-4" />{t('timeTracking.tabSelf')}
          </button>
          <button onClick={() => setTab('admin')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'admin' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <Users className="w-4 h-4" />{t('timeTracking.tabAdmin')}
          </button>
        </div>
      )}

      {(!isManager || tab === 'self') && <OwnClockPanel />}
      {isManager && tab === 'admin' && <TimeTrackingAdminPanel />}
    </div>
  )
}
