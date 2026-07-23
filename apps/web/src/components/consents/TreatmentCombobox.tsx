import { useState, useRef, useEffect, useMemo, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Search, X, ChevronRight, ChevronDown } from 'lucide-react'
import type { ConsentTemplate } from '@consentspro/shared-types'

// Quita acentos para que buscar "depilacion" encuentre "Depilación" —
// coincidencia por cualquier parte del nombre, no solo desde el principio.
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

interface Props {
  templatesByCategory: readonly (readonly [string, ConsentTemplate[]])[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}

const MARGIN = 8
const MIN_PANEL_HEIGHT = 220
const MOBILE_QUERY = '(max-width: 767px)'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches)
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])
  return isMobile
}

// Al abrirse sin texto, se navega por categorías (una se despliega a la vez,
// como un acordeón) para no enseñar de golpe todas las plantillas. En cuanto
// se escribe algo, se aplana la lista y se busca por nombre en todas las
// categorías a la vez — así se puede tanto explorar como buscar directo.
export function TreatmentCombobox({ templatesByCategory, value, onChange, placeholder }: Props) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [panelStyle, setPanelStyle] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const allTemplates = useMemo(() => templatesByCategory.flatMap(([, items]) => items), [templatesByCategory])
  const selected = allTemplates.find(tmpl => tmpl.id === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (containerRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // En escritorio, el desplegable se renderiza en un portal a document.body
  // con position: fixed y coordenadas calculadas aquí (para no quedar
  // recortado por el overflow-y-auto del modal donde vive el campo). En
  // móvil esto se desactiva por completo: el teclado en pantalla cambia
  // window.innerHeight/el viewport visual en mitad de la interacción, así
  // que la posición calculada se quedaba desincronizada y el cuadro
  // "saltaba" por la pantalla — en su lugar, móvil usa un panel a pantalla
  // completa (ver más abajo) que no necesita calcular ninguna posición.
  useLayoutEffect(() => {
    if (!open || isMobile || !containerRef.current) { setPanelStyle(null); return }

    function updatePosition() {
      const rect = containerRef.current!.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom - MARGIN
      const spaceAbove = rect.top - MARGIN
      const openUpward = spaceBelow < MIN_PANEL_HEIGHT && spaceAbove > spaceBelow

      const maxHeight = Math.max(MIN_PANEL_HEIGHT, openUpward ? spaceAbove : spaceBelow)

      setPanelStyle({
        top: openUpward ? undefined : rect.bottom + 4,
        bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
        left: rect.left,
        width: rect.width,
        maxHeight,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, isMobile])

  const searching = query.trim().length > 0
  const filtered = useMemo(() => {
    if (!searching) return []
    const q = normalize(query.trim())
    return allTemplates.filter(tmpl => normalize(tmpl.treatmentType).includes(q))
  }, [allTemplates, query, searching])

  const displayValue = open ? query : (selected?.treatmentType ?? '')

  function pick(id: string) {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  const listContent = searching ? (
    filtered.length === 0 ? (
      <div className="px-3 py-3 text-sm text-slate-400">{t('treatmentCombobox.no_results')}</div>
    ) : filtered.map(tmpl => (
      <button
        key={tmpl.id}
        type="button"
        onClick={() => pick(tmpl.id)}
        className={`w-full text-left px-3 py-3 text-sm leading-snug hover:bg-blue-50 ${tmpl.id === value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
      >
        <div className="font-medium">{tmpl.treatmentType}</div>
        <div className="text-xs text-slate-400 mt-0.5">{t(`templates.categories.${tmpl.category}`)}</div>
      </button>
    ))
  ) : (
    templatesByCategory.map(([category, items]) => {
      const isExpanded = expandedCategory === category
      return (
        <div key={category}>
          <button
            type="button"
            onClick={() => setExpandedCategory(isExpanded ? null : category)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sticky top-0 bg-white"
          >
            <span>{t(`templates.categories.${category}`)}</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              {items.length}
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          </button>
          {isExpanded && items.map(tmpl => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => pick(tmpl.id)}
              className={`w-full text-left pl-6 pr-3 py-3 text-sm leading-snug hover:bg-blue-50 ${tmpl.id === value ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
            >
              {tmpl.treatmentType}
            </button>
          ))}
        </div>
      )
    })
  )

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={displayValue}
          readOnly={isMobile}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (!isMobile) setQuery(''); setOpen(true) }}
          onClick={() => { if (isMobile) { setQuery(''); setOpen(true) } }}
          placeholder={placeholder ?? t('treatmentCombobox.placeholder')}
          className="w-full px-3 py-2.5 pr-8 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {selected && !open ? (
          <button type="button" onClick={() => { onChange(''); setQuery('') }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
      </div>

      {open && isMobile && createPortal(
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-slate-200 flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={placeholder ?? t('treatmentCombobox.placeholder')}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); setQuery('') }}
              className="flex-shrink-0 p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              aria-label={t('consents.close') as string}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {listContent}
          </div>
        </div>,
        document.body
      )}

      {open && !isMobile && panelStyle && createPortal(
        <div
          ref={panelRef}
          className="fixed z-50 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl"
          style={panelStyle}
        >
          {listContent}
        </div>,
        document.body
      )}
    </div>
  )
}
