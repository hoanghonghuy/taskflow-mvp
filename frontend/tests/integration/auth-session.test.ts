import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import sessionHandler from '@/pages/api/auth/session'
import { runHandler } from '../helpers/api-mock'

describe('auth session API', () => {
  it('GET returns 401 without cookies in mock mode', async () => {
    const res = await runHandler(sessionHandler, 'GET')
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('GET returns 200 with token cookie', async () => {
    const res = await runHandler(sessionHandler, 'GET', {
      headers: { cookie: 'taskflow_token=abc' },
    })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({ authenticated: true })
  })

  it('GET returns 200 with refresh cookie only', async () => {
    const res = await runHandler(sessionHandler, 'GET', {
      headers: { cookie: 'taskflow_refresh=xyz' },
    })
    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('returns 405 for POST', async () => {
    const res = await runHandler(sessionHandler, 'POST')
    expect(res.status).toHaveBeenCalledWith(405)
  })
})

describe('auth session API (real backend mode)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.stubEnv('MOCK_MODE', 'true')
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('validates an existing access token with backend before authenticating', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)
    const { default: handler } = await import('@/pages/api/auth/session')

    const res = await runHandler(handler, 'GET', {
      headers: { cookie: 'taskflow_token=abc' },
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/profile/summary',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      }),
    )
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toEqual({ authenticated: true })
  })

  it('refreshes when access token is invalid but refresh token exists', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'expired' }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'new-token', refreshToken: 'new-refresh' }),
      } as Response)
    const { default: handler } = await import('@/pages/api/auth/session')

    const res = await runHandler(handler, 'GET', {
      headers: { cookie: 'taskflow_token=old; taskflow_refresh=refresh' },
    })

    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh' }),
      }),
    )
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.arrayContaining([
        expect.stringContaining('taskflow_token=new-token'),
        expect.stringContaining('taskflow_refresh=new-refresh'),
      ]),
    )
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
