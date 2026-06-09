import request from 'supertest'
import { app, authHeader, registerAndLogin, resetDatabase } from './helpers'

describe('Auth', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('registers, logs in, accesses protected route, and refreshes token', async () => {
    const email = 'auth-flow@test.com'
    const password = 'TestPassword123!'

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Auth User', email, password })
      .expect(200)

    expect(registerRes.body).toMatchObject({
      user: { name: 'Auth User', email },
    })
    expect(registerRes.body.user?.id).toBeDefined()
    expect(registerRes.body.token).toBeTruthy()
    expect(registerRes.body.refreshToken).toBeTruthy()

    const registerToken = registerRes.body.token as string
    await request(app)
      .get('/api/tasks')
      .set(authHeader(registerToken))
      .expect(200)

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)

    const { token, refreshToken } = loginRes.body
    expect(token).toBeTruthy()
    expect(refreshToken).toBeTruthy()

    await request(app)
      .get('/api/tasks')
      .set(authHeader(token))
      .expect(200)

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200)

    expect(refreshRes.body.token).toBeTruthy()
    expect(refreshRes.body.refreshToken).not.toBe(refreshToken)

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401)
  })

  it('returns 409 for duplicate email', async () => {
    const email = 'dup@test.com'
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'A', email, password: 'TestPassword123!' })
      .expect(200)

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'B', email, password: 'TestPassword123!' })
      .expect(409)

    expect(res.body.error).toBeDefined()
  })

  it('returns 401 for invalid login and missing token', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'wrong' })
      .expect(401)

    await request(app).get('/api/tasks').expect(401)
  })

  it('returns 400 when refresh token is missing', async () => {
    const res = await request(app).post('/api/auth/refresh').send({}).expect(400)
    expect(res.body.error).toBeDefined()
  })

  it('seeds default lists on register', async () => {
    const { token } = await registerAndLogin('lists@test.com')
    const res = await request(app).get('/api/lists').set(authHeader(token)).expect(200)
    expect(res.body).toHaveLength(3)
    expect(res.body.map((l: { name: string }) => l.name)).toEqual(
      expect.arrayContaining(['Inbox', 'Work', 'Personal']),
    )
  })
})
