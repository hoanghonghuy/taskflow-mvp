import { describe, expect, it } from 'vitest'
import { mockBackendFetch } from '@/lib/server/mock-backend'

describe('mock-backend extended', () => {
  it('handles list/habit/countdown 404', async () => {
    expect((await mockBackendFetch('/api/lists/missing')).status).toBe(404)
    expect((await mockBackendFetch('/api/habits/missing')).status).toBe(404)
    expect((await mockBackendFetch('/api/countdown/missing')).status).toBe(404)
    expect((await mockBackendFetch('/api/tasks/missing')).status).toBe(404)
  })

  it('habit complete DELETE and invalid body parse', async () => {
    const created = await mockBackendFetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify({ name: 'X' }),
    })
    const habit = await created.json()
    await mockBackendFetch(`/api/habits/${habit.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ date: '2026-06-02' }),
    })
    await mockBackendFetch(`/api/habits/${habit.id}/complete?date=2026-06-02`, {
      method: 'DELETE',
    })
    await mockBackendFetch('/api/tasks', { method: 'POST', body: 'not-json' })
  })

  it('pomodoro sessions POST', async () => {
    const res = await mockBackendFetch('/api/pomodoro/sessions', {
      method: 'POST',
      body: JSON.stringify({ type: 'focus' }),
    })
    expect(res.status).toBe(201)
  })
})
