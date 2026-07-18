import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus, Pencil, Trash2, Search, Ban } from 'lucide-react'
import { api } from '@/lib/api'
import { BillingClientModal } from './BillingClientModal'

interface Props {
  onViewInvoices: (client: any) => void
}

export function BillingClientsList({ onViewInvoices }: Props) {
  const { t } = useTranslation()
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState<{ open: boolean; initial?: any }>({ open: false })
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ include_inactive: '1' })
      if (q) params.set('q', q)
      const data = await api.get(`/billing-clients?${params.toString()}`)
      setClients(Array.isArray(data) ? data : [])
    } catch {
      setClients([])
    } finally {
      setLoading(false)
    }
  }, [q])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: any) => {
    if (modal.initial?.id) await api.put(`/billing-clients/${modal.initial.id}`, data)
    else await api.post('/billing-clients', data)
    await load()
  }

  const handleDelete = async (client: any) => {
    if (!confirm(t('billingClientsList.confirmDelete'))) return
    setError('')
    try {
      await api.delete(`/billing-clients/${client.id}`)
      await load()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('billingClientsList.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />{t('billingClientsList.newClient')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Users className="w-10 h-10 opacity-20" />
            <p>{t('billingClientsList.noResults')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">{t('billingClientsList.colName')}</th>
                  <th className="px-4 py-3 font-semibold">{t('billingClientsList.colTaxId')}</th>
                  <th className="px-4 py-3 font-semibold">{t('billingClientsList.colEmail')}</th>
                  <th className="px-4 py-3 font-semibold">{t('billingClientsList.colPhone')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('billingClientsList.colInvoices')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('billingClientsList.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {clients.map(c => (
                  <tr key={c.id} className={`hover:bg-slate-50 ${!c.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {c.full_name}
                      {!c.is_active && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500">
                          <Ban className="w-3 h-3" />{t('billingClientsList.inactive')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{c.tax_id}</td>
                    <td className="px-4 py-3 text-slate-600">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.phone || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onViewInvoices(c)}
                        className="text-emerald-700 font-medium hover:underline"
                        disabled={Number(c.invoice_count) === 0}
                      >
                        {c.invoice_count}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal({ open: true, initial: c })} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <BillingClientModal
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
