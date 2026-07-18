import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X, Plus } from 'lucide-react'

interface BillingClient {
  id: string
  full_name: string
  tax_id: string
  email?: string | null
  phone?: string | null
}

function clientSearchable(c: BillingClient): string {
  return [c.full_name, c.tax_id, c.email, c.phone].filter(Boolean).join(' ').toLowerCase()
}

interface Props {
  clients: BillingClient[]
  value: string
  onChange: (id: string) => void
  onCreateNew: () => void
  placeholder?: string
  error?: boolean
}

// Mismo patrón que PatientCombobox (desplegable + búsqueda por nombre/NIF),
// con una fila destacada "Crear nuevo cliente" al final de la lista.
export function BillingClientCombobox({ clients, value, onChange, onCreateNew, placeholder, error }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = clients.find(c => c.id === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c => clientSearchable(c).includes(q))
  }, [clients, query])

  const displayValue = open ? query : (selected ? selected.full_name : '')

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setQuery(''); setOpen(true) }}
          placeholder={placeholder ?? t('billingClientCombobox.placeholder')}
          className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${error ? 'border-red-400' : 'border-slate-300'}`}
        />
        {selected && !open ? (
          <button type="button" onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          <button
            type="button"
            onClick={() => { setOpen(false); setQuery(''); onCreateNew() }}
            className="w-full text-left px-3 py-2 text-sm text-emerald-700 font-medium hover:bg-emerald-50 flex items-center gap-1.5 border-b border-slate-100"
          >
            <Plus className="w-3.5 h-3.5" />{t('billingClientCombobox.createNew')}
          </button>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">{t('billingClientCombobox.no_results')}</div>
          ) : filtered.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => { onChange(c.id); setQuery(''); setOpen(false) }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 ${c.id === value ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700'}`}
            >
              <div className="font-medium">{c.full_name}</div>
              <div className="text-xs text-slate-400">{c.tax_id}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
