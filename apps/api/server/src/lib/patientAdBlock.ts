import { query, queryOne } from './db'
import { downloadFile } from './r2'

// A clinic linked to a lab partner has its "patient content" advertising
// managed centrally by that lab (clinic_media/clinic_media_settings rows
// have clinic_id NULL and lab_partner_id set instead) — same precedence
// rule as resolveOwner() in routes/media.ts, just keyed by clinic instead
// of by the logged-in user, since sending an email has no session.
async function resolveMediaOwner(clinicId: string): Promise<{ column: 'clinic_id' | 'lab_partner_id'; id: string }> {
  const link = await queryOne<{ lab_partner_id: string }>(
    'SELECT lab_partner_id FROM clinic_lab_partners WHERE clinic_id = $1 ORDER BY assigned_at ASC LIMIT 1',
    [clinicId]
  )
  return link ? { column: 'lab_partner_id', id: link.lab_partner_id } : { column: 'clinic_id', id: clinicId }
}

export interface AdAttachment {
  filename: string
  content: Buffer
  contentType: string
  content_id: string
  disposition: 'inline'
}

export interface PatientAdBlock {
  adHtml: string
  adAttachment: AdAttachment | null
  // Solo escribe en media_impressions si de verdad se incluyó un anuncio —
  // se llama después de un envío satisfactorio, nunca antes.
  logImpression: () => Promise<void>
}

const EMPTY_BLOCK: PatientAdBlock = { adHtml: '', adAttachment: null, logImpression: async () => {} }

// Construye el bloque HTML (+ adjunto de imagen si aplica) con el
// "contenido para paciente" configurado por la clínica o por su
// laboratorio — usado tanto en el email de bienvenida del paciente como en
// el de cada consentimiento generado, para que ambos muestren lo mismo.
export async function buildPatientAdBlock(clinicId: string | null | undefined): Promise<PatientAdBlock> {
  if (!clinicId) return EMPTY_BLOCK

  const mediaOwner = await resolveMediaOwner(clinicId)
  const adCreative = await queryOne<any>(
    `SELECT cm.*, cms.active_creative_id, cms.display_mode
     FROM clinic_media cm
     JOIN clinic_media_settings cms ON cms.${mediaOwner.column} = cm.${mediaOwner.column} AND cms.media_type = 'patient'
     WHERE cm.${mediaOwner.column} = $1
       AND cm.type = 'patient'
       AND (cms.display_mode != 'manual' OR cm.id = cms.active_creative_id)
     ORDER BY cm.order_index
     LIMIT 1`,
    [mediaOwner.id]
  )
  if (!adCreative) return EMPTY_BLOCK

  let adHtml = ''
  let adAttachment: AdAttachment | null = null

  if (adCreative.content_type === 'video/url' && adCreative.source_url) {
    const srcUrl: string = adCreative.source_url
    const ytMatch = srcUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    const vimeoMatch = srcUrl.match(/vimeo\.com\/(\d+)/)

    if (ytMatch) {
      const videoId = ytMatch[1]
      const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      adHtml = `
        <tr><td style="padding:0 40px 24px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
          <a href="${srcUrl}" style="display:block;position:relative;text-decoration:none">
            <img src="${thumb}" alt="Ver vídeo"
                 style="width:100%;border-radius:10px;display:block" />
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
                        width:60px;height:60px;background:rgba(0,0,0,0.65);border-radius:50%;
                        display:flex;align-items:center;justify-content:center">
              <div style="width:0;height:0;border-style:solid;border-width:10px 0 10px 20px;
                          border-color:transparent transparent transparent #ffffff;margin-left:4px"></div>
            </div>
          </a>
        </td></tr>`
    } else if (vimeoMatch) {
      adHtml = `
        <tr><td style="padding:0 40px 24px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
          <a href="${srcUrl}"
             style="display:inline-block;padding:12px 32px;background:#0D1B2E;color:#C9A84C;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;width:100%;box-sizing:border-box;text-align:center">
            ▶ Ver vídeo
          </a>
        </td></tr>`
    } else {
      adHtml = `
        <tr><td style="padding:0 40px 24px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
          <!--[if !mso]><!-->
          <video autoplay muted loop playsinline
                 style="width:100%;border-radius:10px;display:block"
                 src="${srcUrl}">
          </video>
          <!--<![endif]-->
          <!--[if mso]>
          <a href="${srcUrl}"
             style="display:inline-block;padding:12px 32px;background:#0D1B2E;color:#C9A84C;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px">
            ▶ Ver vídeo
          </a>
          <![endif]-->
        </td></tr>`
    }
  } else if (adCreative.r2_key && adCreative.content_type?.startsWith('image/')) {
    try {
      const { buffer, contentType } = await downloadFile(adCreative.r2_key)
      adAttachment = { filename: 'publicidad.jpg', content: buffer, contentType, content_id: 'ad_image', disposition: 'inline' }
      adHtml = `
        <tr><td style="padding:0 40px 24px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;text-align:center">De tu clínica</p>
          <img src="cid:ad_image" alt="De tu clínica"
               style="width:100%;border-radius:10px;display:block" />
        </td></tr>`
    } catch {}
  }

  if (!adHtml) return EMPTY_BLOCK

  const logImpression = async () => {
    await query(
      `INSERT INTO media_impressions (clinic_id, lab_partner_id, media_type, creative_id) VALUES ($1,$2,'patient',$3)`,
      [clinicId, mediaOwner.column === 'lab_partner_id' ? mediaOwner.id : null, adCreative.id]
    ).catch(() => {})
  }

  return { adHtml, adAttachment, logImpression }
}
