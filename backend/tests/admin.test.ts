import request from 'supertest'
import {
  apiData,
  app,
  authHeader,
  registerAndLogin,
  registerAndLoginAdmin,
  resetDatabase,
} from './helpers'

describe('Admin API', () => {
  beforeEach(async () => {
    await resetDatabase()
  })
  it('denies regular users from admin stats', async () => {
    const { token } = await registerAndLogin()

    const res = await request(app)
      .get('/api/admin/stats')
      .set(authHeader(token))
      .expect(403)

    expect(res.body).toMatchObject({ error: 'forbidden' })
  })

  it('returns stats for admin', async () => {
    const { token } = await registerAndLoginAdmin()

    const res = await request(app)
      .get('/api/admin/stats')
      .set(authHeader(token))
      .expect(200)

    const stats = apiData<{
      totalUsers: number
      totalTasks: number
      totalHabits: number
      newUsersLast7Days: number
    }>(res)

    expect(stats.totalUsers).toBeGreaterThanOrEqual(1)
    expect(typeof stats.totalTasks).toBe('number')
    expect(typeof stats.totalHabits).toBe('number')
    expect(typeof stats.newUsersLast7Days).toBe('number')
  })

  it('lists users and supports role update', async () => {
    const userSession = await registerAndLogin()
    const { token: adminToken } = await registerAndLoginAdmin()

    const listRes = await request(app)
      .get('/api/admin/users')
      .set(authHeader(adminToken))
      .expect(200)

    const list = apiData<{
      items: Array<{ id: string; role: string }>
      total: number
    }>(listRes)

    expect(list.total).toBeGreaterThanOrEqual(2)
    expect(list.items.some((u) => u.id === userSession.userId)).toBe(true)

    const patchRes = await request(app)
      .patch(`/api/admin/users/${userSession.userId}`)
      .set(authHeader(adminToken))
      .send({ role: 'ADMIN' })
      .expect(200)

    const updated = apiData<{ role: string }>(patchRes)
    expect(updated.role).toBe('ADMIN')
  })

  it('returns user detail and can delete another user', async () => {
    const userSession = await registerAndLogin()
    const { token: adminToken } = await registerAndLoginAdmin()

    const detailRes = await request(app)
      .get(`/api/admin/users/${userSession.userId}`)
      .set(authHeader(adminToken))
      .expect(200)

    const detail = apiData<{ email: string; taskCount: number }>(detailRes)
    expect(detail.email).toBeTruthy()
    expect(typeof detail.taskCount).toBe('number')

    await request(app)
      .delete(`/api/admin/users/${userSession.userId}`)
      .set(authHeader(adminToken))
      .expect(200)
  })

  it('prevents admin from deleting own account', async () => {
    const { token, userId } = await registerAndLoginAdmin()

    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set(authHeader(token))
      .expect(400)

    expect(res.body).toMatchObject({ success: false })
  })
})
