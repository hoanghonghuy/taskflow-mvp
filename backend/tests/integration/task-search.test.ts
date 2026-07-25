import request from 'supertest'
import { app, authHeader, registerAndLogin, resetDatabase, apiData } from '../helpers'

type ListRef = { id: string }
type TaskDto = {
  id: string
  title: string
  description?: string | null
  tags?: string[]
  subtasks?: Array<{ id: string; title: string; completed: boolean }>
  comments?: Array<{ id: string; content: string }>
}

describe('Task search API', () => {
  let token: string
  let listId: string

  beforeEach(async () => {
    await resetDatabase()
    ;({ token } = await registerAndLogin())
    const listsRes = await request(app).get('/api/lists').set(authHeader(token)).expect(200)
    listId = apiData<ListRef[]>(listsRes)[0].id
  })

  it('returns tasks matching title, tag, subtask, and comment', async () => {
    await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({
        title: 'Pay electricity bill',
        listId,
        tags: ['finance'],
        subtasks: [{ id: 's1', title: 'Check meter reading', completed: false }],
        comments: [{ id: 'c1', userId: 'u1', content: 'Ask landlord for receipt', timestamp: '2026-06-01' }],
      })
      .expect(201)

    await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({ title: 'Buy groceries', listId })
      .expect(201)

    const byTitle = await request(app)
      .get('/api/tasks/search')
      .query({ q: 'electricity' })
      .set(authHeader(token))
      .expect(200)
    expect(apiData<TaskDto[]>(byTitle)).toHaveLength(1)
    expect(apiData<TaskDto[]>(byTitle)[0].title).toContain('electricity')

    const byTag = await request(app)
      .get('/api/tasks/search')
      .query({ q: 'finance' })
      .set(authHeader(token))
      .expect(200)
    expect(apiData<TaskDto[]>(byTag)).toHaveLength(1)

    const bySubtask = await request(app)
      .get('/api/tasks/search')
      .query({ q: 'meter' })
      .set(authHeader(token))
      .expect(200)
    expect(apiData<TaskDto[]>(bySubtask)).toHaveLength(1)

    const byComment = await request(app)
      .get('/api/tasks/search')
      .query({ q: 'landlord' })
      .set(authHeader(token))
      .expect(200)
    expect(apiData<TaskDto[]>(byComment)).toHaveLength(1)
  })

  it('returns empty array for blank query validation error', async () => {
    await request(app).get('/api/tasks/search').query({ q: '   ' }).set(authHeader(token)).expect(400)
  })

  it('does not treat /search as task id route', async () => {
    await request(app).get('/api/tasks/search').query({ q: 'anything' }).set(authHeader(token)).expect(200)
  })

  it('does not match JSON metadata keys like completed or id', async () => {
    await request(app)
      .post('/api/tasks')
      .set(authHeader(token))
      .send({
        title: 'Plain task',
        listId,
        subtasks: [{ id: 's-uuid-1', title: 'Only real title', completed: false }],
        comments: [{ id: 'c-uuid-1', userId: 'u1', content: 'Only real content', timestamp: '2026-06-01' }],
      })
      .expect(201)

    const byCompleted = await request(app)
      .get('/api/tasks/search')
      .query({ q: 'completed' })
      .set(authHeader(token))
      .expect(200)
    expect(apiData<TaskDto[]>(byCompleted)).toHaveLength(0)

    const byIdFragment = await request(app)
      .get('/api/tasks/search')
      .query({ q: 's-uuid' })
      .set(authHeader(token))
      .expect(200)
    expect(apiData<TaskDto[]>(byIdFragment)).toHaveLength(0)

    const byRealSubtask = await request(app)
      .get('/api/tasks/search')
      .query({ q: 'Only real title' })
      .set(authHeader(token))
      .expect(200)
    expect(apiData<TaskDto[]>(byRealSubtask)).toHaveLength(1)
  })

  it('still returns a title match when JSON-metadata-only hits fill the fetch window', async () => {
    const { prisma } = await import('../../src/lib/prisma')
    const me = await request(app).get('/api/auth/me').set(authHeader(token)).expect(200)
    const userId = (me.body.data ?? me.body).id as string

    // 200 tasks whose subtasks JSON contains "completed" (DB contains match)
    // but user-facing filter rejects them. Created first → low sortOrder → fill take:200.
    const decoys = Array.from({ length: 200 }, (_, i) => ({
      id: `decoy-${i}`,
      userId,
      listId,
      title: `Decoy ${i}`,
      description: null as string | null,
      completed: false,
      priority: 'none',
      sortOrder: i,
      tags: '[]',
      subtasks: JSON.stringify([{ id: `s-${i}`, title: 'Do work', completed: false }]),
      comments: '[]',
    }))
    await prisma.todoTask.createMany({ data: decoys })

    // Real title match created last → high sortOrder → outside fetch window of 200.
    await prisma.todoTask.create({
      data: {
        id: 'title-hit',
        userId,
        listId,
        title: 'completed homework',
        sortOrder: 9999,
        tags: '[]',
        subtasks: '[]',
        comments: '[]',
      },
    })

    const res = await request(app)
      .get('/api/tasks/search')
      .query({ q: 'completed', limit: 20 })
      .set(authHeader(token))
      .expect(200)

    const hits = apiData<TaskDto[]>(res)
    expect(hits.some((t) => t.title.toLowerCase().includes('completed'))).toBe(true)
  })
})
