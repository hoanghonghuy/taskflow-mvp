import request from 'supertest'
import { prisma } from '../../src/lib/prisma'
import { app } from '../helpers'

describe('Health check', () => {
  afterEach(async () => {
    jest.restoreAllMocks()
  })

  it('returns 200 when database is healthy', async () => {
    await request(app).get('/health').expect(200)
  })

  it('returns 503 when database query fails', async () => {
    jest.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('db down'))
    await request(app).get('/health').expect(503)
  })
})
