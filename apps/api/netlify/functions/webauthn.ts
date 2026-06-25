import { createClient } from '@supabase/supabase-js'
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const RP_NAME = 'ConsentsPro'
const RP_ID = process.env.WEBAUTHN_RP_ID || 'consentimientos.netlify.app'
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'https://consentimientos.netlify.app'

export async function handleWebAuthn(method: string, path: string, body: any, userId: string) {
  const action = path.split('/').pop()

  // ── Register: generate options ───────────────────────────────────────────
  if (method === 'POST' && action === 'register-options') {
    const { data: user } = await supabase
      .from('doctors').select('email, name').eq('id', userId).single()

    const { data: existing } = await supabase
      .from('webauthn_credentials').select('credential_id').eq('user_id', userId)

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(userId),
      userName: user?.email ?? userId,
      userDisplayName: user?.name ?? 'Usuario',
      excludeCredentials: (existing ?? []).map((c: any) => ({
        id: c.credential_id,
        type: 'public-key',
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    // Store challenge temporarily
    await supabase.from('webauthn_challenges').upsert({
      user_id: userId,
      challenge: options.challenge,
      type: 'registration',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    return { status: 200, body: options }
  }

  // ── Register: verify response ────────────────────────────────────────────
  if (method === 'POST' && action === 'register-verify') {
    const { credential, deviceName = 'Mi dispositivo' } = body

    const { data: challengeRow } = await supabase
      .from('webauthn_challenges')
      .select('challenge')
      .eq('user_id', userId)
      .eq('type', 'registration')
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!challengeRow) return { status: 400, body: { error: 'Challenge expirado' } }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return { status: 400, body: { error: 'Verificación fallida' } }
    }

    const { credential: cred } = verification.registrationInfo

    await supabase.from('webauthn_credentials').insert({
      user_id: userId,
      credential_id: Buffer.from(cred.id).toString('base64url'),
      public_key: Buffer.from(cred.publicKey).toString('base64'),
      device_name: deviceName,
      counter: cred.counter,
    })

    await supabase.from('webauthn_challenges').delete().eq('user_id', userId).eq('type', 'registration')

    return { status: 200, body: { verified: true } }
  }

  // ── Authenticate: generate options (public — no userId required) ─────────
  if (method === 'POST' && action === 'auth-options') {
    const { email } = body
    const { data: user } = await supabase
      .from('doctors').select('id').eq('email', email).single()

    if (!user) return { status: 200, body: await generateAuthenticationOptions({ rpID: RP_ID, userVerification: 'preferred' }) }

    const { data: creds } = await supabase
      .from('webauthn_credentials').select('credential_id').eq('user_id', user.id)

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'preferred',
      allowCredentials: (creds ?? []).map((c: any) => ({ id: c.credential_id, type: 'public-key' })),
    })

    await supabase.from('webauthn_challenges').upsert({
      user_id: user.id,
      challenge: options.challenge,
      type: 'authentication',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    return { status: 200, body: options }
  }

  // ── Authenticate: verify ─────────────────────────────────────────────────
  if (method === 'POST' && action === 'auth-verify') {
    const { email, credential } = body
    const { data: user } = await supabase
      .from('doctors').select('id').eq('email', email).single()
    if (!user) return { status: 401, body: { error: 'Usuario no encontrado' } }

    const credId = credential.id
    const { data: storedCred } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', user.id)
      .eq('credential_id', credId)
      .single()
    if (!storedCred) return { status: 401, body: { error: 'Credencial no registrada' } }

    const { data: challengeRow } = await supabase
      .from('webauthn_challenges')
      .select('challenge')
      .eq('user_id', user.id)
      .eq('type', 'authentication')
      .gt('expires_at', new Date().toISOString())
      .single()
    if (!challengeRow) return { status: 400, body: { error: 'Challenge expirado' } }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: storedCred.credential_id,
        publicKey: Buffer.from(storedCred.public_key, 'base64'),
        counter: storedCred.counter,
      },
    })

    if (!verification.verified) return { status: 401, body: { error: 'Verificación biométrica fallida' } }

    await supabase.from('webauthn_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('id', storedCred.id)

    await supabase.from('webauthn_challenges').delete().eq('user_id', user.id).eq('type', 'authentication')

    return { status: 200, body: { verified: true, userId: user.id } }
  }

  return { status: 404, body: { error: 'Acción no encontrada' } }
}

export const handler = async (event: any) => {
  const authHeader = event.headers?.authorization ?? ''
  const token = authHeader.replace('Bearer ', '')
  let userId = ''
  if (token) {
    const { data } = await supabase.auth.getUser(token)
    userId = data.user?.id ?? ''
  }
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const result = await handleWebAuthn(event.httpMethod, event.path, body, userId)
    return { statusCode: result.status, body: JSON.stringify(result.body) }
  } catch (err: any) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
