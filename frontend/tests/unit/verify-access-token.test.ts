import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import {
  getJwtVerificationConfig,
  NAME_IDENTIFIER_CLAIM,
  ROLE_CLAIM,
} from '@/lib/auth/jwt-claims'
import { verifyAccessToken } from '@/lib/auth/verify-access-token'

async function signTestToken(payload: {
  userId: string
  role?: 'ADMIN' | 'USER'
  expiresIn?: string
}) {
  const { key, issuer, audience } = getJwtVerificationConfig()
  const secret = new TextEncoder().encode(key)

  return new SignJWT({
    [NAME_IDENTIFIER_CLAIM]: payload.userId,
    sub: payload.userId,
    [ROLE_CLAIM]: payload.role ?? 'USER',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(payload.expiresIn ?? '1h')
    .sign(secret)
}

describe('verifyAccessToken', () => {
  it('returns payload for valid token', async () => {
    const token = await signTestToken({ userId: 'user-1', role: 'ADMIN' })
    const verified = await verifyAccessToken(token)
    expect(verified).toEqual({ userId: 'user-1', role: 'ADMIN' })
  })

  it('returns null for tampered token', async () => {
    const token = await signTestToken({ userId: 'user-1' })
    const verified = await verifyAccessToken(`${token}x`)
    expect(verified).toBeNull()
  })

  it('returns null for empty token', async () => {
    expect(await verifyAccessToken('')).toBeNull()
  })
})
