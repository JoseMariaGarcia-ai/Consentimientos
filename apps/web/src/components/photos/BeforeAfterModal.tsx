import { useState } from 'react'
import { X, ArrowLeftRight, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Photo {
  id: string
  url: string
  original_name: string
  created_at: string
}

interface BeforeAfterModalProps {
  photos: Photo[]
  onClose: () => void
}

export function BeforeAfterModal({ photos, onClose }: BeforeAfterModalProps) {
  const { t } = useTranslation()
  const [before, setBefore] = useState<Photo | null>(null)
  const [after, setAfter]   = useState<Photo | null>(null)
  const [step, setStep]     = useState<'pick' | 'compare'>('pick')

  const toggle = (photo: Photo, slot: 'before' | 'after') => {
    if (slot === 'before') setBefore(p => p?.id === photo.id ? null : photo)
    else setAfter(p => p?.id === photo.id ? null : photo)
  }

  const ready = before && after && before.id !== after.id

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-violet-600" />
            <h2 className="text-lg font-bold text-slate-800">
              {step === 'pick' ? t('beforeAfterModal.select_title') : t('beforeAfterModal.compare_title')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {step === 'compare' && (
              <button onClick={() => setStep('pick')} className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 border border-slate-200 rounded-lg">
                {t('beforeAfterModal.change_selection')}
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step: pick */}
        {step === 'pick' && (
          <div className="flex flex-col gap-4 p-6 overflow-y-auto flex-1">
            <p className="text-sm text-slate-500">{t('beforeAfterModal.select_intro')} <span className="font-semibold text-blue-600">{t('beforeAfterModal.before')}</span> {t('beforeAfterModal.select_middle')} <span className="font-semibold text-emerald-600">{t('beforeAfterModal.after')}</span>.</p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {photos.map(photo => {
                const isBefore = before?.id === photo.id
                const isAfter  = after?.id  === photo.id
                return (
                  <div key={photo.id} className="relative group flex flex-col gap-1">
                    <div
                      className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                        isBefore ? 'border-blue-500 shadow-blue-200 shadow-md' :
                        isAfter  ? 'border-emerald-500 shadow-emerald-200 shadow-md' :
                        'border-transparent hover:border-slate-300'
                      }`}
                      style={{ aspectRatio: '1' }}
                    >
                      <img src={photo.url} alt={photo.original_name} className="w-full h-full object-cover" />
                      {(isBefore || isAfter) && (
                        <div className={`absolute inset-0 flex items-end justify-center pb-2 ${isBefore ? 'bg-blue-500/20' : 'bg-emerald-500/20'}`}>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${isBefore ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            {isBefore ? t('beforeAfterModal.before_badge') : t('beforeAfterModal.after_badge')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggle(photo, 'before')}
                        className={`flex-1 text-[10px] font-semibold py-1 rounded-lg transition-colors ${isBefore ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600'}`}
                      >
                        {t('beforeAfterModal.before')}
                      </button>
                      <button
                        onClick={() => toggle(photo, 'after')}
                        className={`flex-1 text-[10px] font-semibold py-1 rounded-lg transition-colors ${isAfter ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
                      >
                        {t('beforeAfterModal.after')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                disabled={!ready}
                onClick={() => setStep('compare')}
                className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ArrowLeftRight className="w-4 h-4" />
                {t('beforeAfterModal.compare_button')}
              </button>
            </div>
          </div>
        )}

        {/* Step: compare */}
        {step === 'compare' && before && after && (
          <div className="flex flex-1 overflow-hidden">
            {/* Before */}
            <div className="flex-1 flex flex-col bg-blue-50 border-r border-slate-200">
              <div className="px-4 py-2 bg-blue-600 text-white text-center text-sm font-bold tracking-wide">
                {t('beforeAfterModal.before_badge')}
              </div>
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <img src={before.url} alt={t('beforeAfterModal.before')} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
              </div>
              <p className="text-center text-xs text-slate-400 px-4 py-2 truncate">{before.original_name}</p>
            </div>

            {/* After */}
            <div className="flex-1 flex flex-col bg-emerald-50">
              <div className="px-4 py-2 bg-emerald-600 text-white text-center text-sm font-bold tracking-wide">
                {t('beforeAfterModal.after_badge')}
              </div>
              <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <img src={after.url} alt={t('beforeAfterModal.after')} className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
              </div>
              <p className="text-center text-xs text-slate-400 px-4 py-2 truncate">{after.original_name}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
