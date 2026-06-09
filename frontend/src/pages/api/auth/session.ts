import type { NextApiRequest, NextApiResponse } from 'next'
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

function getCookieValue(req: NextApiRequest, name: string): string | null {
  const cookieHeader = Array.isArray(req.headers.cookie)
    ? req.headers.cookie[0]
    : req.headers.cookie

  if (!cookieHeader || typeof cookieHeader !== 'string') {
    return null
  }

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.trim().split('=')
    if (cookieName === name) {
      return decodeURIComponent(rest.join('=') || '')
    }
  }

  return null
}

function getAuthTokenFromRequest(req: NextApiRequest): string | null {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  return getCookieValue(req, TOKEN_COOKIE_NAME)
}

function getRefreshTokenFromRequest(req: NextApiRequest): string | null {
  return getCookieValue(req, REFRESH_COOKIE_NAME)
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
    return res.status(token || refreshToken ? 200 : 401).json({
      authenticated: Boolean(token || refreshToken),
    })
  }

  try {
    if (token) {
      const validationResponse = await backendFetchWithToken('/api/profile/summary', token)
      if (validationResponse.ok) {
        return res.status(200).json({ authenticated: true })
      }

      if (validationResponse.status !== 401 || !refreshToken) {
        return res.status(validationResponse.status).json({ authenticated: false })
      }
    }

    if (!refreshToken) {
      return res.status(401).json({ authenticated: false })
    }

    const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    const data = (await refreshResponse.json().catch(() => null)) as
      | { token?: string; refreshToken?: string }
      | null

    if (!refreshResponse.ok) {
      if (refreshResponse.status === 401) {
        return res.status(401).json({ authenticated: false })
      }

      return res.status(500).json({ authenticated: false })
    }

    if (!data || typeof data.token !== 'string') {
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

    return res.status(200).json({ authenticated: true })
  } catch (error) {
    console.error('API Error (auth/session):', error)
    return res.status(500).json({ authenticated: false })
  }
}
