import request from 'supertest'

type AuthPayload = {
  user: { id: string; name: string; email: string }
  token: string
  refreshToken: string
}
type RefreshPayload = { token: string; refreshToken: string }

import { app, authHeader, registerAndLogin, resetDatabase, apiData } from './helpers'

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

    expect(apiData<AuthPayload>(registerRes)).toMatchObject({
      user: { name: 'Auth User', email },
    })
    expect(apiData<AuthPayload>(registerRes).user?.id).toBeDefined()
    expect(apiData<AuthPayload>(registerRes).token).toBeTruthy()
    expect(apiData<AuthPayload>(registerRes).refreshToken).toBeTruthy()

    const registerToken = apiData<AuthPayload>(registerRes).token as string
    await request(app)
      .get('/api/tasks')
      .set(authHeader(registerToken))
      .expect(200)

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)

    const { token, refreshToken } = apiData<AuthPayload>(loginRes)
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

    expect(apiData<RefreshPayload>(refreshRes).token).toBeTruthy()
    expect(apiData<RefreshPayload>(refreshRes).refreshToken).not.toBe(refreshToken)

    await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(401)
  })

  it('returns current user from /api/auth/me and supports profile update + logout', async () => {
    const { token } = await registerAndLogin('me@test.com', 'TestPassword123!')

    const meRes = await request(app).get('/api/auth/me').set(authHeader(token)).expect(200)
    expect(apiData<{ email: string }>(meRes).email).toBe('me@test.com')

    const patchRes = await request(app)
      .patch('/api/auth/me')
      .set(authHeader(token))
      .send({ name: 'Updated Name' })
      .expect(200)

    expect(apiData<{ name: string }>(patchRes).name).toBe('Updated Name')

    await request(app).post('/api/auth/logout').set(authHeader(token)).expect(200)
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

  it('looks up user by email for list sharing', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Invite Target', email: 'invite-target@test.com', password: 'TestPassword123!' })
      .expect(200)

    const { token } = await registerAndLogin('inviter@test.com')

    const found = await request(app)
      .get('/api/auth/users/lookup')
      .query({ email: 'invite-target@test.com' })
      .set(authHeader(token))
      .expect(200)

    expect(apiData<{ email: string }>(found).email).toBe('invite-target@test.com')

    await request(app)
      .get('/api/auth/users/lookup')
      .query({ email: 'inviter@test.com' })
      .set(authHeader(token))
      .expect(400)

    await request(app)
      .get('/api/auth/users/lookup')
      .query({ email: 'missing@test.com' })
      .set(authHeader(token))
      .expect(404)
  })

  it('seeds default lists on register', async () => {
    const { token } = await registerAndLogin('lists@test.com')
    const res = await request(app).get('/api/lists').set(authHeader(token)).expect(200)
    expect(apiData<Array<{ name: string }>>(res)).toHaveLength(3)
    expect(apiData<Array<{ name: string }>>(res).map((l: { name: string }) => l.name)).toEqual(
      expect.arrayContaining(['Inbox', 'Work', 'Personal']),
    )
  })
})
