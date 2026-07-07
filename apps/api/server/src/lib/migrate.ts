import fs from 'fs'
import path from 'path'
import { pool } from './db'

// Applies every not-yet-applied file in migrations/, in filename order,
// tracked in schema_migrations. All migrations in this repo are written
// idempotently (CREATE TABLE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
// etc.), so replaying already-applied ones on the very first run (before
// schema_migrations has any rows) is safe — it just reconciles the
// tracking table with whatever was previously applied by hand.
//
// This directory lives inside apps/api/server (not at the repo root) so it
// is included in the Docker build context Railway uses for this service —
// that build only ever sees apps/api/server, never the rest of the monorepo.
function migrationsDir(): string {
  // __dirname is apps/api/server/{src,dist}/lib — 2 levels up reaches apps/api/server.
  return path.resolve(__dirname, '../../migrations')
}

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const dir = migrationsDir()
  if (!fs.existsSync(dir)) {
    console.warn(`[migrate] migrations directory not found (${dir}) — skipping`)
    return
  }

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()
  const { rows: applied } = await pool.query('SELECT filename FROM schema_migrations')
  const appliedSet = new Set(applied.map((r: any) => r.filename))

  // One bad/incompatible migration (e.g. something that doesn't quite match
  // production's real history) must not block every migration after it
  // forever — apply each independently and keep going on failure, so newer
  // migrations still land even if an older one needs manual attention.
  const failed: string[] = []
  for (const file of files) {
    if (appliedSet.has(file)) continue
    try {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8')
      console.log(`[migrate] applying ${file}...`)
      await pool.query(sql)
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [file])
      console.log(`[migrate] applied ${file}`)
    } catch (err: any) {
      failed.push(file)
      console.error(`[migrate] FAILED to apply ${file} — continuing with remaining migrations:`, err.message ?? err)
    }
  }
  if (failed.length) {
    console.error(`[migrate] ${failed.length} migration(s) failed and were skipped: ${failed.join(', ')} — fix and redeploy to retry them`)
  }
}
