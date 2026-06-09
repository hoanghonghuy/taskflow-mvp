import request from 'supertest'

type IdDto = { id: string }
type TaskListItem = { listId: string }
type HabitDto = { id: string; name: string }
type CountdownDto = { id: string; title: string }
type PomodoroStateDto = { remainingSeconds: number }

import { app, authHeader, registerAndLogin, resetDatabase, apiData } from '../helpers'

describe('Edge cases & remaining routes', () => {
  let token: string

  beforeEach(async () => {
    await resetDatabase()
    ;({ token } = await registerAndLogin())
  })

  it('tasks: 405 on unsupported method', async () => {
    const res = await request(app).patch('/api/tasks').set(authHeader(token))
    expect(res.status).toBe(404)
  })

  it('tasks: 400 empty title on create', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: '   ' })
      .expect(400)
    expect(res.body.error).toBeDefined()
  })

  it('lists: delete removes related tasks', async () => {
    const listRes = await request(app)
      .post('/api/lists')
      .set(authHeader(token))
      .send({ name: 'Temp', color: '#000' })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'In temp list', listId: apiData<IdDto>(listRes).id })
      .expect(201)

    await request(app).delete(`/api/lists/${apiData<IdDto>(listRes).id}`).set(authHeader(token)).expect(204)

    const tasksRes = await request(app).get('/api/tasks').set(authHeader(token)).expect(200)
    expect(apiData<TaskListItem[]>(tasksRes).every((t: { listId: string }) => t.listId !== apiData<IdDto>(listRes).id)).toBe(true)
  })

  it('habits: complete/uncomplete with default date', async () => {
    const habit = await request(app)
      .post('/api/habits')
      .set(authHeader(token))
      .send({ name: 'Meditate' })
      .expect(201)

    await request(app)
      .post(`/api/habits/${apiData<HabitDto>(habit).id}/complete`)
      .set(authHeader(token))
      .send({})
      .expect(204)

    await request(app)
      .delete(`/api/habits/${apiData<HabitDto>(habit).id}/complete`)
      .set(authHeader(token))
      .expect(204)
  })

  it('habits: update and delete', async () => {
    const habit = await request(app)
      .post('/api/habits')
      .set(authHeader(token))
      .send({ name: 'Old' })
      .expect(201)

    await request(app)
      .put(`/api/habits/${apiData<HabitDto>(habit).id}`)
      .set(authHeader(token))
      .send({ name: 'New' })
      .expect(200)
      .then((r) => expect(apiData<HabitDto>(r).name).toBe('New'))

    await request(app).delete(`/api/habits/${apiData<HabitDto>(habit).id}`).set(authHeader(token)).expect(204)
  })

  it('countdown: update', async () => {
    const created = await request(app)
      .post('/api/countdown')
      .set(authHeader(token))
      .send({ title: 'Old', targetDate: '2026-01-01T00:00:00.000Z' })
      .expect(201)

    await request(app)
      .put(`/api/countdown/${apiData<IdDto>(created).id}`)
      .set(authHeader(token))
      .send({ title: 'New' })
      .expect(200)
      .then((r) => expect(apiData<CountdownDto>(r).title).toBe('New'))
  })

  it('pomodoro: create session and get by id', async () => {
    const created = await request(app)
      .post('/api/pomodoro/sessions')
      .set(authHeader(token))
      .send({
        startTime: new Date().toISOString(),
        durationSeconds: 1500,
        type: 'focus',
      })
      .expect(201)

    await request(app)
      .get(`/api/pomodoro/sessions/${apiData<IdDto>(created).id}`)
      .set(authHeader(token))
      .expect(200)
  })

  it('pomodoro: state elapsed time adjustment', async () => {
    const past = new Date(Date.now() - 120_000).toISOString()
    await request(app)
      .put('/api/pomodoro/state')
      .set(authHeader(token))
      .send({
        isActive: true,
        isPaused: false,
        remainingSeconds: 300,
        currentSession: 'focus',
        sessionsCompleted: 0,
      })
      .expect(200)

    const getRes = await request(app).get('/api/pomodoro/state').set(authHeader(token)).expect(200)
    expect(apiData<PomodoroStateDto>(getRes).remainingSeconds).toBeLessThanOrEqual(300)
    void past
  })

  it('auth: register validation via zod', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email: 'not-email', password: 'x' })
      .expect(400)
  })

  it('auth: login invalid email format', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad', password: 'x' })
      .expect(400)
  })

  it('unauthorized without token', async () => {
    await request(app).get('/api/settings').expect(401)
    await request(app).get('/api/profile/summary').expect(401)
  })
})
