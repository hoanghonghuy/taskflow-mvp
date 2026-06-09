import { hashPassword } from './lib/password'
import { prisma } from './lib/prisma'
import * as adminRepository from './repositories/adminRepository'
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
  } else {
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

  const demoted = await adminRepository.demoteExtraAdmins(email)
  if (demoted > 0) {
    console.log(`[seed] Demoted ${demoted} extra ADMIN account(s) to USER`)
  }
}
