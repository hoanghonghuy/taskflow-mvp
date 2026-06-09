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
