import request from 'supertest'
import { createApp } from '../src/app'
import { prisma } from '../src/lib/prisma'

export const app = createApp()

/** Unwrap `{ success: true, data }` from API responses */
export function apiData<T>(res: { body: unknown }): T {
  const body = res.body as { success?: boolean; data?: T }
  if (body?.success === true && 'data' in body) {
    return body.data as T
  }
  return res.body as T
}

export async function resetDatabase(): Promise<void> {
  await prisma.refreshToken.deleteMany()
  await prisma.pomodoroSession.deleteMany()
  await prisma.countdownEvent.deleteMany()
  await prisma.todoTask.deleteMany()
  await prisma.habit.deleteMany()
  await prisma.todoList.deleteMany()
  await prisma.userSettings.deleteMany()
  await prisma.user.deleteMany()
}

export async function registerAndLogin(
  email = `user-${Date.now()}@test.com`,
  password = 'TestPassword123!',
  name = 'Test User',
): Promise<{ token: string; refreshToken: string; userId: string }> {
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password })
    .expect(200)

  const data = apiData<{
    token: string
    refreshToken: string
    user: { id: string }
  }>(registerRes)

  return {
    token: data.token,
    refreshToken: data.refreshToken,
    userId: data.user.id,
  }
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` }
}
