import { query, queryOne } from './db'
import { getProviderBalances } from './providerBalances'
import { notifyTeamLowProviderBalance } from './providerBalanceAlertEmail'

// B.3 del documento de ampliación: alarma de salvaguarda interna (nunca
// visible para las clínicas) cuando el saldo real de ConsentsPro en un
// proveedor baja del umbral configurable (system_settings.
// provider_balance_alert_threshold_usd, migración 061). Solo YCloud tiene
// API de saldo real hoy (ver providerBalances.ts) — Anthropic y Retell
// quedan fuera de esta comprobación automática hasta que publiquen una.
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000 // cada 6 horas
const ALERTED_KEY = 'provider_balance_ycloud_alerted_at'

async function runCheck() {
  try {
    const thresholdRow = await queryOne<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = 'provider_balance_alert_threshold_usd'"
    )
    const threshold = Number(thresholdRow?.value ?? 50)

    const [balances] = await Promise.all([getProviderBalances(true)])
    const ycloud = balances.find(b => b.provider === 'ycloud')
    if (!ycloud || ycloud.amount === null) return

    const alertedRow = await queryOne<{ value: string }>(`SELECT value FROM system_settings WHERE key = '${ALERTED_KEY}'`)
    const alreadyAlerted = !!alertedRow?.value

    if (ycloud.amount < threshold) {
      if (!alreadyAlerted) {
        await notifyTeamLowProviderBalance('YCloud', ycloud.amount, ycloud.currency ?? '?', threshold)
        await query(
          `INSERT INTO system_settings (key, value) VALUES ($1, NOW()::text) ON CONFLICT (key) DO UPDATE SET value = NOW()::text`,
          [ALERTED_KEY]
        )
      }
    } else if (alreadyAlerted) {
      // El saldo volvió a estar por encima del umbral — se permite alertar de nuevo si vuelve a bajar.
      await query(`DELETE FROM system_settings WHERE key = $1`, [ALERTED_KEY])
    }
  } catch (err: any) {
    console.error('[providerBalanceScheduler] fallo comprobando saldo de proveedores:', err.message)
  }
}

export function startProviderBalanceScheduler() {
  runCheck()
  setInterval(runCheck, CHECK_INTERVAL_MS)
}
