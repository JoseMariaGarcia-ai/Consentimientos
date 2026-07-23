import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Plus, Pencil, Save, X, Globe, ChevronDown, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { ConsentEditor } from '@/components/consents/ConsentEditor'
import { SUPPORTED_LANGUAGES } from '@/i18n'
import { useLanguageStore } from '@/store/languageStore'
import { TEMPLATE_CATEGORIES, FAVORITE_CATEGORY } from '@/lib/templateCategories'

interface Template {
  id: string
  treatmentType: string
  category: string
  extraCategories: string[]
  contentJson: Record<string, { title: string; body: string }>
  legalClausesJson: Record<string, unknown>
}

export default function Templates() {
  const { t } = useTranslation()
  const { currentLanguage } = useLanguageStore()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Template | null>(null)
  const [editLang, setEditLang] = useState(currentLanguage)
  const [saving, setSaving] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ title: '', body: '' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get('/consents/templates')
      setTemplates(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!selected) return
    const content = selected.contentJson?.[editLang] ?? selected.contentJson?.['es-ES'] ?? { title: '', body: '' }
    setForm({ title: content.title ?? '', body: content.body ?? '' })
  }, [selected, editLang])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return templates.filter(t => t.treatmentType.toLowerCase().includes(q))
  }, [templates, search])

  const grouped = useMemo(() => {
    const byCategory = new Map<string, Template[]>()
    for (const cat of TEMPLATE_CATEGORIES) byCategory.set(cat, [])
    for (const tmpl of filtered) {
      const cats = [tmpl.category ?? 'medicina_estetica', ...(tmpl.extraCategories ?? [])]
      for (const cat of cats) {
        if (!byCategory.has(cat)) byCategory.set(cat, [])
        byCategory.get(cat)!.push(tmpl)
      }
    }
    const rest = [...byCategory.entries()].filter(([cat, items]) => cat !== FAVORITE_CATEGORY && items.length > 0)
    const favorites = byCategory.get(FAVORITE_CATEGORY) ?? []
    return favorites.length > 0 ? [[FAVORITE_CATEGORY, favorites] as const, ...rest] : rest
  }, [filtered])

  const toggleFavorite = async (tmpl: Template) => {
    const isFavorite = (tmpl.extraCategories ?? []).includes(FAVORITE_CATEGORY)
    const extraCategories = isFavorite
      ? (tmpl.extraCategories ?? []).filter(c => c !== FAVORITE_CATEGORY)
      : [...(tmpl.extraCategories ?? []), FAVORITE_CATEGORY]
    const updated = { ...tmpl, extraCategories }
    setTemplates(ts => ts.map(t => t.id === tmpl.id ? updated : t))
    setSelected(s => s?.id === tmpl.id ? updated : s)
    try {
      await api.put(`/consents/templates/${tmpl.id}`, updated)
    } catch {
      // Si falla el guardado, se revierte el marcador optimista.
      setTemplates(ts => ts.map(t => t.id === tmpl.id ? tmpl : t))
      setSelected(s => s?.id === tmpl.id ? tmpl : s)
    }
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    const updated = {
      ...selected,
      contentJson: {
        ...selected.contentJson,
        [editLang]: form,
      },
    }
    await api.put(`/consents/templates/${selected.id}`, updated)
    setTemplates(ts => ts.map(t => t.id === selected.id ? updated : t))
    setSelected(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSaving(false)
  }

  const handleTranslate = async () => {
    if (!selected) return
    setTranslating(true)
    try {
      const result = await api.post('/translate', {
        templateId: selected.id,
        spanishTitle: selected.contentJson?.['es-ES']?.title ?? form.title,
        spanishBody: selected.contentJson?.['es-ES']?.body ?? form.body,
        treatmentType: selected.treatmentType,
      })
      if (result.contentJson) {
        const updated = { ...selected, contentJson: result.contentJson, legalClausesJson: result.legalClausesJson ?? selected.legalClausesJson }
        setTemplates(ts => ts.map(t => t.id === selected.id ? updated : t))
        setSelected(updated)
        const content = result.contentJson[editLang] ?? result.contentJson['es-ES']
        if (content) setForm({ title: content.title, body: content.body })
      }
    } finally {
      setTranslating(false)
    }
  }

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === editLang)

  return (
    <div className="flex flex-col md:flex-row gap-6 md:h-full">
      {/* Left panel — template list */}
      <div className="w-full md:w-72 flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">{t('templates.title')}</h1>
          <span className="text-xs text-slate-400">{templates.length}</span>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('templates.search')}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto">
          {loading ? (
            <div className="text-center text-slate-400 text-sm py-8">{t('common.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-8">{t('templates.empty')}</div>
          ) : (
            grouped.map(([category, items]) => (
              <div key={category} className="flex flex-col gap-1">
                <p className="px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  {t(`templates.categories.${category}`)} <span className="text-slate-300">({items.length})</span>
                </p>
                {items.map(tmpl => {
                  const hasLang = !!tmpl.contentJson?.[currentLanguage]?.body
                  const isFavorite = (tmpl.extraCategories ?? []).includes(FAVORITE_CATEGORY)
                  return (
                    <div
                      key={tmpl.id}
                      className={`flex items-center gap-1 rounded-xl border transition-colors ${
                        selected?.id === tmpl.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        onClick={() => setSelected(tmpl)}
                        className={`flex-1 min-w-0 text-left px-3 py-2.5 ${selected?.id === tmpl.id ? 'text-blue-700' : 'text-slate-700'}`}
                      >
                        <p className="text-sm font-medium truncate">{tmpl.treatmentType}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {hasLang ? `✓ ${currentLanguage}` : `⚠ ${t('templates.no_translation')} ${currentLanguage}`}
                        </p>
                      </button>
                      <button
                        onClick={() => toggleFavorite(tmpl)}
                        title={(isFavorite ? t('templates.unmark_favorite') : t('templates.mark_favorite')) as string}
                        className={`flex-shrink-0 p-2 mr-1 rounded-lg ${isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-400'}`}
                      >
                        <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel — editor */}
      {selected ? (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{selected.treatmentType}</h2>
              <p className="text-xs text-slate-400">{t('templates.editor_title')}</p>
            </div>
            <div className="md:ml-auto flex items-center gap-2 flex-wrap">
              {/* Category picker */}
              <div className="relative">
                <select
                  value={selected.category ?? 'medicina_estetica'}
                  onChange={e => setSelected(s => s ? { ...s, category: e.target.value } : s)}
                  className="appearance-none pl-3 pr-8 py-1.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{t(`templates.categories.${cat}`)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              {/* Language picker */}
              <div className="relative">
                <select
                  value={editLang}
                  onChange={e => setEditLang(e.target.value)}
                  className="appearance-none pl-8 pr-8 py-1.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
                  ))}
                </select>
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              </div>

              <button
                onClick={handleTranslate}
                disabled={translating}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                <Globe className="w-3.5 h-3.5" />
                {translating ? t('templates.translating') : t('templates.translate_all')}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? t('common.saving') : t('common.save')}
              </button>

              {saved && <span className="text-xs text-emerald-600 font-medium">✓ {t('common.saved')}</span>}

              <button onClick={() => setSelected(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('templates.consent_title_label')} — {currentLang?.flag ?? ''} {currentLang?.name ?? ''}
            </label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={t('templates.title_placeholder')}
              className="px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* WYSIWYG Body */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {t('templates.content_label')}
            </label>
            <ConsentEditor
              key={`${selected.id}-${editLang}`}
              content={form.body}
              onChange={body => setForm(f => ({ ...f, body }))}
              placeholder={t('templates.content_placeholder')}
            />
          </div>

          {/* Legal clauses summary */}
          {!!selected.legalClausesJson?.[editLang] && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('templates.legal_framework')} — {currentLang?.name}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600">
                {Object.entries(selected.legalClausesJson[editLang] as Record<string, unknown>)
                  .filter(([k]) => ['jurisdiction','applicableLaw','minAge','witnessRequired','retentionYears'].includes(k))
                  .map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0 capitalize">{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      <span className="font-medium">{v != null ? String(v as string | number | boolean) : '—'}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-3">
          <Plus className="w-12 h-12 opacity-20" />
          <p className="text-sm">{t('templates.select_template')}</p>
        </div>
      )}
    </div>
  )
}
