import { describe, expect, it, vi, afterEach } from 'vitest'
import * as backendClient from '@/lib/server/backend-client'
import tasksHandler from '@/pages/api/tasks'
import profileSummaryHandler from '@/pages/api/profile/summary'
import { runHandler } from '../helpers/api-mock'

describe('API error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 500 when backendFetch throws', async () => {
    vi.spyOn(backendClient, 'backendFetch').mockRejectedValueOnce(new Error('network'))
    const res = await runHandler(tasksHandler, 'GET')
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('profile summary handles non-ok response', async () => {
    vi.spyOn(backendClient, 'backendFetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'fail' }), { status: 503 }),
    )
    const res = await runHandler(profileSummaryHandler, 'GET')
    expect(res.status.mock.calls[0][0]).toBe(503)
  })

  it('tasks handler with bearer uses backendFetchWithToken', async () => {
    const spy = vi.spyOn(backendClient, 'backendFetchWithToken')
    await runHandler(tasksHandler, 'GET', {
      headers: { authorization: 'Bearer my-jwt' },
    })
    expect(spy).toHaveBeenCalled()
  })
})
