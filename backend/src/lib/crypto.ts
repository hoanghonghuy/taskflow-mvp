import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { config } from '../config'

/**
 * AES-256-GCM helpers để mã hóa secret tại rest (vd geminiApiKey trong DB).
 *
 * Format storage: `<iv-hex>:<tag-hex>:<ciphertext-hex>`
 *
 * Key lấy từ env `USER_SECRET_ENC_KEY` (32 bytes hex = 64 hex chars). Nếu thiếu,
 * dùng derived key từ JWT_KEY để dev/test; production PHẢI set key riêng.
 */

const ALGO = 'aes-256-gcm'
const IV_BYTES = 12
const KEY_BYTES = 32

function loadKey(): Buffer {
  const envKey = process.env.USER_SECRET_ENC_KEY?.trim()
  if (envKey) {
    const buf = Buffer.from(envKey, 'hex')
    if (buf.length !== KEY_BYTES) {
      throw new Error(
        `USER_SECRET_ENC_KEY must decode to ${KEY_BYTES} bytes (got ${buf.length})`,
      )
    }
    return buf
  }
  // Dev fallback: derive từ JWT_KEY. KHÔNG dùng trong production.
  if (config.jwt.key) {
    return createHash('sha256')
      .update(`user-secret-enc:${config.jwt.key}`)
      .digest()
  }
  throw new Error('No key available for secret encryption (set USER_SECRET_ENC_KEY or JWT_KEY)')
}

export function encryptSecret(plain: string): string {
  if (plain == null || plain === '') return ''
  const key = loadKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGO, key, iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptSecret(stored: string): string {
  if (!stored) return ''
  const parts = stored.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted secret format')
  }
  const [ivHex, tagHex, cipherHex] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const ciphertext = Buffer.from(cipherHex, 'hex')
  if (iv.length !== IV_BYTES) {
    throw new Error('Invalid IV length')
  }
  const key = loadKey()
  const decipher = createDecipheriv(ALGO, key, iv)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}
