import { useTranslation } from 'react-i18next'
import { Eye, X } from 'lucide-react'

export function PreviewBanner({ role, onExit }: { role: string; onExit: () => void }) {
  const { t } = useTranslation()
  const roleLabels: Record<string, string> = {
    patient: t('previewBanner.roles.patient'),
    clinica: t('previewBanner.roles.clinica'),
    lab_partner: t('previewBanner.roles.labPartner'),
  }
  return (
    <div className="sticky top-0 z-[200] bg-amber-400 text-amber-950 px-4 py-2 flex items-center justify-center gap-3 text-sm font-medium shadow-md">
      <Eye className="w-4 h-4 flex-shrink-0" />
      <span>
        {t('previewBanner.message')} <strong>{roleLabels[role] ?? role}</strong>
      </span>
      <button
        onClick={onExit}
        className="ml-2 flex items-center gap-1 px-2.5 py-1 bg-amber-950 text-amber-50 rounded-lg text-xs font-semibold hover:bg-amber-900 transition-colors flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
        {t('previewBanner.exitButton')}
      </button>
    </div>
  )
}
