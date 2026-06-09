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

  it('requires explicit dev credentials when mock mode is disabled outside production', async () => {
    vi.stubEnv('MOCK_MODE', 'false')
    vi.stubEnv('DEV_USER_EMAIL', '')
    vi.stubEnv('DEV_USER_PASSWORD', '')

    const { backendFetch } = await import('@/lib/server/backend-client')

    await expect(backendFetch('/api/tasks')).rejects.toThrow(
      'DEV_USER_EMAIL is required when MOCK_MODE=false outside production',
    )
  })
})
