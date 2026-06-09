import * as fc from 'fast-check'
import request from 'supertest'
import { app, authHeader, registerAndLogin, resetDatabase, apiData } from './helpers'
import { getProfileSummary } from '../src/services/profileService'
import { prisma } from '../src/lib/prisma'

describe('Property-based tests', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('round-trip CRUD preserves client fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        async (title) => {
          const { token } = await registerAndLogin(`rt-${title.replace(/\W/g, '')}-${Date.now()}@test.com`)

          const createRes = await request(app)
            .post('/api/tasks')
            .set(authHeader(token))
            .send({ title: title.trim() })
            .expect(201)

          const getRes = await request(app)
            .get(`/api/tasks/${apiData<{ id: string }>(createRes).id}`)
            .set(authHeader(token))
            .expect(200)

          expect(apiData<{ title: string }>(getRes).title).toBe(title.trim())
        },
      ),
      { numRuns: 3 },
    )
  }, 30000)

  it('tenant isolation: user B cannot access user A resources', async () => {
    const { token: tokenA } = await registerAndLogin('usera@test.com')
    const createRes = await request(app)
      .post('/api/tasks')
      .set(authHeader(tokenA))
      .send({ title: 'Private' })
      .expect(201)

    const { token: tokenB } = await registerAndLogin('userb@test.com')
    await request(app)
      .get(`/api/tasks/${apiData<{ id: string }>(createRes).id}`)
      .set(authHeader(tokenB))
      .expect(404)
  })

  it('completionRate is always between 0 and 100', async () => {
    const total = 8
    const completed = 3
    const { userId } = await registerAndLogin(`rate-${Date.now()}@test.com`)

    for (let i = 0; i < total; i++) {
      await prisma.todoTask.create({
        data: {
          title: `T${i}`,
          completed: i < completed,
          userId,
          listId: 'inbox',
        },
      })
    }

    const summary = await getProfileSummary(userId)
    expect(summary.completionRate).toBeGreaterThanOrEqual(0)
    expect(summary.completionRate).toBeLessThanOrEqual(100)
    expect(summary.completionRate).toBe(Math.round((completed * 100) / total))
  })
})
