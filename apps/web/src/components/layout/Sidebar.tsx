import { useState, useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Users, UserCog, FileText, Building2, BookOpen, Settings, ClipboardList, Camera, Zap, CalendarClock, Syringe, MessageCircle, Receipt, Workflow, LifeBuoy, BadgeEuro, Clock, Sparkles, TrendingUp, GripVertical } from 'lucide-react'
import { LanguageSelector } from '../language/LanguageSelector'
import { useCredits } from '@/hooks/useCredits'
import { useOpenTickets } from '@/hooks/useOpenTickets'

const navItems: { to: string; icon: typeof LayoutDashboard; label: string; moduleKey: string }[] = [
  { to: '/', icon: LayoutDashboard, label: 'nav.dashboard', moduleKey: 'dashboard' },
  { to: '/agenda', icon: CalendarClock, label: 'nav.agenda', moduleKey: 'agenda' },
  { to: '/patients', icon: Users, label: 'nav.patients', moduleKey: 'patients' },
  { to: '/doctors', icon: UserCog, label: 'nav.doctors', moduleKey: 'doctors' },
  { to: '/consents', icon: FileText, label: 'nav.consents', moduleKey: 'consents' },
  { to: '/clinical-records', icon: ClipboardList, label: 'nav.clinicalRecords', moduleKey: 'clinical-records' },
  { to: '/photos', icon: Camera, label: 'nav.photos', moduleKey: 'photos' },
  { to: '/toxina', icon: Syringe, label: 'nav.toxin', moduleKey: 'toxin' },
  { to: '/budgets', icon: Receipt, label: 'nav.budgets', moduleKey: 'budgets' },
  { to: '/invoicing', icon: BadgeEuro, label: 'nav.invoicing', moduleKey: 'invoicing' },
  { to: '/control-horario', icon: Clock, label: 'nav.timeTracking', moduleKey: 'time-tracking' },
  { to: '/whatsapp', icon: MessageCircle, label: 'nav.whatsapp', moduleKey: 'whatsapp' },
  { to: '/ai-credits', icon: Sparkles, label: 'nav.aiCredits', moduleKey: 'ai-credits' },
  { to: '/templates', icon: BookOpen, label: 'nav.templates', moduleKey: 'templates' },
  { to: '/clinic', icon: Building2, label: 'nav.clinic', moduleKey: 'clinic' },
  { to: '/lab-partners', icon: Building2, label: 'nav.labPartners', moduleKey: 'lab-partners' },
  { to: '/tickets', icon: LifeBuoy, label: 'nav.tickets', moduleKey: 'tickets' },
]

