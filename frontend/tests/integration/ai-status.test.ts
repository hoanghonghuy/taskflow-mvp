import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runHandler } from '../helpers/api-mock'

describe('ai status API (mock mode)', () => {
  beforeEach(() => {
    vi.stubEnv('MOCK_MODE', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('returns available=false in mock mode (AI disabled)', async () => {
    const { default: handler } = await import('@/pages/api/ai/status')
    const res = await runHandler(handler, 'GET')
    expect(res.status).toHaveBeenCalledWith(204)
    expect(res.json.mock.calls[0][0]).toMatchObject({ available: false })
  })
})

describe('ai status API (real backend proxy)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.stubEnv('MOCK_MODE', 'true')
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('proxies backend status when authenticated', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ available: false }),
    } as Response)

    const { default: handler } = await import('@/pages/api/ai/status')
    const res = await runHandler(handler, 'GET', {
      headers: { cookie: 'taskflow_token=abc' },
    })

    expect(fetch).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json.mock.calls[0][0]).toMatchObject({ available: false })
  })
})
