import type { NextApiRequest, NextApiResponse } from 'next'

import { getAuthTokenFromRequest, getRefreshTokenFromRequest } from '@/lib/server/auth-token'
import { backendFetch, backendFetchWithToken } from '@/lib/server/backend-client'
import { unwrapBackendPayload } from '@/lib/server/backend-response'
import { isMockMode } from '@/lib/server/mock-backend'

const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_COOKIE_NAME = 'taskflow_token'
const REFRESH_COOKIE_NAME = 'taskflow_refresh'
const TOKEN_MAX_AGE_SECONDS = 11 * 60 * 60
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

type RefreshResult = {
  token: string
  refreshToken?: string
  cookies: string[]
}

const refreshInflight = new Map<string, Promise<RefreshResult | null>>()

function buildAuthCookie(name: string, value: string, maxAgeSeconds: number): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`
}

function appendSetCookies(res: NextApiResponse, cookies: string[]): void {
  if (cookies.length === 0) return

  const existing = res.getHeader?.('Set-Cookie')
  const merged = [
    ...(Array.isArray(existing) ? existing.map(String) : existing ? [String(existing)] : []),
    ...cookies,
  ]
  res.setHeader('Set-Cookie', merged)
}

async function refreshAccessToken(refreshToken: string): Promise<RefreshResult | null> {
  if (isMockMode()) {
    return {
      token: 'mock-token',
      refreshToken: 'mock-refresh',
      cookies: [
        buildAuthCookie(TOKEN_COOKIE_NAME, 'mock-token', TOKEN_MAX_AGE_SECONDS),
        buildAuthCookie(REFRESH_COOKIE_NAME, 'mock-refresh', REFRESH_MAX_AGE_SECONDS),
      ],
    }
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const body = await response.json().catch(() => null)
  const data = unwrapBackendPayload<{ token?: string; refreshToken?: string }>(body)

  if (!response.ok || !data || typeof data.token !== 'string') {
    return null
  }

  const cookies = [buildAuthCookie(TOKEN_COOKIE_NAME, data.token, TOKEN_MAX_AGE_SECONDS)]
  if (typeof data.refreshToken === 'string') {
    cookies.push(buildAuthCookie(REFRESH_COOKIE_NAME, data.refreshToken, REFRESH_MAX_AGE_SECONDS))
  }

  return {
    token: data.token,
    refreshToken: typeof data.refreshToken === 'string' ? data.refreshToken : undefined,
    cookies,
  }
}

/** Single-flight refresh so concurrent BFF proxies do not burn a rotated refresh token. */
export function refreshAccessTokenSingleFlight(refreshToken: string): Promise<RefreshResult | null> {
  const existing = refreshInflight.get(refreshToken)
  if (existing) return existing

  const promise = refreshAccessToken(refreshToken).finally(() => {
    refreshInflight.delete(refreshToken)
  })
  refreshInflight.set(refreshToken, promise)
  return promise
}

/**
 * BFF fetch: on 401 (or missing access token), refresh via cookie and retry once.
 * Sets updated auth cookies on `res` when refresh succeeds.
 */
export async function backendFetchAuthed(
  req: NextApiRequest,
  res: NextApiResponse,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const accessToken = getAuthTokenFromRequest(req)
  const refreshToken = getRefreshTokenFromRequest(req)

  if (!accessToken && !refreshToken) {
    return backendFetch(path, init)
  }

  if (accessToken) {
    const first = await backendFetchWithToken(path, accessToken, init)
    if (first.status !== 401 || !refreshToken) {
      return first
    }
  }

  if (!refreshToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const refreshed = await refreshAccessTokenSingleFlight(refreshToken)
  if (!refreshed) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  appendSetCookies(res, refreshed.cookies)
  return backendFetchWithToken(path, refreshed.token, init)
}
