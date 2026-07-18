import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest, getRefreshTokenFromRequest } from '@/lib/server/auth-token'
import { unwrapBackendPayload } from '@/lib/server/backend-response'
import { backendFetchWithToken } from '@/lib/server/backend-client'
import { isMockMode } from '@/lib/server/mock-backend'

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_COOKIE_NAME = 'taskflow_token'
const REFRESH_COOKIE_NAME = 'taskflow_refresh'
const TOKEN_MAX_AGE_SECONDS = 11 * 60 * 60
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

function buildAuthCookie(name: string, value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

function buildExpiredAuthCookie(name: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
}

function clearAuthCookies(res: NextApiResponse): void {
  res.setHeader('Set-Cookie', [
    buildExpiredAuthCookie(TOKEN_COOKIE_NAME),
    buildExpiredAuthCookie(REFRESH_COOKIE_NAME),
  ])
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const token = getAuthTokenFromRequest(req)
  const refreshToken = getRefreshTokenFromRequest(req)

  // ---- Mock mode: authenticated if a token cookie is present ----
  if (isMockMode()) {
    const authenticated = Boolean(token || refreshToken)
    if (!authenticated) {
      return res.status(401).json({ authenticated: false })
    }
    const { buildMockAuthUser } = await import('@/lib/server/mock-backend')
    return res.status(200).json({ authenticated: true, user: buildMockAuthUser({}) })
  }

  try {
    if (token) {
      const meResponse = await backendFetchWithToken('/api/auth/me', token)
      if (meResponse.ok) {
        const meBody = await meResponse.json().catch(() => null)
        const user = unwrapBackendPayload(meBody)
        return res.status(200).json({ authenticated: true, user })
      }

      if (meResponse.status !== 401 || !refreshToken) {
        clearAuthCookies(res)
        return res.status(meResponse.status).json({ authenticated: false })
      }
    }

    if (!refreshToken) {
      clearAuthCookies(res)
      return res.status(401).json({ authenticated: false })
    }

    const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const body = await refreshResponse.json().catch(() => null)
    const data = unwrapBackendPayload<{ token?: string; refreshToken?: string }>(body)

    if (!refreshResponse.ok) {
      clearAuthCookies(res)
      if (refreshResponse.status === 401) {
        return res.status(401).json({ authenticated: false })
      }

      return res.status(500).json({ authenticated: false })
    }

    if (!data || typeof data.token !== 'string') {
      clearAuthCookies(res)
      return res.status(500).json({ authenticated: false })
    }

    const cookies: string[] = []

    cookies.push(
      buildAuthCookie(TOKEN_COOKIE_NAME, data.token, TOKEN_MAX_AGE_SECONDS),
    )

    if (data.refreshToken && typeof data.refreshToken === 'string') {
      cookies.push(
        buildAuthCookie(REFRESH_COOKIE_NAME, data.refreshToken, REFRESH_MAX_AGE_SECONDS),
      )
    }

    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies)
    }

    const meResponse = await backendFetchWithToken('/api/auth/me', data.token)
    if (!meResponse.ok) {
      clearAuthCookies(res)
      return res.status(401).json({ authenticated: false })
    }

    const meBody = await meResponse.json().catch(() => null)
    const user = unwrapBackendPayload(meBody)
    return res.status(200).json({ authenticated: true, user })
  } catch (error) {
    console.error('API Error (auth/session):', error)
    return res.status(500).json({ authenticated: false })
  }
}
