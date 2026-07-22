import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { useWelcomeMedia } from '@/context/WelcomeMediaContext'
import { getEmbedUrl } from '@/lib/mediaCreative'

interface Campaign {
  id: string
  name: string
  creative_type: 'image' | 'video' | 'url' | 'offer' | 'training'
  creatives: { url: string }[]
  rotation_mode: 'random' | 'manual'
  trigger_rule: 'on_login' | 'on_consent' | 'every_x_minutes' | 'once_daily'
  trigger_interval_minutes: number | null
}

const SS_LOGIN_SHOWN   = 'lab_campaign_on_login_shown'
const LS_LAST_DAILY    = 'lab_campaign_last_daily'
const LS_SEQ_INDEX     = 'lab_campaign_seq_index'

// Entre varias campañas elegibles a la vez, 'manual' significa orden fijo
// de creación (se cicla una por cada disparo), 'random' una al azar — si
// hay alguna en modo manual entre las elegibles, ese orden fijo manda
// sobre las aleatorias para no mezclar dos criterios a la vez.
function pickCampaign(list: Campaign[]): Campaign | null {
  if (list.length === 0) return null
  if (list.length === 1) return list[0]
  const useManual = list.some(c => c.rotation_mode === 'manual')
  if (useManual) {
    const idx = parseInt(localStorage.getItem(LS_SEQ_INDEX) ?? '0')
    localStorage.setItem(LS_SEQ_INDEX, String(idx + 1))
    return list[idx % list.length]
  }
  return list[Math.floor(Math.random() * list.length)]
}

async function fetchActiveCampaigns(): Promise<Campaign[]> {
  try { return await api.get('/lab-partners/campaigns/active') } catch { return [] }
}

function CampaignViewer({ campaign, onClose, altText, openLabel }: { campaign: Campaign; onClose: () => void; altText: string; openLabel: string }) {
  const url = campaign.creatives?.[0]?.url
  const embed = campaign.creative_type === 'video' || campaign.creative_type === 'url' ? (url ? getEmbedUrl(url) : null) : null
  const isDirectImage = campaign.creative_type === 'image' && !!url
  const isDirectVideo = campaign.creative_type === 'video' && !!url && !embed
  const isEmbeddable  = !!embed

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex items-center justify-center w-9 h-9 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isDirectImage && <img src={url} alt={altText} className="w-full max-h-[70vh] object-contain bg-black" />}
        {isDirectVideo && <video src={url} autoPlay controls playsInline className="w-full max-h-[70vh] object-contain bg-black" />}
        {isEmbeddable && (
          <iframe src={embed!} className="w-full" style={{ height: 'min(60vh, 420px)' }} frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={campaign.name} />
        )}

        <div className="p-5 flex flex-col gap-3">
          <p className="text-sm font-bold text-slate-800">{campaign.name}</p>
          {!isDirectImage && !isDirectVideo && !isEmbeddable && url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl text-center transition-colors"
            >
              {openLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// Entrega a la clínica las campañas activas del laboratorio al que está
// vinculada (nunca las de otro laboratorio — el aislamiento lo garantiza
// el backend en GET /lab-partners/campaigns/active). Antes esta pantalla
// solo servía para gestionar/crear campañas: no existía ningún mecanismo
// que las mostrara de verdad a la clínica.
export function CampaignModal() {
  const { t } = useTranslation()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const { registerTrigger } = useWelcomeMedia()
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const show = useCallback((c: Campaign) => {
    setCampaign(c)
    api.post(`/lab-partners/campaigns/${c.id}/impression`, {}).catch(() => {})
  }, [])

  useEffect(() => {
    fetchActiveCampaigns().then(all => {
      if (!sessionStorage.getItem(SS_LOGIN_SHOWN)) {
        const pick = pickCampaign(all.filter(c => c.trigger_rule === 'on_login'))
        if (pick) { show(pick); sessionStorage.setItem(SS_LOGIN_SHOWN, '1') }
      }

      const todayStr = new Date().toISOString().slice(0, 10)
      if (localStorage.getItem(LS_LAST_DAILY) !== todayStr) {
        const pick = pickCampaign(all.filter(c => c.trigger_rule === 'once_daily'))
        if (pick) { show(pick); localStorage.setItem(LS_LAST_DAILY, todayStr) }
      }

      const intervalCampaigns = all.filter(c => c.trigger_rule === 'every_x_minutes')
      if (intervalCampaigns.length > 0) {
        const minutes = Math.min(...intervalCampaigns.map(c => Math.max(1, c.trigger_interval_minutes ?? 60)))
        intervalRef.current = setInterval(async () => {
          const fresh = (await fetchActiveCampaigns()).filter(c => c.trigger_rule === 'every_x_minutes')
          const pick = pickCampaign(fresh)
          if (pick) show(pick)
        }, minutes * 60 * 1000)
      }
    })

    const unregister = registerTrigger(async event => {
      if (event !== 'consent' && event !== 'clinical') return
      const fresh = (await fetchActiveCampaigns()).filter(c => c.trigger_rule === 'on_consent')
      const pick = pickCampaign(fresh)
      if (pick) show(pick)
    })

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      unregister()
    }
  }, [])

  if (!campaign) return null
  return <CampaignViewer campaign={campaign} onClose={() => setCampaign(null)} altText={campaign.name} openLabel={t('campaignModal.open')} />
}
