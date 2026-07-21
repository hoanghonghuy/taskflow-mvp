import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuthTokenFromRequest, getRefreshTokenFromRequest } from '@/lib/server/auth-token'
import { unwrapBackendPayload } from '@/lib/server/backend-response'
import { backendFetchWithToken } from '@/lib/server/backend-client'
import {
  appendSetCookies,
  refreshAccessTokenSingleFlight,
} from '@/lib/server/backend-authed-fetch'
import { isMockMode } from '@/lib/server/mock-backend'

const TOKEN_COOKIE_NAME = 'taskflow_token'
const REFRESH_COOKIE_NAME = 'taskflow_refresh'

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
        if (meResponse.status === 401) {
          clearAuthCookies(res)
          return res.status(401).json({ authenticated: false })
        }
        return res.status(503).json({ authenticated: false, temporarilyUnavailable: true })
      }
    }

    if (!refreshToken) {
      clearAuthCookies(res)
      return res.status(401).json({ authenticated: false })
    }

    const refreshed = await refreshAccessTokenSingleFlight(refreshToken)
    if (refreshed.status === 'expired') {
      clearAuthCookies(res)
      return res.status(401).json({ authenticated: false })
    }

    if (refreshed.status === 'unavailable') {
      return res.status(503).json({ authenticated: false, temporarilyUnavailable: true })
    }

    appendSetCookies(res, refreshed.cookies)

    const meResponse = await backendFetchWithToken('/api/auth/me', refreshed.token)
    if (!meResponse.ok) {
      if (meResponse.status === 401) {
        clearAuthCookies(res)
        return res.status(401).json({ authenticated: false })
      }
      return res.status(503).json({ authenticated: false, temporarilyUnavailable: true })
    }

    const meBody = await meResponse.json().catch(() => null)
    const user = unwrapBackendPayload(meBody)
    return res.status(200).json({ authenticated: true, user })
  } catch (error) {
    console.error('API Error (auth/session):', error)
    return res.status(500).json({ authenticated: false })
  }
}