const bottomNavItems = [
  { to: '/settings', icon: Settings, label: 'nav.settings', moduleKey: 'settings' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  /** When set, only nav items whose moduleKey is in this list are shown (used for role preview / permission-restricted views). */
  allowedModules?: string[]
  /** Workflows is a role-based section (superadmin only) — it's never part of the plan/module permission model. */
  isSuperAdmin?: boolean
  /** User's saved order for the main nav list (moduleKey[]), null/undefined = default order. */
  sidebarOrder?: string[] | null
  /** Called after a drag ends with the new full moduleKey order — persisted by the caller. */
  onReorder?: (order: string[]) => void
}

export function Sidebar({ open, onClose, allowedModules, isSuperAdmin, sidebarOrder, onReorder }: SidebarProps) {
  const { t } = useTranslation()
  const { low } = useCredits()
  const { count: openTickets } = useOpenTickets()
  const visibleNavItems = allowedModules ? navItems.filter(i => allowedModules.includes(i.moduleKey)) : navItems
  const visibleBottomItems = allowedModules ? bottomNavItems.filter(i => allowedModules.includes(i.moduleKey)) : bottomNavItems

  // Reordenación por arrastre — solo del bloque principal de navItems (no
  // de Settings, ni de Recargar, ni del bloque superadmin de Workflows,
  // que viven fuera de este array por diseño). dragOrder es la lista de
  // moduleKey en el orden que se está mostrando/arrastrando; se resincroniza
  // con la preferencia guardada cuando cambia, pero nunca en medio de un
  // arrastre en curso (evitaría que el orden "salte" bajo el dedo/ratón).
  const navRef = useRef<HTMLDivElement>(null)
  const dragKeyRef = useRef<string | null>(null)
  const [dragOrder, setDragOrder] = useState<string[]>(() => visibleNavItems.map(i => i.moduleKey))
  const dragOrderRef = useRef(dragOrder)
  useEffect(() => { dragOrderRef.current = dragOrder }, [dragOrder])

  useEffect(() => {
    if (dragKeyRef.current) return
    const keys = visibleNavItems.map(i => i.moduleKey)
    const saved = sidebarOrder ?? []
    const next = saved.length > 0
      ? [...saved.filter(k => keys.includes(k)), ...keys.filter(k => !saved.includes(k))]
      : keys
    setDragOrder(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNavItems.map(i => i.moduleKey).join(','), (sidebarOrder ?? []).join(',')])

  const orderedNavItems = dragOrder
    .map(key => visibleNavItems.find(i => i.moduleKey === key))
    .filter((i): i is typeof visibleNavItems[number] => !!i)

  const handleGripPointerDown = (key: string) => (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragKeyRef.current = key
  }

  const handleGripPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const key = dragKeyRef.current
    if (!key || !navRef.current) return
    const els = Array.from(navRef.current.querySelectorAll<HTMLElement>('[data-nav-key]'))
    const overEl = els.find(el => {
      const r = el.getBoundingClientRect()
      return e.clientY >= r.top && e.clientY <= r.bottom
    })
    const overKey = overEl?.dataset.navKey
    if (!overKey || overKey === key) return
    setDragOrder(prev => {
      const from = prev.indexOf(key)
      const to = prev.indexOf(overKey)
      if (from === -1 || to === -1 || from === to) return prev
      const next = [...prev]
      next.splice(from, 1)
      next.splice(to, 0, key)
      return next
    })
  }

  const handleGripPointerUp = () => {
    const key = dragKeyRef.current
    dragKeyRef.current = null
    if (key) onReorder?.(dragOrderRef.current)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-56 bg-white border-r border-slate-200 flex flex-col py-4 overflow-y-auto transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1" ref={navRef}>
          {orderedNavItems.map(({ to, icon: Icon, label, moduleKey }) => (
            <div key={moduleKey} data-nav-key={moduleKey} className="flex items-center mx-2">
              <button
                type="button"
                onPointerDown={handleGripPointerDown(moduleKey)}
                onPointerMove={handleGripPointerMove}
                onPointerUp={handleGripPointerUp}
                onPointerCancel={handleGripPointerUp}
                title={t('nav.reorderHandle')}
                aria-label={t('nav.reorderHandle')}
                className="p-1 -mr-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing flex-shrink-0"
                style={{ touchAction: 'none' }}
              >
                <GripVertical className="w-3.5 h-3.5" />
              </button>
              <NavLink
                to={to}
                end={to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {t(label)}
                {to === '/tickets' && openTickets > 0 && (
                  <span className="ml-auto min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {openTickets}
                  </span>
                )}
              </NavLink>
            </div>
          ))}

          {/* Recargar — highlighted when credits are low */}
          <NavLink
            to="/recharge"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-100 text-amber-800'
                  : low
                  ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Zap className={`w-4 h-4 ${low ? 'text-amber-500' : ''}`} />
            {t('nav.recharge')}
            {low && <span className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </NavLink>
        </nav>

        {/* Workflows — superadmin-only, independent of plan/module permissions */}
        {isSuperAdmin && (
          <div className="mx-2 pt-2 border-t border-slate-100">
            <NavLink
              to="/workflows"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Workflow className="w-4 h-4" />
              {t('nav.workflows')}
            </NavLink>
            <NavLink
              to="/ai-revenue"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <TrendingUp className="w-4 h-4" />
              {t('nav.aiRevenue')}
            </NavLink>
          </div>
        )}

        {/* Settings — above language selector */}
        <div className="mx-2 pt-2 border-t border-slate-100">
          {visibleBottomItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-brand' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {t(label)}
            </NavLink>
          ))}
        </div>

        {/* Language selector */}
        <div className="mx-2 mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-3 mb-2">
            {t('language.select')}
          </p>
          <div className="px-1">
            <LanguageSelector variant="sidebar" />
          </div>
        </div>
      </aside>
    </>
  )
}
