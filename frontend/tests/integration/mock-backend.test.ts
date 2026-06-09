import { describe, expect, it } from 'vitest'
import { isMockMode, mockBackendFetch } from '@/lib/server/mock-backend'

describe('mock-backend', () => {
  it('isMockMode returns true in test env', () => {
    expect(isMockMode()).toBe(true)
  })

  it('CRUD tasks via mock router', async () => {
    const list = await mockBackendFetch('/api/tasks')
    expect(list.status).toBe(200)
    const tasks = await list.json()
    expect(Array.isArray(tasks)).toBe(true)

    const created = await mockBackendFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Mock task', listId: 'inbox' }),
    })
    expect(created.status).toBe(201)
    const task = await created.json()

    const got = await mockBackendFetch(`/api/tasks/${task.id}`)
    expect(got.status).toBe(200)

    const updated = await mockBackendFetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({ completed: true }),
    })
    expect(updated.status).toBe(200)

    const deleted = await mockBackendFetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
    expect(deleted.status).toBe(204)
  })

  it('CRUD lists and habits', async () => {
    const listRes = await mockBackendFetch('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', color: '#000', members: ['u1'] }),
    })
    const list = await listRes.json()
    expect(list.members).toContain('u1')

    const habitRes = await mockBackendFetch('/api/habits', {
      method: 'POST',
      body: JSON.stringify({ name: 'Run' }),
    })
    const habit = await habitRes.json()
    await mockBackendFetch(`/api/habits/${habit.id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ date: '2026-06-01' }),
    })
  })

  it('countdown, settings, profile, pomodoro, ai', async () => {
    const cd = await mockBackendFetch('/api/countdown', {
      method: 'POST',
      body: JSON.stringify({ title: 'X', targetDate: new Date().toISOString() }),
    })
    expect(cd.status).toBe(201)

    await mockBackendFetch('/api/settings', { method: 'PUT', body: JSON.stringify({ theme: 'dark' }) })
    const summary = await mockBackendFetch('/api/profile/summary')
    expect(summary.status).toBe(200)

    const pomo = await mockBackendFetch('/api/pomodoro/state')
    expect(pomo.status).toBe(204)

    const ai = await mockBackendFetch('/api/ai/chat', { method: 'POST', body: '{}' })
    expect(ai.status).toBe(204)
  })

  it('returns 404 for unknown routes', async () => {
    const res = await mockBackendFetch('/api/unknown')
    expect(res.status).toBe(404)
  })
})
