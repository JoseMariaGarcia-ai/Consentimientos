import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Mismo patrón que certificateEncryption.ts (AES-256-GCM, clave con
// openssl rand -hex 32) — aquí el IV y el authTag se anteponen al propio
// fichero cifrado (en vez de guardarse aparte en la base de datos), para
// que el .enc subido a R2 sea autocontenido: 12 bytes de IV + 16 bytes de
// authTag + el resto es el contenido cifrado.
const IV_LEN = 12
const AUTH_TAG_LEN = 16

function getKey(): Buffer {
  const hex = process.env.BACKUP_ENCRYPTION_KEY
  if (!hex || hex.length !== 64) {
    throw new Error('BACKUP_ENCRYPTION_KEY no está configurada correctamente (debe ser una clave hex de 32 bytes — generar con: openssl rand -hex 32)')
  }
  return Buffer.from(hex, 'hex')
}

export function encryptBackup(plaintext: Buffer): Buffer {
  const key = getKey()
  const iv = randomBytes(IV_LEN)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext])
}

export function decryptBackup(payload: Buffer): Buffer {
  const key = getKey()
  const iv = payload.subarray(0, IV_LEN)
  const authTag = payload.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN)
  const ciphertext = payload.subarray(IV_LEN + AUTH_TAG_LEN)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}
