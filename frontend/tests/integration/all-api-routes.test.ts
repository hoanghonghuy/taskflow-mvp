import { describe, expect, it } from 'vitest'
import briefingHandler from '@/pages/api/ai/briefing'
import chatHandler from '@/pages/api/ai/chat'
import analyzeHandler from '@/pages/api/ai/tasks/analyze'
import sessionsHandler from '@/pages/api/pomodoro/sessions'
import achievementsHandler from '@/pages/api/profile/achievements'
import settingsHandler from '@/pages/api/settings'
import listsHandler from '@/pages/api/lists'
import habitsHandler from '@/pages/api/habits'
import countdownHandler from '@/pages/api/countdown'
import pomodoroStateHandler from '@/pages/api/pomodoro/state'
import { runHandler } from '../helpers/api-mock'

const tokenHeader = { authorization: 'Bearer test-token' }

describe('All API proxy routes', () => {
  it('ai briefing POST', async () => {
    const res = await runHandler(briefingHandler, 'POST', { body: { language: 'en' } })
    expect([200, 204]).toContain(res.status.mock.calls[0][0])
    const bad = await runHandler(briefingHandler, 'GET')
    expect(bad.status.mock.calls[0][0]).toBe(405)
  })

  it('ai chat and analyze POST', async () => {
    await runHandler(chatHandler, 'POST', {
      body: { messages: [{ role: 'user', text: 'hi' }] },
      headers: tokenHeader,
    })
    await runHandler(analyzeHandler, 'POST', {
      body: { text: 'buy milk' },
      headers: tokenHeader,
    })
  })

  it('pomodoro sessions GET/POST', async () => {
    await runHandler(sessionsHandler, 'GET', { headers: tokenHeader })
    await runHandler(sessionsHandler, 'POST', {
      headers: tokenHeader,
      body: { type: 'focus', durationSeconds: 1500 },
    })
  })

  it('profile achievements GET', async () => {
    const res = await runHandler(achievementsHandler, 'GET', { headers: tokenHeader })
    expect(res.status).toHaveBeenCalled()
  })

  it('settings PUT and error paths', async () => {
    await runHandler(settingsHandler, 'PUT', { body: { theme: 'dark' } })
    const bad = await runHandler(settingsHandler, 'PATCH')
    expect(bad.status.mock.calls[0][0]).toBe(405)
  })

  it('lists/habits/countdown GET by id and PUT', async () => {
    const list = await runHandler(listsHandler, 'POST', { body: { name: 'L', color: '#fff' } })
    const listId = list.json.mock.calls[0][0].id
    await runHandler(listsHandler, 'GET', { query: { id: listId } })
    await runHandler(listsHandler, 'PUT', { query: { id: listId }, body: { name: 'L2' } })

    const habit = await runHandler(habitsHandler, 'POST', { body: { name: 'H' } })
    const habitId = habit.json.mock.calls[0][0].id
    await runHandler(habitsHandler, 'GET', { query: { id: habitId } })
    await runHandler(habitsHandler, 'PUT', { query: { id: habitId }, body: { name: 'H2' } })
    await runHandler(habitsHandler, 'DELETE', { query: { id: habitId } })

    const cd = await runHandler(countdownHandler, 'POST', {
      body: { title: 'E', targetDate: new Date().toISOString() },
    })
    const cdId = cd.json.mock.calls[0][0].id
    await runHandler(countdownHandler, 'GET', { query: { id: cdId } })
    await runHandler(countdownHandler, 'PUT', { query: { id: cdId }, body: { title: 'E2' } })
  })

  it('pomodoro state PUT', async () => {
    await runHandler(pomodoroStateHandler, 'PUT', {
      headers: tokenHeader,
      body: { isActive: true, remainingSeconds: 100 },
    })
    const noAuth = await runHandler(pomodoroStateHandler, 'PUT', { body: {} })
    expect(noAuth.status).toHaveBeenCalledWith(401)
  })
})
