import { hashPassword } from './lib/password'
import { prisma } from './lib/prisma'
import { seedDefaultListsForUser } from './seed'

export async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD?.trim()
  const name = process.env.ADMIN_NAME?.trim() || 'System Admin'

  if (!email || !password) {
    return
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    if (existing.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN' },
      })
      console.log(`[seed] Promoted existing user to ADMIN: ${email}`)
    }
    return
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
    },
  })

  await seedDefaultListsForUser(user.id)
  console.log(`[seed] Created ADMIN user: ${email}`)
}
