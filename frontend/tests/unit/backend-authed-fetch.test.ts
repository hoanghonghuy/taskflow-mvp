import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextApiRequest, NextApiResponse } from 'next'
import { runHandler } from '../helpers/api-mock'

function createRes() {
  const headers: Record<string, string | string[]> = {}
  return {
    headers,
    setHeader: vi.fn((name: string, value: string | string[]) => {
      headers[name.toLowerCase()] = value
    }),
    getHeader: vi.fn((name: string) => headers[name.toLowerCase()]),
  } as unknown as NextApiResponse
}

function createReq(cookie?: string): NextApiRequest {
  return {
    headers: cookie ? { cookie } : {},
  } as NextApiRequest
}

describe('backendFetchAuthed', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('BACKEND_URL', 'http://backend.test')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('retries once after refreshing when access token returns 401', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { token: 'new-access', refreshToken: 'new-refresh' },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [{ id: '1' }] }), { status: 200 }),
      )

    const { backendFetchAuthed } = await import('@/lib/server/backend-authed-fetch')
    const res = createRes()
    const response = await backendFetchAuthed(
      createReq('taskflow_token=old-access; taskflow_refresh=old-refresh'),
      res,
      '/api/tasks',
    )

    expect(response.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(fetchMock.mock.calls[0][0]).toBe('http://backend.test/api/tasks')
    expect(fetchMock.mock.calls[1][0]).toBe('http://backend.test/api/auth/refresh')
    expect(fetchMock.mock.calls[2][0]).toBe('http://backend.test/api/tasks')
    const retryHeaders = new Headers(fetchMock.mock.calls[2][1]?.headers as HeadersInit)
    expect(retryHeaders.get('Authorization')).toBe('Bearer new-access')

    const setCookie = res.setHeader as unknown as ReturnType<typeof vi.fn>
    expect(setCookie).toHaveBeenCalled()
    const cookieArg = setCookie.mock.calls.find((c) => c[0] === 'Set-Cookie')?.[1]
    expect(String(cookieArg)).toContain('taskflow_token=')
    expect(decodeURIComponent(String(cookieArg))).toContain('new-access')
  })

  it('dedupes concurrent refresh for the same refresh token', async () => {
    const fetchMock = vi.mocked(fetch)
    let refreshCalls = 0

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.includes('/api/auth/refresh')) {
        refreshCalls += 1
        await new Promise((r) => setTimeout(r, 20))
        return new Response(
          JSON.stringify({
            success: true,
            data: { token: 'shared-access', refreshToken: 'shared-refresh' },
          }),
          { status: 200 },
        )
      }
      if (url.includes('/api/tasks')) {
        const headerBag = new Headers(init?.headers as HeadersInit)
        if (headerBag.get('Authorization') === 'Bearer expired') {
          return new Response(null, { status: 401 })
        }
        return new Response(JSON.stringify({ ok: true }), { status: 200 })
      }
      return new Response(null, { status: 404 })
    })

    const { backendFetchAuthed } = await import('@/lib/server/backend-authed-fetch')
    const cookie = 'taskflow_token=expired; taskflow_refresh=same-refresh'
    const [a, b] = await Promise.all([
      backendFetchAuthed(createReq(cookie), createRes(), '/api/tasks'),
      backendFetchAuthed(createReq(cookie), createRes(), '/api/tasks'),
    ])

    expect(a.status).toBe(200)
    expect(b.status).toBe(200)
    expect(refreshCalls).toBe(1)
  })

  it('returns 401 without retry when refresh token is missing', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
    )

    const { backendFetchAuthed } = await import('@/lib/server/backend-authed-fetch')
    const response = await backendFetchAuthed(
      createReq('taskflow_token=expired-only'),
      createRes(),
      '/api/tasks',
    )

    expect(response.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('passes through backend 401 when no auth cookies are present', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
    )

    const { backendFetchAuthed } = await import('@/lib/server/backend-authed-fetch')
    const response = await backendFetchAuthed(createReq(), createRes(), '/api/profile/summary')

    expect(response.status).toBe(401)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('http://backend.test/api/profile/summary')
  })

  it('refreshes first when only refresh cookie is present', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: { token: 'minted-access', refreshToken: 'minted-refresh' },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }),
      )

    const { backendFetchAuthed } = await import('@/lib/server/backend-authed-fetch')
    const response = await backendFetchAuthed(
      createReq('taskflow_refresh=only-refresh'),
      createRes(),
      '/api/tasks',
    )

    expect(response.status).toBe(200)
    expect(fetchMock.mock.calls[0][0]).toBe('http://backend.test/api/auth/refresh')
    expect(fetchMock.mock.calls[1][0]).toBe('http://backend.test/api/tasks')
  })

  it('returns 503 without clearing cookies when refresh backend is temporarily unavailable', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'temporarily_unavailable' }), { status: 503 }),
      )

    const { backendFetchAuthed } = await import('@/lib/server/backend-authed-fetch')
    const res = createRes()
    const response = await backendFetchAuthed(
      createReq('taskflow_token=expired; taskflow_refresh=still-valid'),
      res,
      '/api/tasks',
    )

    expect(response.status).toBe(503)
    expect(res.setHeader).not.toHaveBeenCalled()
  })

  it('shares one refresh between the auth route and a BFF request', async () => {
    const fetchMock = vi.mocked(fetch)
    let refreshCalls = 0

    fetchMock.mockImplementation(async (input, init) => {
      const url = String(input)
      if (url.endsWith('/api/auth/refresh')) {
        refreshCalls += 1
        await new Promise((resolve) => setTimeout(resolve, 20))
        return new Response(
          JSON.stringify({
            success: true,
            data: { token: 'shared-access', refreshToken: 'shared-refresh' },
          }),
          { status: 200 },
        )
      }

      if (url.endsWith('/api/tasks')) {
        const headers = new Headers(init?.headers as HeadersInit)
        return headers.get('Authorization') === 'Bearer expired'
          ? new Response(null, { status: 401 })
          : new Response(JSON.stringify({ success: true, data: [] }), { status: 200 })
      }

      return new Response(null, { status: 404 })
    })

    const [{ backendFetchAuthed }, { default: authHandler }] = await Promise.all([
      import('@/lib/server/backend-authed-fetch'),
      import('@/pages/api/auth/[...nextauth]'),
    ])
    const cookie = 'taskflow_token=expired; taskflow_refresh=same-refresh'

    const [route, bffResponse] = await Promise.all([
      runHandler(authHandler, 'POST', {
        body: { action: 'refresh' },
        headers: { cookie },
      }),
      backendFetchAuthed(createReq(cookie), createRes(), '/api/tasks'),
    ])

    expect(route.status).toHaveBeenCalledWith(200)
    expect(bffResponse.status).toBe(200)
    expect(refreshCalls).toBe(1)
  })
})
