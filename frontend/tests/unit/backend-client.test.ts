import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('backend-client', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.MOCK_MODE = 'true'
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    delete process.env.DEV_USER_EMAIL
    delete process.env.DEV_USER_PASSWORD
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
    process.env.MOCK_MODE = 'false'
    delete process.env.DEV_USER_EMAIL
    delete process.env.DEV_USER_PASSWORD

    const { backendFetch } = await import('@/lib/server/backend-client')

    await expect(backendFetch('/api/tasks')).rejects.toThrow(
      'DEV_USER_EMAIL is required when MOCK_MODE=false outside production',
    )
  })
})
