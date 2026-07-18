import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Hash, Plus, Pencil, Lock, X } from 'lucide-react'
import { api } from '@/lib/api'

interface SeriesRow {
  series: string
  next_number: number
  invoice_count: string | number
  updated_at: string
}

function SeriesModal({ initial, onSave, onClose }: { initial?: SeriesRow; onSave: (series: string, nextNumber: number) => Promise<void>; onClose: () => void }) {
  const { t } = useTranslation()
  const [series, setSeries] = useState(initial?.series ?? '')
  const [nextNumber, setNextNumber] = useState(String(initial?.next_number ?? 1))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedSeries = series.trim().toUpperCase().slice(0, 10)
    const n = Number(nextNumber)
    if (!trimmedSeries) { setError(t('invoiceSeriesConfig.errors.seriesRequired')); return }
    if (!Number.isInteger(n) || n < 1) { setError(t('invoiceSeriesConfig.errors.invalidNumber')); return }
    setSaving(true)
    setError('')
    try {
      await onSave(trimmedSeries, n)
      onClose()
    } catch (err: any) {
      setError(err.message ?? t('invoiceSeriesConfig.errors.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Hash className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {initial ? t('invoiceSeriesConfig.editTitle') : t('invoiceSeriesConfig.newTitle')}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <p className="text-xs text-slate-500">{t('invoiceSeriesConfig.helpText')}</p>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceSeriesConfig.form.series')}</label>
            <input
              value={series}
              onChange={e => setSeries(e.target.value.toUpperCase().slice(0, 10))}
              disabled={!!initial}
              placeholder="A"
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">{t('invoiceSeriesConfig.form.nextNumber')}</label>
            <input
              type="number"
              min={1}
              step={1}
              value={nextNumber}
              onChange={e => setNextNumber(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400">{t('invoiceSeriesConfig.form.nextNumberHint')}</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function InvoiceSeriesConfig() {
  const { t } = useTranslation()
  const [rows, setRows] = useState<SeriesRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ open: boolean; initial?: SeriesRow }>({ open: false })
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.get('/invoices/series')
      setRows(Array.isArray(data) ? data : [])
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (series: string, nextNumber: number) => {
    setError('')
    try {
      await api.put(`/invoices/series/${series}`, { next_number: nextNumber })
      await load()
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500 max-w-xl">{t('invoiceSeriesConfig.intro')}</p>
        <button
          onClick={() => setModal({ open: true })}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 shadow-sm flex-shrink-0"
        >
          <Plus className="w-4 h-4" />{t('invoiceSeriesConfig.newSeries')}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">{t('common.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3">
            <Hash className="w-10 h-10 opacity-20" />
            <p>{t('invoiceSeriesConfig.noResults')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3 font-semibold">{t('invoiceSeriesConfig.colSeries')}</th>
                  <th className="px-4 py-3 font-semibold">{t('invoiceSeriesConfig.colNextNumber')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('invoiceSeriesConfig.colInvoiceCount')}</th>
                  <th className="px-4 py-3 font-semibold">{t('invoiceSeriesConfig.colUpdatedAt')}</th>
                  <th className="px-4 py-3 font-semibold text-right">{t('invoiceSeriesConfig.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rows.map(r => {
                  const locked = Number(r.invoice_count) > 0
                  return (
                    <tr key={r.series} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{r.series}</td>
                      <td className="px-4 py-3 text-slate-600">{r.series}-{String(r.next_number).padStart(4, '0')}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{r.invoice_count}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{fmtDate(r.updated_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {locked ? (
                            <span title={t('invoiceSeriesConfig.lockedHint')} className="p-1.5 text-slate-300">
                              <Lock className="w-4 h-4" />
                            </span>
                          ) : (
                            <button onClick={() => setModal({ open: true, initial: r })} className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal.open && (
        <SeriesModal
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal({ open: false })}
        />
      )}
    </div>
  )
}
