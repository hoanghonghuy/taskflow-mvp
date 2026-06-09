import { describe, expect, it } from 'vitest'
import countdownByIdHandler from '@/pages/api/countdown/[id]'
import habitsByIdHandler from '@/pages/api/habits/[id]'
import habitCompleteHandler from '@/pages/api/habits/[id]/complete'
import listsByIdHandler from '@/pages/api/lists/[id]'
import tasksByIdHandler from '@/pages/api/tasks/[id]'
import { runHandler } from '../helpers/api-mock'
import { unwrapEnvelope } from '../helpers/api-envelope'

describe('dynamic API proxy routes (MOCK_MODE)', () => {
  it('handles task update/delete through /api/tasks/[id]', async () => {
    const create = await runHandler(tasksByIdHandler, 'POST', {
      body: { title: 'Dynamic route task', listId: 'inbox' },
    })
    const task = unwrapEnvelope<{ id: string }>(create.json.mock.calls[0][0])

    const update = await runHandler(tasksByIdHandler, 'PUT', {
      query: { id: task.id },
      body: { completed: true },
    })
    expect(update.status).toHaveBeenCalledWith(200)

    const del = await runHandler(tasksByIdHandler, 'DELETE', {
      query: { id: task.id },
    })
    expect(del.status).toHaveBeenCalledWith(204)
  })

  it('handles list update/delete through /api/lists/[id]', async () => {
    const create = await runHandler(listsByIdHandler, 'POST', {
      body: { name: 'Dynamic list', color: '#fff', members: [] },
    })
    const list = unwrapEnvelope<{ id: string }>(create.json.mock.calls[0][0])

    const update = await runHandler(listsByIdHandler, 'PUT', {
      query: { id: list.id },
      body: { name: 'Renamed dynamic list' },
    })
    expect(update.status).toHaveBeenCalledWith(200)

    const del = await runHandler(listsByIdHandler, 'DELETE', {
      query: { id: list.id },
    })
    expect(del.status).toHaveBeenCalledWith(204)
  })

  it('handles habit update/delete and completion routes', async () => {
    const create = await runHandler(habitsByIdHandler, 'POST', {
      body: { name: 'Dynamic habit' },
    })
    const habit = unwrapEnvelope<{ id: string }>(create.json.mock.calls[0][0])

    const complete = await runHandler(habitCompleteHandler, 'POST', {
      query: { id: habit.id, date: '2026-06-09' },
    })
    expect(complete.status).toHaveBeenCalledWith(200)

    const uncomplete = await runHandler(habitCompleteHandler, 'DELETE', {
      query: { id: habit.id, date: '2026-06-09' },
    })
    expect(uncomplete.status).toHaveBeenCalledWith(200)

    const del = await runHandler(habitsByIdHandler, 'DELETE', {
      query: { id: habit.id },
    })
    expect(del.status).toHaveBeenCalledWith(204)
  })

  it('handles countdown update/delete through /api/countdown/[id]', async () => {
    const create = await runHandler(countdownByIdHandler, 'POST', {
      body: { title: 'Dynamic countdown', targetDate: new Date().toISOString() },
    })
    const event = unwrapEnvelope<{ id: string }>(create.json.mock.calls[0][0])

    const update = await runHandler(countdownByIdHandler, 'PUT', {
      query: { id: event.id },
      body: { title: 'Updated countdown' },
    })
    expect(update.status).toHaveBeenCalledWith(200)

    const del = await runHandler(countdownByIdHandler, 'DELETE', {
      query: { id: event.id },
    })
    expect(del.status).toHaveBeenCalledWith(204)
  })
})
