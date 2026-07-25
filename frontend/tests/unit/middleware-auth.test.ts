import { SignJWT } from 'jose'
import { describe, expect, it } from 'vitest'
import type { NextRequest } from 'next/server'
import {
  getJwtVerificationConfig,
  NAME_IDENTIFIER_CLAIM,
  ROLE_CLAIM,
} from '@/lib/auth/jwt-claims'
import {
  allowsAdminRoute,
  resolveMiddlewareAuth,
} from '@/lib/auth/middleware-auth'

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

function mockRequest(cookies: Record<string, string | undefined>): NextRequest {
  return {
    cookies: {
      get(name: string) {
        const value = cookies[name]
        return value === undefined ? undefined : { name, value }
      },
    },
  } as NextRequest
}

describe('resolveMiddlewareAuth', () => {
  it('returns role from a valid access token', async () => {
    const token = await signTestToken({ userId: 'admin-1', role: 'ADMIN' })
    const auth = await resolveMiddlewareAuth(
      mockRequest({ taskflow_token: token }),
    )
    expect(auth).toEqual({ authenticated: true, role: 'ADMIN' })
  })

  it('returns authenticated without role when only refresh cookie is present', async () => {
    const auth = await resolveMiddlewareAuth(
      mockRequest({ taskflow_refresh: 'opaque-refresh-token' }),
    )
    expect(auth).toEqual({ authenticated: true })
    expect(auth.role).toBeUndefined()
  })

  it('falls back to refresh-only when access token is expired', async () => {
    const expired = await signTestToken({
      userId: 'admin-1',
      role: 'ADMIN',
      expiresIn: '0s',
    })
    const auth = await resolveMiddlewareAuth(
      mockRequest({
        taskflow_token: expired,
        taskflow_refresh: 'opaque-refresh-token',
      }),
    )
    expect(auth).toEqual({ authenticated: true })
    expect(auth.role).toBeUndefined()
  })

  it('returns unauthenticated when no cookies are present', async () => {
    const auth = await resolveMiddlewareAuth(mockRequest({}))
    expect(auth).toEqual({ authenticated: false })
  })
})

describe('allowsAdminRoute', () => {
  it('denies unauthenticated requests', () => {
    expect(allowsAdminRoute({ authenticated: false })).toBe(false)
  })

  it('allows refresh-only sessions so the client can renew the access JWT', () => {
    expect(allowsAdminRoute({ authenticated: true })).toBe(true)
  })

  it('allows verified ADMIN role', () => {
    expect(allowsAdminRoute({ authenticated: true, role: 'ADMIN' })).toBe(true)
  })

  it('denies verified USER role', () => {
    expect(allowsAdminRoute({ authenticated: true, role: 'USER' })).toBe(false)
  })
})
