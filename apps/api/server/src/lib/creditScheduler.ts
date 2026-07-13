import { runCreditIntegrityCheck } from './creditIntegrityJob'

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000 // diaria

async function runSweep() {
  try {
    const { checked, mismatches } = await runCreditIntegrityCheck()
    if (mismatches > 0) {
      console.error(`[creditScheduler] verificación de integridad: ${mismatches}/${checked} clínicas con discrepancias`)
    }
  } catch (err: any) {
    console.error('[creditScheduler] verificación de integridad falló:', err.message)
  }
}

export function startCreditScheduler() {
  runSweep()
  setInterval(runSweep, CHECK_INTERVAL_MS)
}
