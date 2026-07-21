import { useState, useRef, useEffect, useMemo } from 'react'
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

// Al abrirse sin texto, se navega por categorías (una se despliega a la vez,
// como un acordeón) para no enseñar de golpe todas las plantillas. En cuanto
// se escribe algo, se aplana la lista y se busca por nombre en todas las
// categorías a la vez — así se puede tanto explorar como buscar directo.
export function TreatmentCombobox({ templatesByCategory, value, onChange, placeholder }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const allTemplates = useMemo(() => templatesByCategory.flatMap(([, items]) => items), [templatesByCategory])
  const selected = allTemplates.find(tmpl => tmpl.id === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const searching = query.trim().length > 0
  const filtered = useMemo(() => {
    if (!searching) return []
    const q = normalize(query.trim())
    return allTemplates.filter(tmpl => normalize(tmpl.treatmentType).includes(q))
  }, [allTemplates, query, searching])

  const displayValue = open ? query : (selected?.treatmentType ?? '')

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setQuery(''); setOpen(true) }}
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
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {searching ? (
            filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">{t('treatmentCombobox.no_results')}</div>
            ) : filtered.map(tmpl => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => { onChange(tmpl.id); setQuery(''); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${tmpl.id === value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
              >
                <div className="font-medium">{tmpl.treatmentType}</div>
                <div className="text-xs text-slate-400">{t(`templates.categories.${tmpl.category}`)}</div>
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
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                      onClick={() => { onChange(tmpl.id); setQuery(''); setOpen(false) }}
                      className={`w-full text-left pl-6 pr-3 py-2 text-sm hover:bg-blue-50 ${tmpl.id === value ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                    >
                      {tmpl.treatmentType}
                    </button>
                  ))}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
