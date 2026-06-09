import { prisma } from './lib/prisma'
import { toJsonString } from './lib/json'

const DEFAULT_LISTS = [
  { name: 'Inbox', color: '#3b82f6' },
  { name: 'Work', color: '#8b5cf6' },
  { name: 'Personal', color: '#10b981' },
] as const

export async function seedDefaultListsForUser(userId: string): Promise<void> {
  const count = await prisma.todoList.count({ where: { userId } })
  if (count > 0) return

  await prisma.todoList.createMany({
    data: DEFAULT_LISTS.map((list) => ({
      name: list.name,
      color: list.color,
      members: toJsonString([]),
      userId,
    })),
  })
}
