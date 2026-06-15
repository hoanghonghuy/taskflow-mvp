import request from 'supertest'
import { app } from '../helpers'
import { resetAuthRateLimitBuckets } from '../../src/middleware/auth-rate-limit'

describe('auth rate limit', () => {
  beforeEach(() => {
    resetAuthRateLimitBuckets()
  })

  it('returns 429 after exceeding login attempts for same email', async () => {
    const email = `ratelimit-${Date.now()}@test.com`
    const password = 'wrong-password'

    let lastStatus = 0
    // MAX_REQUESTS = 10; gửi 12 lần với cùng email → 2 lần cuối phải 429
    for (let i = 0; i < 12; i++) {
      const res = await request(app).post('/api/auth/login').send({ email, password })
      lastStatus = res.status
    }

    expect(lastStatus).toBe(429)
  })

  it('does not share bucket between different emails', async () => {
    const emailA = `ratelimit-a-${Date.now()}@test.com`
    const emailB = `ratelimit-b-${Date.now()}@test.com`

    // Dùng hết quota cho emailA
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/auth/login').send({ email: emailA, password: 'x' })
    }
    // emailA giờ phải 429
    const blocked = await request(app).post('/api/auth/login').send({ email: emailA, password: 'x' })
    expect(blocked.status).toBe(429)

    // emailB vẫn còn quota → 401 (invalid cred) chứ không phải 429
    const other = await request(app).post('/api/auth/login').send({ email: emailB, password: 'x' })
    expect(other.status).not.toBe(429)
  })

  it('applies rate limit to /api/auth/refresh as well', async () => {
    const payload = { refreshToken: 'fake-token' }
    let lastStatus = 0
    for (let i = 0; i < 12; i++) {
      const res = await request(app).post('/api/auth/refresh').send(payload)
      lastStatus = res.status
    }
    expect(lastStatus).toBe(429)
  })
})
