import { prisma } from '../../src/lib/prisma'
import { hashPassword, verifyPassword } from '../../src/lib/password'
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

    const [tasks, highPriorityTasks, completedTasks, habits, countdowns, sessions, settings] =
      await Promise.all([
      prisma.todoTask.count({ where: { userId: user!.id } }),
      prisma.todoTask.count({
        where: { userId: user!.id, priority: { in: ['high', 'urgent'] } },
      }),
      prisma.todoTask.count({ where: { userId: user!.id, completed: true } }),
      prisma.habit.count({ where: { userId: user!.id } }),
      prisma.countdownEvent.count({ where: { userId: user!.id } }),
      prisma.pomodoroSession.count({ where: { userId: user!.id } }),
      prisma.userSettings.findUnique({ where: { userId: user!.id } }),
      ])

    expect(tasks).toBeGreaterThanOrEqual(18)
    expect(highPriorityTasks).toBeGreaterThanOrEqual(6)
    expect(completedTasks).toBeGreaterThanOrEqual(6)
    expect(habits).toBe(4)
    expect(countdowns).toBe(3)
    expect(sessions).toBeGreaterThanOrEqual(12)
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
    expect(tasks).toBe(22)
  })

  it('does not downgrade ADMIN role when DEMO_EMAIL collides with admin', async () => {
    const { seedAdminUser } = await import('../../src/seedAdmin')
    process.env.ADMIN_EMAIL = 'shared@test.com'
    process.env.ADMIN_PASSWORD = 'AdminPass123!'

    await seedAdminUser()
    const admin = await prisma.user.findUnique({ where: { email: 'shared@test.com' } })
    expect(admin?.role).toBe('ADMIN')

    process.env.DEMO_EMAIL = 'shared@test.com'
    process.env.DEMO_PASSWORD = 'DemoPass123!'

    const { seedDemoUser } = await import('../../src/seedDemoUser')
    await seedDemoUser()

    const after = await prisma.user.findUnique({ where: { email: 'shared@test.com' } })
    expect(after?.role).toBe('ADMIN')
    expect(after?.id).toBe(admin?.id)
  })

  it('preserves user-changed password on subsequent restarts (demo)', async () => {
    process.env.DEMO_EMAIL = 'demo-pw@test.com'
    process.env.DEMO_PASSWORD = 'EnvPass123!'

    const { seedDemoUser } = await import('../../src/seedDemoUser')
    await seedDemoUser()
    const userId = (await prisma.user.findUnique({ where: { email: 'demo-pw@test.com' } }))!.id

    // Mô phỏng user đổi mật khẩu qua UI
    const newHash = await hashPassword('UserChangedPass123!')
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } })

    // Restart: DEMO_PASSWORD vẫn là env value, không khớp hash hiện tại
    await seedDemoUser()

    const after = await prisma.user.findUnique({ where: { id: userId } })
    expect(await verifyPassword('UserChangedPass123!', after!.passwordHash)).toBe(true)
    expect(await verifyPassword('EnvPass123!', after!.passwordHash)).toBe(false)
  })
})

describe('seedAdminUser', () => {
  const envBackup = { ...process.env }

  beforeEach(async () => {
    await resetDatabase()
    process.env = { ...envBackup }
  })

  afterAll(() => {
    process.env = envBackup
  })

  it('creates admin user with env credentials on first run', async () => {
    process.env.ADMIN_EMAIL = 'admin-first@test.com'
    process.env.ADMIN_PASSWORD = 'AdminPass123!'
    process.env.ADMIN_NAME = 'First Admin'

    const { seedAdminUser } = await import('../../src/seedAdmin')
    await seedAdminUser()

    const user = await prisma.user.findUnique({ where: { email: 'admin-first@test.com' } })
    expect(user?.role).toBe('ADMIN')
    expect(user?.name).toBe('First Admin')
    expect(await verifyPassword('AdminPass123!', user!.passwordHash)).toBe(true)
  })

  it('does not demote other admins on subsequent restarts', async () => {
    process.env.ADMIN_EMAIL = 'env-admin@test.com'
    process.env.ADMIN_PASSWORD = 'AdminPass123!'

    const { seedAdminUser } = await import('../../src/seedAdmin')
    // Lần đầu: tạo env-admin, có thể demote admin khác (auto-cleanup first run)
    await seedAdminUser()

    // Sau đó operator tạo 1 admin khác (giả lập)
    const operatorAdmin = await prisma.user.create({
      data: {
        name: 'Operator',
        email: 'operator@test.com',
        passwordHash: await hashPassword('OperatorPass123!'),
        role: 'ADMIN',
      },
    })

    // Restart thứ 2: env-admin đã tồn tại → KHÔNG gọi demoteExtraAdmins
    await seedAdminUser()

    const after = await prisma.user.findUnique({ where: { id: operatorAdmin.id } })
    expect(after?.role).toBe('ADMIN')
  })

  it('preserves admin-changed password on subsequent restarts', async () => {
    process.env.ADMIN_EMAIL = 'admin-pw@test.com'
    process.env.ADMIN_PASSWORD = 'EnvAdminPass123!'

    const { seedAdminUser } = await import('../../src/seedAdmin')
    await seedAdminUser()
    const userId = (await prisma.user.findUnique({ where: { email: 'admin-pw@test.com' } }))!.id

    // Admin đổi mật khẩu qua UI
    const newHash = await hashPassword('AdminChangedPass123!')
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } })

    // Restart: env password không khớp hash hiện tại
    await seedAdminUser()

    const after = await prisma.user.findUnique({ where: { id: userId } })
    expect(await verifyPassword('AdminChangedPass123!', after!.passwordHash)).toBe(true)
  })
})
