import { toJsonString } from './lib/json'
import { prisma } from './lib/prisma'

const DEFAULT_LISTS = [
  { name: 'Inbox', color: '#3b82f6' },
  { name: 'Work', color: '#8b5cf6' },
  { name: 'Personal', color: '#10b981' },
] as const

export async function seedDefaultListsForUser(userId: string): Promise<void> {
  // Bọc find + createMany trong transaction để tránh 2 request register đồng
  // thời cùng thấy list rỗng → tạo 2 bộ 3 list trùng nhau. Postgres isolation
  // mặc định đã ngăn duplicate ở mức row, nhưng transaction giúp fail-fast.
  await prisma.$transaction(async (tx) => {
    const existing = await tx.todoList.findMany({
      where: { userId },
      select: { id: true },
    })
    if (existing.length > 0) return

    await tx.todoList.createMany({
      data: DEFAULT_LISTS.map((list) => ({
        name: list.name,
        color: list.color,
        members: toJsonString([]),
        userId,
      })),
    })
  })
}
