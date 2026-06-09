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

  it('returns extended stats for admin', async () => {
    await registerAndLogin()
    const { token } = await registerAndLoginAdmin()

    const res = await request(app)
      .get('/api/admin/stats')
      .set(authHeader(token))
      .expect(200)

    const stats = apiData<{
      totalUsers: number
      regularUsers: number
      totalTasks: number
      totalHabits: number
      totalLists: number
      totalPomodoroSessions: number
      totalCountdowns: number
      newUsersLast7Days: number
      recentUsers: Array<{ id: string; role: string }>
    }>(res)

    expect(stats.totalUsers).toBeGreaterThanOrEqual(2)
    expect(stats.regularUsers).toBeGreaterThanOrEqual(1)
    expect(typeof stats.totalTasks).toBe('number')
    expect(typeof stats.totalHabits).toBe('number')
    expect(typeof stats.totalLists).toBe('number')
    expect(Array.isArray(stats.recentUsers)).toBe(true)
  })

  it('lists regular users by default role filter', async () => {
    const userSession = await registerAndLogin()
    const { token: adminToken } = await registerAndLoginAdmin()

    const listRes = await request(app)
      .get('/api/admin/users?role=USER')
      .set(authHeader(adminToken))
      .expect(200)

    const list = apiData<{
      items: Array<{ id: string; role: string }>
      total: number
    }>(listRes)

    expect(list.total).toBeGreaterThanOrEqual(1)
    expect(list.items.some((u) => u.id === userSession.userId)).toBe(true)
    expect(list.items.every((u) => u.role === 'USER')).toBe(true)
  })

  it('updates a regular user profile', async () => {
    const userSession = await registerAndLogin()
    const { token: adminToken } = await registerAndLoginAdmin()

    const patchRes = await request(app)
      .patch(`/api/admin/users/${userSession.userId}`)
      .set(authHeader(adminToken))
      .send({ name: 'Updated Name', email: 'updated@test.com' })
      .expect(200)

    const updated = apiData<{ name: string; email: string; role: string }>(patchRes)
    expect(updated.name).toBe('Updated Name')
    expect(updated.email).toBe('updated@test.com')
    expect(updated.role).toBe('USER')
  })

  it('prevents modifying the system admin account', async () => {
    const { token, userId } = await registerAndLoginAdmin()

    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set(authHeader(token))
      .send({ name: 'Hacked Admin' })
      .expect(400)

    expect(res.body).toMatchObject({ success: false })
  })

  it('returns user detail and can delete another user', async () => {
    const userSession = await registerAndLogin()
    const { token: adminToken } = await registerAndLoginAdmin()

    const detailRes = await request(app)
      .get(`/api/admin/users/${userSession.userId}`)
      .set(authHeader(adminToken))
      .expect(200)

    const detail = apiData<{
      email: string
      taskCount: number
      countdownCount: number
    }>(detailRes)
    expect(detail.email).toBeTruthy()
    expect(typeof detail.taskCount).toBe('number')
    expect(typeof detail.countdownCount).toBe('number')

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

  it('prevents deleting the system admin account', async () => {
    const userSession = await registerAndLogin()
    const { token: adminToken, userId: adminId } = await registerAndLoginAdmin()

    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set(authHeader(adminToken))
      .expect(400)

    expect(res.body).toMatchObject({ success: false })

    // Sanity: regular user still deletable
    await request(app)
      .delete(`/api/admin/users/${userSession.userId}`)
      .set(authHeader(adminToken))
      .expect(200)
  })
})
