import request from 'supertest'
import { app, authHeader, registerAndLogin, resetDatabase } from './helpers'

describe('CRUD endpoints', () => {
  let token: string

  beforeEach(async () => {
    await resetDatabase()
    ;({ token } = await registerAndLogin())
  })

  it('tasks CRUD with partial PUT', async () => {
    const listsRes = await request(app).get('/api/lists').set(authHeader(token)).expect(200)
    const listId = listsRes.body[0].id

    const createRes = await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Task A', listId, priority: 'high' })
      .expect(201)

    const taskId = createRes.body.id
    expect(createRes.body.title).toBe('Task A')

    await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(authHeader(token))
      .send({ completed: true })
      .expect(200)
      .then((res) => {
        expect(res.body.completed).toBe(true)
        expect(res.body.title).toBe('Task A')
      })

    await request(app)
      .put(`/api/tasks/${taskId}`)
      .set(authHeader(token))
      .send({
        subtasks: [{ id: 's1', title: 'Sub', completed: false }],
      })
      .expect(200)
      .then((res) => {
        expect(res.body.subtasks).toHaveLength(1)
        expect(res.body.completed).toBe(true)
      })

    await request(app).delete(`/api/tasks/${taskId}`).set(authHeader(token)).expect(204)
    await request(app).get(`/api/tasks/${taskId}`).set(authHeader(token)).expect(404)
  })

  it('lists CRUD with members', async () => {
    const createRes = await request(app)
      .post('/api/lists')
      .set(authHeader(token))
      .send({ name: 'Shared', color: '#fff', members: ['user-2'] })
      .expect(201)

    expect(createRes.body.members).toEqual(['user-2'])

    await request(app)
      .put(`/api/lists/${createRes.body.id}`)
      .set(authHeader(token))
      .send({ members: ['user-2', 'user-3'] })
      .expect(200)
      .then((res) => {
        expect(res.body.members).toHaveLength(2)
      })
  })

  it('habits complete is idempotent', async () => {
    const createRes = await request(app)
      .post('/api/habits')
      .set(authHeader(token))
      .send({ name: 'Read' })
      .expect(201)

    const habitId = createRes.body.id
    const date = '2026-06-01'

    await request(app)
      .post(`/api/habits/${habitId}/complete`)
      .set(authHeader(token))
      .send({ date })
      .expect(204)

    await request(app)
      .post(`/api/habits/${habitId}/complete`)
      .set(authHeader(token))
      .send({ date })
      .expect(204)

    const getRes = await request(app)
      .get(`/api/habits/${habitId}`)
      .set(authHeader(token))
      .expect(200)

    expect(getRes.body.completions.filter((d: string) => d === date)).toHaveLength(1)
  })

  it('countdown CRUD', async () => {
    const createRes = await request(app)
      .post('/api/countdown')
      .set(authHeader(token))
      .send({ title: 'Launch', targetDate: '2026-12-31T00:00:00.000Z' })
      .expect(201)

    await request(app)
      .get(`/api/countdown/${createRes.body.id}`)
      .set(authHeader(token))
      .expect(200)

    await request(app)
      .delete(`/api/countdown/${createRes.body.id}`)
      .set(authHeader(token))
      .expect(204)
  })

  it('pomodoro state returns 204 then 200', async () => {
    await request(app).get('/api/pomodoro/state').set(authHeader(token)).expect(204)

    await request(app)
      .put('/api/pomodoro/state')
      .set(authHeader(token))
      .send({
        isActive: true,
        isPaused: false,
        remainingSeconds: 1500,
        currentSession: 'focus',
        sessionsCompleted: 0,
      })
      .expect(200)
      .then((res) => {
        expect(res.body.remainingSeconds).toBe(1500)
      })

    await request(app).get('/api/pomodoro/state').set(authHeader(token)).expect(200)
  })

  it('settings get-or-create and update', async () => {
    const getRes = await request(app).get('/api/settings').set(authHeader(token)).expect(200)
    expect(getRes.body.language).toBe('en')

    await request(app)
      .put('/api/settings')
      .set(authHeader(token))
      .send({ language: 'vi', theme: 'dark' })
      .expect(200)
      .then((res) => {
        expect(res.body.language).toBe('vi')
        expect(res.body.theme).toBe('dark')
      })
  })

  it('AI analyze returns 400 for empty text', async () => {
    const res = await request(app)
      .post('/api/ai/tasks/analyze')
      .set(authHeader(token))
      .send({ text: '   ' })
      .expect(400)

    expect(res.body.message || res.body.error).toBeDefined()
  })

  it('health check returns 200', async () => {
    await request(app).get('/health').expect(200)
  })
})
