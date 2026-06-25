import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser'
import { api } from './api'

export { browserSupportsWebAuthn }

export async function registerBiometric(deviceName: string): Promise<boolean> {
  try {
    const options = await api.post('/webauthn/register-options', {})
    const credential = await startRegistration({ optionsJSON: options })
    const result = await api.post('/webauthn/register-verify', { credential, deviceName })
    return result.verified === true
  } catch (err) {
    console.error('WebAuthn register error:', err)
    return false
  }
}

export async function authenticateWithBiometric(email: string): Promise<boolean> {
  try {
    const options = await api.post('/webauthn/auth-options', { email })
    if (!options?.allowCredentials?.length) return false
    const credential = await startAuthentication({ optionsJSON: options })
    const result = await api.post('/webauthn/auth-verify', { email, credential })
    return result.verified === true
  } catch (err) {
    console.error('WebAuthn auth error:', err)
    return false
  }
}

export function hasBiometricRegistered(): boolean {
  return localStorage.getItem('webauthn_registered') === 'true'
}

export function markBiometricRegistered() {
  localStorage.setItem('webauthn_registered', 'true')
}
