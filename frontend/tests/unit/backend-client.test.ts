import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('backend-client', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('MOCK_MODE', 'true')
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('backendFetch uses mock when MOCK_MODE=true', async () => {
    const { backendFetch } = await import('@/lib/server/backend-client')
    const res = await backendFetch('/api/tasks')
    expect(res.status).toBe(200)
  })

  it('backendFetchWithToken uses mock', async () => {
    const { backendFetchWithToken } = await import('@/lib/server/backend-client')
    const res = await backendFetchWithToken('/api/tasks', 'token')
    expect(res.status).toBe(200)
  })

  it('calls backend directly without legacy dev auto-login when mock mode is disabled', async () => {
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    const { backendFetch } = await import('@/lib/server/backend-client')
    const res = await backendFetch('/api/tasks')

    expect(res.status).toBe(401)
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/tasks', {})
  })
})
