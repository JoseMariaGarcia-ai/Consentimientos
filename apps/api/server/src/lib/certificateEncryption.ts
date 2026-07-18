import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// Cifrado en reposo del certificado digital de cada clínica y de su
// contraseña — el dato más sensible de todo el sistema (equivale a la firma
// legal plena de la clínica ante la AEAT). AES-256-GCM con DOS claves
// completamente distintas: una para el archivo .p12/.pfx, otra para la
// contraseña. Nunca se usa la misma clave para ambos, para que comprometer
// una no baste para descifrar el otro.
//
// Las claves se generan con: openssl rand -hex 32

interface EncryptedPayload {
  ciphertext: Buffer
  iv: string
  authTag: string
}

function getKey(envVar: string): Buffer {
  const hex = process.env[envVar]
  if (!hex || hex.length !== 64) {
    throw new Error(`${envVar} no está configurada correctamente (debe ser una clave hex de 32 bytes — generar con: openssl rand -hex 32)`)
  }
  return Buffer.from(hex, 'hex')
}

function encrypt(plaintext: Buffer, key: Buffer): EncryptedPayload {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()])
  return { ciphertext, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex') }
}

function decrypt(ciphertext: Buffer, iv: string, authTag: string, key: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(authTag, 'hex'))
  return Buffer.concat([decipher.update(ciphertext), decipher.final()])
}

export function encryptCertificateFile(fileBuffer: Buffer): EncryptedPayload {
  return encrypt(fileBuffer, getKey('CERTIFICATE_FILE_ENCRYPTION_KEY'))
}

export function decryptCertificateFile(ciphertext: Buffer, iv: string, authTag: string): Buffer {
  return decrypt(ciphertext, iv, authTag, getKey('CERTIFICATE_FILE_ENCRYPTION_KEY'))
}

export function encryptCertificatePassword(password: string): EncryptedPayload {
  return encrypt(Buffer.from(password, 'utf8'), getKey('CERTIFICATE_PASSWORD_ENCRYPTION_KEY'))
}

export function decryptCertificatePassword(ciphertext: Buffer, iv: string, authTag: string): string {
  return decrypt(ciphertext, iv, authTag, getKey('CERTIFICATE_PASSWORD_ENCRYPTION_KEY')).toString('utf8')
}
