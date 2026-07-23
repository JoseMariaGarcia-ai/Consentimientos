import cron from 'node-cron'
import { runFullBackup, runAllClinicBackups, pruneOldBackups } from './backupService'

// "3:00 AM UTC diario" (spec de la sección Backups) — node-cron con
// timezone explícito 'UTC' en vez de fiarse de la hora del servidor
// (Railway despliega en distintas regiones según el momento).
export function startBackupScheduler() {
  cron.schedule('0 3 * * *', async () => {
    try {
      await runFullBackup(null)
      await runAllClinicBackups()
      await pruneOldBackups()
    } catch (err: any) {
      console.error('[backupScheduler] fallo en el backup automático de las 3:00 AM UTC:', err.message)
    }
  }, { timezone: 'UTC' })
}
