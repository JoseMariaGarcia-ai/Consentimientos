import { Router } from 'express'
import { query, queryOne } from '../lib/db'
import { parseUserAgent } from '../lib/uaParser'
import { verifyToken } from '../lib/jwt'

// Two separate routers: pageview ingestion must stay public (it tracks
// anonymous landing-page visitors), while the aggregated summary is
// superadmin-only and mounted behind authMiddleware + requireSuperAdmin.
const publicRouter = Router()
const router = Router()

// Best-effort: an authenticated user tracked from the app carries a Bearer
// token, but this endpoint must also work for anonymous landing-page
// visitors, so an invalid/missing token is never an error here.
function resolveIdentity(req: any): { userId: string | null; clinicId: string | null; role: string | null } {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return { userId: null, clinicId: null, role: null }
  try {
    const payload = verifyToken(token)
    return { userId: payload.userId ?? null, clinicId: payload.clinicId ?? null, role: payload.role ?? null }
  } catch {
    return { userId: null, clinicId: null, role: null }
  }
}

// POST /api/analytics/pageview — public. Registers a pageview and upserts
// the owning session. Returns the pageview id so the client can later
// PATCH it with how long the visitor stayed on that page.
publicRouter.post('/pageview', async (req, res) => {
  const { session_key, path, title, referrer } = req.body
  if (!session_key || !path) return res.status(400).json({ error: 'session_key y path son obligatorios' })
  try {
    const ua = req.headers['user-agent'] as string | undefined
    const { device_type, browser, os } = parseUserAgent(ua)
    const { userId, clinicId, role } = resolveIdentity(req)

    // INSERT ... ON CONFLICT en una sola sentencia atómica — la versión
    // anterior hacía SELECT y luego INSERT/UPDATE por separado, lo que
    // dejaba una ventana de carrera: si dos pageviews de una sesión nueva
    // llegaban casi a la vez (dos pestañas, doble disparo del hook de
    // tracking...) ambas veían "no existe" y la segunda INSERT violaba la
    // restricción UNIQUE de session_key, tumbando esa petición con 500.
    await query(
      `INSERT INTO analytics_sessions (session_key, user_id, clinic_id, role, device_type, browser, os, referrer, landing_path, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (session_key) DO UPDATE SET
         last_seen = NOW(),
         user_id = COALESCE(EXCLUDED.user_id, analytics_sessions.user_id),
         clinic_id = COALESCE(EXCLUDED.clinic_id, analytics_sessions.clinic_id),
         role = COALESCE(EXCLUDED.role, analytics_sessions.role)`,
      [session_key, userId, clinicId, role, device_type, browser, os, referrer ?? null, path, ua ?? null]
    )

    const row = await queryOne<{ id: string }>(
      `INSERT INTO analytics_pageviews (session_key, path, title, referrer) VALUES ($1,$2,$3,$4) RETURNING id`,
      [session_key, path, title ?? null, referrer ?? null]
    )
    return res.status(201).json({ id: row?.id })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// POST /api/analytics/pageview/:id/duration — public. Called via
// navigator.sendBeacon when the visitor navigates away or closes the tab
// (sendBeacon only supports POST), to record time-on-page.
publicRouter.post('/pageview/:id/duration', async (req, res) => {
  const { duration_ms } = req.body
  if (typeof duration_ms !== 'number' || duration_ms < 0) return res.status(400).json({ error: 'duration_ms inválido' })
  try {
    // Clamp absurd values (e.g. a tab left open for days) so they can't skew averages.
    const clamped = Math.min(duration_ms, 30 * 60 * 1000)
    await query('UPDATE analytics_pageviews SET duration_ms = $1 WHERE id = $2', [clamped, req.params.id])
    return res.json({ ok: true })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

// GET /api/analytics/summary?from&to — superadmin only. Aggregated stats
// for the requested date range (defaults to the last 30 days).
router.get('/summary', async (req, res) => {
  try {
    const to = req.query.to ? new Date(req.query.to as string) : new Date()
    const from = req.query.from ? new Date(req.query.from as string) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [totals] = await query<{ pageviews: string; sessions: string; avg_duration: string | null }>(
      `SELECT COUNT(*) AS pageviews,
              COUNT(DISTINCT session_key) AS sessions,
              AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) AS avg_duration
       FROM analytics_pageviews WHERE created_at BETWEEN $1 AND $2`,
      [from.toISOString(), to.toISOString()]
    )

    const bounceRow = await queryOne<{ bounced: string; total_sessions: string }>(
      `WITH counts AS (
         SELECT session_key, COUNT(*) AS n FROM analytics_pageviews
         WHERE created_at BETWEEN $1 AND $2 GROUP BY session_key
       )
       SELECT COUNT(*) FILTER (WHERE n = 1) AS bounced, COUNT(*) AS total_sessions FROM counts`,
      [from.toISOString(), to.toISOString()]
    )

    const daily = await query<{ day: string; pageviews: string; sessions: string }>(
      `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day,
              COUNT(*) AS pageviews, COUNT(DISTINCT session_key) AS sessions
       FROM analytics_pageviews WHERE created_at BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY 1`,
      [from.toISOString(), to.toISOString()]
    )

    const topPaths = await query<{ path: string; pageviews: string; avg_duration: string | null }>(
      `SELECT path, COUNT(*) AS pageviews, AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL) AS avg_duration
       FROM analytics_pageviews WHERE created_at BETWEEN $1 AND $2
       GROUP BY path ORDER BY pageviews DESC LIMIT 15`,
      [from.toISOString(), to.toISOString()]
    )

    const topReferrers = await query<{ referrer: string; count: string }>(
      `SELECT COALESCE(NULLIF(referrer, ''), '(directo)') AS referrer, COUNT(*) AS count
       FROM analytics_pageviews WHERE created_at BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY count DESC LIMIT 10`,
      [from.toISOString(), to.toISOString()]
    )

    const devices = await query<{ device_type: string; count: string }>(
      `SELECT s.device_type, COUNT(*) AS count
       FROM analytics_pageviews p JOIN analytics_sessions s ON s.session_key = p.session_key
       WHERE p.created_at BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY count DESC`,
      [from.toISOString(), to.toISOString()]
    )

    const browsers = await query<{ browser: string; count: string }>(
      `SELECT s.browser, COUNT(*) AS count
       FROM analytics_pageviews p JOIN analytics_sessions s ON s.session_key = p.session_key
       WHERE p.created_at BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY count DESC`,
      [from.toISOString(), to.toISOString()]
    )

    const os = await query<{ os: string; count: string }>(
      `SELECT s.os, COUNT(*) AS count
       FROM analytics_pageviews p JOIN analytics_sessions s ON s.session_key = p.session_key
       WHERE p.created_at BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY count DESC`,
      [from.toISOString(), to.toISOString()]
    )

    const roles = await query<{ role: string; count: string }>(
      `SELECT COALESCE(NULLIF(s.role, ''), 'anónimo') AS role, COUNT(DISTINCT p.session_key) AS count
       FROM analytics_pageviews p JOIN analytics_sessions s ON s.session_key = p.session_key
       WHERE p.created_at BETWEEN $1 AND $2
       GROUP BY 1 ORDER BY count DESC`,
      [from.toISOString(), to.toISOString()]
    )

    const newSessionsRow = await queryOne<{ new_sessions: string }>(
      `SELECT COUNT(*) AS new_sessions FROM analytics_sessions WHERE first_seen BETWEEN $1 AND $2`,
      [from.toISOString(), to.toISOString()]
    )

    const totalSessions = parseInt(totals?.sessions ?? '0')
    const bounced = parseInt(bounceRow?.bounced ?? '0')

    return res.json({
      range: { from: from.toISOString(), to: to.toISOString() },
      totals: {
        pageviews: parseInt(totals?.pageviews ?? '0'),
        sessions: totalSessions,
        new_sessions: parseInt(newSessionsRow?.new_sessions ?? '0'),
        avg_duration_ms: totals?.avg_duration ? Math.round(parseFloat(totals.avg_duration)) : null,
        bounce_rate: totalSessions > 0 ? Math.round((bounced / totalSessions) * 1000) / 10 : null,
      },
      daily: daily.map(d => ({ day: d.day, pageviews: parseInt(d.pageviews), sessions: parseInt(d.sessions) })),
      top_paths: topPaths.map(p => ({
        path: p.path, pageviews: parseInt(p.pageviews),
        avg_duration_ms: p.avg_duration ? Math.round(parseFloat(p.avg_duration)) : null,
      })),
      top_referrers: topReferrers.map(r => ({ referrer: r.referrer, count: parseInt(r.count) })),
      devices: devices.map(d => ({ device_type: d.device_type, count: parseInt(d.count) })),
      browsers: browsers.map(b => ({ browser: b.browser, count: parseInt(b.count) })),
      os: os.map(o => ({ os: o.os, count: parseInt(o.count) })),
      roles: roles.map(r => ({ role: r.role, count: parseInt(r.count) })),
    })
  } catch (err: any) { return res.status(500).json({ error: err.message }) }
})

export { publicRouter }
export default router
