import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'

interface PatientLike {
  id: string
  firstName?: string; first_name?: string
  lastName?: string; last_name?: string
  fullName?: string; full_name?: string
  phone?: string
  idDocument?: string; id_document?: string
}

function patientName(p: PatientLike): string {
  const first = p.firstName ?? p.first_name
  const last = p.lastName ?? p.last_name
  if (first || last) return [first, last].filter(Boolean).join(' ')
  return p.fullName ?? p.full_name ?? ''
}

function patientSearchable(p: PatientLike): string {
  return [patientName(p), p.phone, p.idDocument ?? p.id_document].filter(Boolean).join(' ').toLowerCase()
}

interface PatientComboboxProps {
  patients: PatientLike[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  allowClear?: boolean
  error?: boolean
  className?: string
}

// Combina el desplegable clásico (lista completa al enfocar) con una
// búsqueda por nombre, teléfono o DNI — sustituye a los <select> de
// paciente usados en formularios y filtros de toda la app.
export function PatientCombobox({ patients, value, onChange, placeholder, allowClear = true, error, className }: PatientComboboxProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = patients.find(p => p.id === value)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(p => patientSearchable(p).includes(q))
  }, [patients, query])

  const displayValue = open ? query : (selected ? patientName(selected) : '')

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <input
          value={displayValue}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { setQuery(''); setOpen(true) }}
          placeholder={placeholder ?? t('patientCombobox.placeholder')}
          className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-400' : 'border-slate-300'}`}
        />
        {allowClear && selected && !open ? (
          <button
            type="button"
            onClick={() => { onChange(''); setQuery('') }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        )}
      </div>
      {open && (
        <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">{t('patientCombobox.no_results')}</div>
          ) : filtered.map(p => {
            const name = patientName(p)
            const doc = p.idDocument ?? p.id_document
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setQuery(''); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${p.id === value ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
              >
                <div className="font-medium">{name}</div>
                {(doc || p.phone) && <div className="text-xs text-slate-400">{[doc, p.phone].filter(Boolean).join(' · ')}</div>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
