import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import { app, authHeader, registerAndLogin, resetDatabase } from '../helpers'
import * as authService from '../../src/modules/auth/auth.service'
import * as aiService from '../../src/modules/ai/ai.service'
import { buildBriefingContext } from '../../src/modules/ai/ai.service'

describe('Full route & service coverage', () => {
  let token: string
  let userId: string

  beforeEach(async () => {
    await resetDatabase()
    ;({ token, userId } = await registerAndLogin())
  })

  it('covers list/countdown/habit/pomodoro 404 branches', async () => {
    const fake = '00000000-0000-0000-0000-000000000099'
    await request(app).get(`/api/lists/${fake}`).set(authHeader(token)).expect(404)
    await request(app).get(`/api/countdown/${fake}`).set(authHeader(token)).expect(404)
    await request(app).get(`/api/habits/${fake}`).set(authHeader(token)).expect(404)
    await request(app).get(`/api/pomodoro/sessions/${fake}`).set(authHeader(token)).expect(404)
    await request(app).put(`/api/lists/${fake}`).set(authHeader(token)).send({ name: 'x' }).expect(404)
    await request(app).put(`/api/countdown/${fake}`).set(authHeader(token)).send({ title: 'x' }).expect(404)
    await request(app).put(`/api/habits/${fake}`).set(authHeader(token)).send({ name: 'x' }).expect(404)
    await request(app).delete(`/api/lists/${fake}`).set(authHeader(token)).expect(404)
    await request(app).delete(`/api/countdown/${fake}`).set(authHeader(token)).expect(404)
    await request(app).delete(`/api/habits/${fake}`).set(authHeader(token)).expect(404)
  })

  it('covers task update with all optional fields', async () => {
    const lists = await request(app).get('/api/lists').set(authHeader(token)).expect(200)
    const created = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({
        title: 'Full',
        description: 'd',
        dueDate: '2026-07-01T00:00:00.000Z',
        priority: 'urgent',
        listId: lists.body[0].id,
        tags: ['t1'],
        columnId: 'col',
        subtasks: [{ id: 's1', title: 'S', completed: false }],
        comments: [{ id: 'c1', userId, content: 'hi', timestamp: new Date().toISOString() }],
        recurrence: { type: 'weekly', interval: 2, daysOfWeek: [1, 3] },
        reminderMinutes: 30,
        assigneeId: userId,
      })
      .expect(201)

    await request(app)
      .put(`/api/tasks/${created.body.id}`)
      .set(authHeader(token))
      .send({
        title: 'Updated',
        description: 'new',
        completed: true,
        dueDate: null,
        priority: 'low',
        listId: lists.body[1].id,
        tags: [],
        columnId: null,
        subtasks: [],
        comments: [],
        recurrence: null,
        reminderMinutes: null,
        assigneeId: null,
      })
      .expect(200)
  })

  it('covers settings update with all fields', async () => {
    const lists = await request(app).get('/api/lists').set(authHeader(token)).expect(200)
    await request(app)
      .put('/api/settings')
      .set(authHeader(token))
      .send({
        language: 'vi',
        theme: 'night-indigo',
        notifications: false,
        soundEnabled: true,
        autoStartPomodoro: true,
        defaultPriority: 'high',
        defaultListId: lists.body[0].id,
        bottomNavActions: ['dashboard', 'list'],
        geminiApiKey: '  my-key  ',
      })
      .expect(200)
      .then((r) => {
        expect(r.body.geminiApiKey).toBe('configured')
        expect(r.body.bottomNavActions).toEqual(['dashboard', 'list'])
      })
  })

  it('covers pomodoro state with focused ids and pause', async () => {
    const task = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Focus task' })
      .expect(201)

    await request(app)
      .put('/api/pomodoro/state')
      .set(authHeader(token))
      .send({
        isActive: true,
        isPaused: true,
        remainingSeconds: 100,
        currentSession: 'shortBreak',
        focusedTaskId: task.body.id,
        focusedHabitId: '',
        sessionsCompleted: 2,
      })
      .expect(200)
  })

  it('covers auth service validation branches', async () => {
    await expect(authService.register('', 'a@t.com', 'p')).rejects.toMatchObject({ statusCode: 400 })
    await expect(authService.register('n', '', 'p')).rejects.toMatchObject({ statusCode: 400 })
    await expect(authService.register('n', 'a@t.com', '')).rejects.toMatchObject({ statusCode: 400 })
    expect(await authService.login('', 'p')).toBeNull()
    expect(await authService.login('a@t.com', '')).toBeNull()
  })

  it('buildBriefingContext includes today tasks', async () => {
    const today = new Date().toISOString().slice(0, 10)
    await prisma.todoTask.create({
      data: {
        title: 'Due today',
        userId,
        listId: 'inbox',
        dueDate: new Date(`${today}T12:00:00.000Z`),
      },
    })
    const ctx = await buildBriefingContext(userId)
    expect(ctx).toContain('Due today')
  })

  it('ai analyze empty text throws via service', async () => {
    await expect(aiService.analyzeTask(userId, '   ')).rejects.toBeDefined()
  })

  it('invalid JWT returns 401', async () => {
    await request(app)
      .get('/api/tasks')
      .set({ Authorization: 'Bearer invalid-token' })
      .expect(401)
  })

  it('profile streak with non-consecutive dates', async () => {
    await prisma.habit.create({
      data: {
        name: 'H',
        userId,
        completions: '["2026-06-01","2026-06-03"]',
      },
    })
    await request(app).get('/api/profile/achievements').set(authHeader(token)).expect(200)
  })
})
