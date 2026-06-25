import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'
import * as bcrypt from 'bcryptjs'
import { authenticator } from 'otplib'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const BCRYPT_ROUNDS = 12
const MAX_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function generateRecoveryCodes(): { plain: string[]; hashed: string[] } {
  const plain = Array.from({ length: 10 }, () => randomBytes(6).toString('hex').toUpperCase())
  const hashed = plain.map(c => hashToken(c))
  return { plain, hashed }
}

export async function handleAdminAuth(method: string, path: string, body: any) {
  const action = path.split('/').pop()

  // ── Seed admin if table empty ────────────────────────────────────────────
  if (method === 'POST' && action === 'seed') {
    const { count } = await supabase.from('admin_users').select('*', { count: 'exact', head: true })
    if ((count ?? 0) > 0) return { status: 200, body: { message: 'Admin already exists' } }

    const password = process.env.ADMIN_INITIAL_PASSWORD || 'consentspro2026€admin@'
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const { plain, hashed } = generateRecoveryCodes()

    await supabase.from('admin_users').insert({
      username: 'AdminMaster',
      email: process.env.ADMIN_EMAIL || 'admin@consentspro.es',
      password_hash: passwordHash,
      recovery_codes: hashed,
    })

    console.log('=== ADMIN SEEDED — SAVE THESE RECOVERY CODES ===')
    plain.forEach((c, i) => console.log(`  ${i + 1}. ${c}`))
    console.log('=== END RECOVERY CODES ===')

    return { status: 200, body: { seeded: true, message: 'AdminMaster created. Recovery codes logged once.' } }
  }

  // ── Login with password ──────────────────────────────────────────────────
  if (method === 'POST' && action === 'login') {
    const { username, password, totpCode } = body
    const { data: admin } = await supabase
      .from('admin_users').select('*').eq('username', username).single()

    if (!admin) return { status: 401, body: { error: 'Credenciales incorrectas' } }

    // Check lockout
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      return { status: 429, body: { error: `Cuenta bloqueada hasta ${admin.locked_until}` } }
    }

    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) {
      const attempts = (admin.failed_attempts ?? 0) + 1
      const update: any = { failed_attempts: attempts }
      if (attempts >= MAX_ATTEMPTS) {
        update.locked_until = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000).toISOString()
      }
      await supabase.from('admin_users').update(update).eq('id', admin.id)
      return { status: 401, body: { error: 'Credenciales incorrectas' } }
    }

    // TOTP check if enabled
    if (admin.totp_enabled && admin.totp_secret) {
      if (!totpCode) return { status: 200, body: { requireTotp: true } }
      const valid = authenticator.verify({ token: totpCode, secret: admin.totp_secret })
      if (!valid) return { status: 401, body: { error: 'Código TOTP incorrecto' } }
    }

    await supabase.from('admin_users').update({
      failed_attempts: 0,
      locked_until: null,
      last_login: new Date().toISOString(),
    }).eq('id', admin.id)

    // Log auth event
    await supabase.from('auth_audit_log').insert({
      user_id: admin.id,
      email: admin.email,
      event: 'admin_login',
      success: true,
    })

    const sessionToken = randomBytes(32).toString('hex')
    return { status: 200, body: { success: true, adminId: admin.id, sessionToken } }
  }

  // ── Setup TOTP ───────────────────────────────────────────────────────────
  if (method === 'POST' && action === 'totp-setup') {
    const { adminId } = body
    const secret = authenticator.generateSecret()
    const otpauth = authenticator.keyuri('AdminMaster', 'ConsentsPro', secret)

    await supabase.from('admin_users').update({ totp_secret: secret }).eq('id', adminId)

    return { status: 200, body: { secret, otpauth } }
  }

  // ── Verify and enable TOTP ───────────────────────────────────────────────
  if (method === 'POST' && action === 'totp-verify') {
    const { adminId, code } = body
    const { data: admin } = await supabase
      .from('admin_users').select('totp_secret').eq('id', adminId).single()
    if (!admin?.totp_secret) return { status: 400, body: { error: 'TOTP no configurado' } }

    const valid = authenticator.verify({ token: code, secret: admin.totp_secret })
    if (!valid) return { status: 401, body: { error: 'Código incorrecto' } }

    await supabase.from('admin_users').update({ totp_enabled: true }).eq('id', adminId)
    return { status: 200, body: { enabled: true } }
  }

  // ── Use recovery code ────────────────────────────────────────────────────
  if (method === 'POST' && action === 'recover') {
    const { username, code } = body
    const { data: admin } = await supabase
      .from('admin_users').select('*').eq('username', username).single()
    if (!admin) return { status: 401, body: { error: 'Usuario no encontrado' } }

    const codeHash = hashToken(code.toUpperCase())
    const codes: string[] = admin.recovery_codes ?? []
    const idx = codes.indexOf(codeHash)
    if (idx === -1) return { status: 401, body: { error: 'Código de recuperación incorrecto' } }

    // Consume the code (one-time use)
    const remaining = codes.filter((_, i) => i !== idx)
    await supabase.from('admin_users').update({
      recovery_codes: remaining,
      totp_enabled: false,
      totp_secret: null,
      failed_attempts: 0,
      locked_until: null,
    }).eq('id', admin.id)

    return { status: 200, body: { success: true, codesRemaining: remaining.length } }
  }

  return { status: 404, body: { error: 'Acción no encontrada' } }
}

export const handler = async (event: any) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const result = await handleAdminAuth(event.httpMethod, event.path, body)
    return { statusCode: result.status, body: JSON.stringify(result.body) }
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
