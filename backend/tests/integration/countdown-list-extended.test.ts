import request from 'supertest'
import { apiData, app, authHeader, registerAndLogin, resetDatabase } from '../helpers'

describe('Countdown API Extended', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('GET /api/countdown returns empty array initially', async () => {
    const { token } = await registerAndLogin()

    const res = await request(app)
      .get('/api/countdown')
      .set(authHeader(token))
      .expect(200)

    const countdowns = apiData<Array<{ id: string }>>(res)
    expect(Array.isArray(countdowns)).toBe(true)
  })

  it('POST /api/countdown creates countdown', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/countdown')
      .set(authHeader(token))
      .send({
        title: 'Launch Day',
        targetDate: '2026-12-31T00:00:00Z',
        color: 'blue',
      })
      .expect(201)

    const countdown = apiData<{ id: string; title: string; color?: string }>(createRes)
    expect(countdown.title).toBe('Launch Day')
    expect(countdown.color).toBe('blue')
  })

  it('POST /api/countdown without title uses default', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/countdown')
      .set(authHeader(token))
      .send({
        targetDate: '2026-12-31T00:00:00Z',
      })
      .expect(201)

    const countdown = apiData<{ id: string; title: string }>(createRes)
    expect(countdown.title).toBeTruthy()
  })

  it('POST /api/countdown without targetDate uses default', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/countdown')
      .set(authHeader(token))
      .send({
        title: 'Event',
      })
      .expect(201)

    const countdown = apiData<{ id: string; targetDate: string }>(createRes)
    expect(countdown.targetDate).toBeTruthy()
  })

  it('PUT /api/countdown/:id updates targetDate', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/countdown')
      .set(authHeader(token))
      .send({ title: 'Event', targetDate: '2026-12-31T00:00:00Z' })
      .expect(201)

    const countdown = apiData<{ id: string }>(createRes)

    const updateRes = await request(app)
      .put(`/api/countdown/${countdown.id}`)
      .set(authHeader(token))
      .send({ targetDate: '2027-01-01T00:00:00Z' })
      .expect(200)

    const updated = apiData<{ targetDate: string }>(updateRes)
    expect(updated.targetDate).toContain('2027-01-01')
  })

  it('PUT /api/countdown/:id updates color', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/countdown')
      .set(authHeader(token))
      .send({ title: 'Event', targetDate: '2026-12-31T00:00:00Z' })
      .expect(201)

    const countdown = apiData<{ id: string }>(createRes)

    const updateRes = await request(app)
      .put(`/api/countdown/${countdown.id}`)
      .set(authHeader(token))
      .send({ color: 'red' })
      .expect(200)

    const updated = apiData<{ color?: string }>(updateRes)
    expect(updated.color).toBe('red')
  })
})

describe('List API Extended', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('GET /api/lists/:id returns list details', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/lists')
      .set(authHeader(token))
      .send({ name: 'My List', color: '#fff', members: [] })
      .expect(201)

    const list = apiData<{ id: string }>(createRes)

    const getRes = await request(app)
      .get(`/api/lists/${list.id}`)
      .set(authHeader(token))
      .expect(200)

    const fetched = apiData<{ id: string; name: string }>(getRes)
    expect(fetched.id).toBe(list.id)
    expect(fetched.name).toBe('My List')
  })

  it('POST /api/lists creates with defaults', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/lists')
      .set(authHeader(token))
      .send({ name: 'Minimal List' })
      .expect(201)

    const list = apiData<{ id: string; name: string; members: string[] }>(createRes)
    expect(list.name).toBe('Minimal List')
    expect(Array.isArray(list.members)).toBe(true)
  })

  it('PUT /api/lists/:id updates name', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/lists')
      .set(authHeader(token))
      .send({ name: 'Old Name', color: '#fff', members: [] })
      .expect(201)

    const list = apiData<{ id: string }>(createRes)

    const updateRes = await request(app)
      .put(`/api/lists/${list.id}`)
      .set(authHeader(token))
      .send({ name: 'New Name' })
      .expect(200)

    const updated = apiData<{ name: string }>(updateRes)
    expect(updated.name).toBe('New Name')
  })

  it('PUT /api/lists/:id updates color', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/lists')
      .set(authHeader(token))
      .send({ name: 'List', color: '#fff', members: [] })
      .expect(201)

    const list = apiData<{ id: string }>(createRes)

    const updateRes = await request(app)
      .put(`/api/lists/${list.id}`)
      .set(authHeader(token))
      .send({ color: '#000' })
      .expect(200)

    const updated = apiData<{ color: string }>(updateRes)
    expect(updated.color).toBe('#000')
  })

  it('PUT /api/lists/:id updates members', async () => {
    const { token } = await registerAndLogin()

    const createRes = await request(app)
      .post('/api/lists')
      .set(authHeader(token))
      .send({ name: 'List', members: [] })
      .expect(201)

    const list = apiData<{ id: string }>(createRes)

    const updateRes = await request(app)
      .put(`/api/lists/${list.id}`)
      .set(authHeader(token))
      .send({ members: [] })
      .expect(200)

    const updated = apiData<{ members: string[] }>(updateRes)
    expect(Array.isArray(updated.members)).toBe(true)
  })
})
