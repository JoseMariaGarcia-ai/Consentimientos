import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, Stethoscope, FileText, Building2 } from 'lucide-react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/patients', icon: Users, label: 'nav.patients' },
  { to: '/doctors', icon: Stethoscope, label: 'nav.doctors' },
  { to: '/consents', icon: FileText, label: 'nav.consents' },
  { to: '/clinic', icon: Building2, label: 'nav.clinic' },
]

export function Sidebar() {
  const { t } = useTranslation()
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col py-4">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
            }`
          }
        >
          <Icon className="w-4 h-4" />
          {t(label)}
        </NavLink>
      ))}
    </aside>
  )
}
