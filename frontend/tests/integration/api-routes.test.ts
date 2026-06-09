import { describe, expect, it } from 'vitest'
import tasksHandler from '@/pages/api/tasks'
import listsHandler from '@/pages/api/lists'
import habitsHandler from '@/pages/api/habits'
import countdownHandler from '@/pages/api/countdown'
import settingsHandler from '@/pages/api/settings'
import profileSummaryHandler from '@/pages/api/profile/summary'
import pomodoroStateHandler from '@/pages/api/pomodoro/state'
import { runHandler } from '../helpers/api-mock'
import { unwrapEnvelope } from '../helpers/api-envelope'

describe('API proxy routes (MOCK_MODE)', () => {
  it('tasks GET/POST/PUT/DELETE', async () => {
    const getAll = await runHandler(tasksHandler, 'GET')
    expect(getAll.status).toHaveBeenCalledWith(200)

    const create = await runHandler(tasksHandler, 'POST', {
      body: { title: 'Via proxy', listId: 'inbox' },
    })
    const created = unwrapEnvelope<{ id: string; title: string }>(create.json.mock.calls[0][0])
    expect(created.title).toBe('Via proxy')

    const update = await runHandler(tasksHandler, 'PUT', {
      query: { id: created.id },
      body: { completed: true },
    })
    expect(update.status).toHaveBeenCalledWith(200)

    const del = await runHandler(tasksHandler, 'DELETE', { query: { id: created.id } })
    expect(del.status).toHaveBeenCalledWith(204)
  })

  it('tasks PUT/DELETE require id', async () => {
    const put = await runHandler(tasksHandler, 'PUT', { body: {} })
    expect(put.status).toHaveBeenCalledWith(400)
  })

  it('tasks 405 for unsupported method', async () => {
    const patch = await runHandler(tasksHandler, 'PATCH')
    expect(patch.status).toHaveBeenCalledWith(405)
  })

  it('lists CRUD', async () => {
    await runHandler(listsHandler, 'GET')
    const create = await runHandler(listsHandler, 'POST', {
      body: { name: 'Proxy list', color: '#fff', members: [] },
    })
    const list = unwrapEnvelope<{ id: string }>(create.json.mock.calls[0][0])
    await runHandler(listsHandler, 'PUT', { query: { id: list.id }, body: { name: 'Renamed' } })
    await runHandler(listsHandler, 'DELETE', { query: { id: list.id } })
  })

  it('habits and countdown', async () => {
    await runHandler(habitsHandler, 'GET')
    const h = await runHandler(habitsHandler, 'POST', { body: { name: 'H' } })
    const habit = unwrapEnvelope<{ id: string }>(h.json.mock.calls[0][0])
    await runHandler(habitsHandler, 'POST', {
      query: { id: habit.id },
      body: { date: '2026-06-01' },
    })

    await runHandler(countdownHandler, 'GET')
    const c = await runHandler(countdownHandler, 'POST', {
      body: { title: 'C', targetDate: new Date().toISOString() },
    })
    const event = unwrapEnvelope<{ id: string }>(c.json.mock.calls[0][0])
    await runHandler(countdownHandler, 'DELETE', { query: { id: event.id } })
  })

  it('settings and profile', async () => {
    await runHandler(settingsHandler, 'GET')
    await runHandler(settingsHandler, 'PUT', { body: { language: 'vi' } })
    const summary = await runHandler(profileSummaryHandler, 'GET')
    expect(summary.status).toHaveBeenCalledWith(200)
  })

  it('pomodoro state requires auth token', async () => {
    const noToken = await runHandler(pomodoroStateHandler, 'GET')
    expect(noToken.status).toHaveBeenCalledWith(401)

    const withToken = await runHandler(pomodoroStateHandler, 'GET', {
      headers: { authorization: 'Bearer mock-token' },
    })
    expect([200, 204]).toContain(withToken.status.mock.calls[0][0])
  })

  it('forwards cookie token', async () => {
    const res = await runHandler(tasksHandler, 'GET', {
      headers: { cookie: 'taskflow_token=abc123' },
    })
    expect(res.status).toHaveBeenCalled()
  })
})
