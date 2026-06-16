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
})
