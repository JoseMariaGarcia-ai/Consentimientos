import { queryOne, query } from './db'
import { getSharedYCloudKey, sendViaYCloud } from './whatsappSend'

const ALERT_PHONE = process.env.BACKUP_ALERT_PHONE?.trim() || '34629541073'

export async function notifyBackupFailed(scope: string, errorDetail: string): Promise<void> {
  try {
    const apiKey = await getSharedYCloudKey()
    if (!apiKey) {
      console.error('[backupAlerts] no se pudo avisar del fallo de backup: falta la clave compartida de YCloud')
      return
    }
    const fecha = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Madrid' })
    const body = `❌ ERROR backup ConsentsPro: ${fecha} — backup ${scope} falló: ${errorDetail}`.slice(0, 900)

    let convo = await queryOne<{ id: string }>(
      'SELECT id FROM whatsapp_conversations WHERE clinic_id IS NULL AND phone = $1', [ALERT_PHONE]
    )
    if (!convo) {
      convo = await queryOne<{ id: string }>(
        `INSERT INTO whatsapp_conversations (clinic_id, phone, source) VALUES (NULL,$1,'admin_directo') RETURNING id`,
        [ALERT_PHONE]
      )
    }
    await sendViaYCloud(apiKey, null, convo!.id, ALERT_PHONE, body, 'admin')
  } catch (err: any) {
    console.error('[backupAlerts] fallo enviando la alerta de backup por WhatsApp:', err.message)
  }
}
