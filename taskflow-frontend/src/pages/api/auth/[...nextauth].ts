// Mock authentication implementation - replace with real NextAuth when package is installed
// import NextAuth from 'next-auth';
// import { VercelPostgres } from '@vercel/postgres';
// import CredentialsProvider from 'next-auth/providers/credentials';

import type { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:5134').replace(/\/$/, '')
const TOKEN_COOKIE_NAME = 'taskflow_token'
const TOKEN_MAX_AGE_SECONDS = 11 * 60 * 60 // slightly less than backend 12h expiry
const REFRESH_COOKIE_NAME = 'taskflow_refresh'
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

interface AuthResponse {
  token?: string
  refreshToken?: string
  [key: string]: unknown
}

function getCookie(req: NextApiRequest, name: string): string | null {
  const cookieHeader = Array.isArray(req.headers.cookie) ? req.headers.cookie[0] : req.headers.cookie

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  const { action, email, password, name } = req.body ?? {}

  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Missing auth action' })
  }

  if (action === 'logout') {
    // Clear auth cookie
    res.setHeader('Set-Cookie', [
      `${TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
      `${REFRESH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    ])
    return res.status(200).json({ success: true })
  }

  if (action === 'refresh') {
    const refreshToken = getCookie(req, REFRESH_COOKIE_NAME)

    if (!refreshToken) {
      return res.status(401).json({ error: 'Missing refresh token' })
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      const data = (await response.json().catch(() => null)) as AuthResponse | null
      const payload: AuthResponse = data ?? {}

      if (response.ok && typeof payload.token === 'string') {
        const cookies: string[] = []

        cookies.push(
          `${TOKEN_COOKIE_NAME}=${encodeURIComponent(payload.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_MAX_AGE_SECONDS}`,
        )

        if (typeof payload.refreshToken === 'string') {
          cookies.push(
            `${REFRESH_COOKIE_NAME}=${encodeURIComponent(payload.refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REFRESH_MAX_AGE_SECONDS}`,
          )
        }

        if (cookies.length > 0) {
          res.setHeader('Set-Cookie', cookies)
        }

        const safeData: AuthResponse = { ...payload }
        delete safeData.refreshToken

        return res.status(response.status).json(safeData)
      }

      return res.status(response.status).json(payload)
    } catch (error) {
      console.error('API Error (proxy to backend /api/auth/refresh):', error)
      return res.status(500).json({ error: 'Internal server error' })
    }
  }

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    if (action === 'register') {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: typeof name === 'string' ? name : email,
          email,
          password,
        }),
      })

      const data = await response.json().catch(() => null)
      return res.status(response.status).json(data ?? {})
    }

    if (action === 'login') {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = (await response.json().catch(() => null)) as AuthResponse | null
      const payload: AuthResponse = data ?? {}

      if (response.ok && typeof payload.token === 'string') {
        const cookies: string[] = []

        cookies.push(
          `${TOKEN_COOKIE_NAME}=${encodeURIComponent(payload.token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_MAX_AGE_SECONDS}`,
        )

        if (typeof payload.refreshToken === 'string') {
          cookies.push(
            `${REFRESH_COOKIE_NAME}=${encodeURIComponent(payload.refreshToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REFRESH_MAX_AGE_SECONDS}`,
          )
        }

        if (cookies.length > 0) {
          res.setHeader('Set-Cookie', cookies)
        }

        const safeData: AuthResponse = { ...payload }
        delete safeData.refreshToken

        return res.status(response.status).json(safeData)
      }

      return res.status(response.status).json(payload)
    }

    return res.status(400).json({ error: 'Invalid auth action' })
  } catch (error) {
    console.error('API Error (proxy to backend /api/auth):', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
