import type { NextApiRequest, NextApiResponse } from 'next'
import { backendFetchWithToken } from '@/lib/server/backend-client'

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5134').replace(/\/$/, '')
const TOKEN_COOKIE_NAME = 'taskflow_token'
const REFRESH_COOKIE_NAME = 'taskflow_refresh'
const TOKEN_MAX_AGE_SECONDS = 11 * 60 * 60
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

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

  try {
    // If we already have a valid-looking access token cookie, treat the session as authenticated.
    // Backend APIs will still enforce JWT validity on each request.
    if (token) {
      return res.status(200).json({ authenticated: true })
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
      `${TOKEN_COOKIE_NAME}=${encodeURIComponent(data.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_MAX_AGE_SECONDS}`,
    )

    if (data.refreshToken && typeof data.refreshToken === 'string') {
      cookies.push(
        `${REFRESH_COOKIE_NAME}=${encodeURIComponent(data.refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REFRESH_MAX_AGE_SECONDS}`,
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
