import request from 'supertest'
import { app, authHeader, registerAndLogin, resetDatabase } from './helpers'
import { getProfileSummary, getAchievements } from '../src/services/profileService'
import { prisma } from '../src/lib/prisma'

describe('Profile', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('summary and achievements stay consistent', async () => {
    const { token, userId } = await registerAndLogin()

    await prisma.todoTask.create({
      data: {
        title: 'Done task',
        completed: true,
        userId,
        listId: 'inbox',
      },
    })

    const summaryRes = await request(app)
      .get('/api/profile/summary')
      .set(authHeader(token))
      .expect(200)

    const achievementsRes = await request(app)
      .get('/api/profile/achievements')
      .set(authHeader(token))
      .expect(200)

    expect(summaryRes.body.totalTasks).toBe(1)
    expect(summaryRes.body.completionRate).toBe(100)
    expect(summaryRes.body.unlockedAchievements).toBe(achievementsRes.body.length)
    expect(achievementsRes.body).toContain('first-task')
  })

  it('completionRate is 0 when no tasks', async () => {
    const { userId } = await registerAndLogin('empty@test.com')
    const summary = await getProfileSummary(userId)
    expect(summary.completionRate).toBe(0)
  })

  it('classifies due dates into today vs upcoming', async () => {
    const { userId } = await registerAndLogin('due@test.com')
    const today = new Date().toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    await prisma.todoTask.createMany({
      data: [
        { title: 'Today', dueDate: new Date(today), completed: false, userId, listId: 'inbox' },
        { title: 'Tomorrow', dueDate: new Date(tomorrow), completed: false, userId, listId: 'inbox' },
      ],
    })

    const summary = await getProfileSummary(userId)
    expect(summary.todayTasksPending).toBe(1)
    expect(summary.upcomingTasksPending).toBe(1)
  })

  it('awards focus-1h achievement', async () => {
    const { userId } = await registerAndLogin('focus@test.com')

    await prisma.pomodoroSession.create({
      data: {
        startTime: new Date(),
        durationSeconds: 3600,
        type: 'focus',
        userId,
      },
    })

    const achievements = await getAchievements(userId)
    expect(achievements).toContain('focus-1h')
  })
})
