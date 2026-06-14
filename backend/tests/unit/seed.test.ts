import { prisma } from '../../src/lib/prisma'
import { seedDefaultListsForUser } from '../../src/seed'
import { resetDatabase } from '../helpers'

describe('seed', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('creates default lists for new user', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Seed User',
        email: 'seed@test.com',
        passwordHash: 'hash',
      },
    })

    await seedDefaultListsForUser(user.id)
    const lists = await prisma.todoList.findMany({ where: { userId: user.id } })
    expect(lists).toHaveLength(3)
    expect(lists.map((l) => l.name).sort()).toEqual(['Inbox', 'Personal', 'Work'])
  })

  it('is idempotent when lists already exist', async () => {
    const user = await prisma.user.create({
      data: { name: 'U', email: 'u2@test.com', passwordHash: 'hash' },
    })

    await seedDefaultListsForUser(user.id)
    await seedDefaultListsForUser(user.id)
    const count = await prisma.todoList.count({ where: { userId: user.id } })
    expect(count).toBe(3)
  })
})

describe('seedDemoUser', () => {
  const envBackup = { ...process.env }

  beforeEach(async () => {
    await resetDatabase()
    process.env = { ...envBackup }
  })

  afterAll(() => {
    process.env = envBackup
  })

  it('creates demo user with rich sample data', async () => {
    process.env.DEMO_EMAIL = 'demo-seed@test.com'
    process.env.DEMO_PASSWORD = 'DemoPass123!'
    process.env.DEMO_NAME = 'Seed Demo'

    const { seedDemoUser } = await import('../../src/seedDemoUser')
    await seedDemoUser()

    const user = await prisma.user.findUnique({ where: { email: 'demo-seed@test.com' } })
    expect(user?.role).toBe('USER')

    const [tasks, habits, countdowns, sessions, settings] = await Promise.all([
      prisma.todoTask.count({ where: { userId: user!.id } }),
      prisma.habit.count({ where: { userId: user!.id } }),
      prisma.countdownEvent.count({ where: { userId: user!.id } }),
      prisma.pomodoroSession.count({ where: { userId: user!.id } }),
      prisma.userSettings.findUnique({ where: { userId: user!.id } }),
    ])

    expect(tasks).toBeGreaterThanOrEqual(10)
    expect(habits).toBe(4)
    expect(countdowns).toBe(3)
    expect(sessions).toBeGreaterThanOrEqual(8)
    expect(settings?.language).toBe('vi')
    expect(settings?.boardColumnsJson).toContain('demo-col-backlog')
  })

  it('skips re-seeding when demo user already has tasks', async () => {
    process.env.DEMO_EMAIL = 'demo-idempotent@test.com'
    process.env.DEMO_PASSWORD = 'DemoPass123!'

    const { seedDemoUser } = await import('../../src/seedDemoUser')
    await seedDemoUser()
    await seedDemoUser()

    const user = await prisma.user.findUnique({ where: { email: 'demo-idempotent@test.com' } })
    const tasks = await prisma.todoTask.count({ where: { userId: user!.id } })
    expect(tasks).toBe(11)
  })
})
