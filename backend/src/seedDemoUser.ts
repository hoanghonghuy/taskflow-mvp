import { hashPassword } from './lib/password'
import { prisma } from './lib/prisma'
import * as listRepository from './repositories/listRepository'
import { seedDefaultListsForUser } from './seed'
import { clearDemoUserContent, seedDemoUserContent } from './seed/demoUserContent'

export async function seedDemoUser(): Promise<void> {
  const email = process.env.DEMO_EMAIL?.trim().toLowerCase()
  const password = process.env.DEMO_PASSWORD?.trim()
  const name = process.env.DEMO_NAME?.trim() || 'Demo User'
  const force = process.env.DEMO_SEED_FORCE === 'true'

  if (!email || !password) {
    return
  }

  const passwordHash = await hashPassword(password)
  let user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, name, role: 'USER' },
    })
  } else {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'USER',
      },
    })
    console.log(`[seed] Created DEMO user: ${email}`)
  }

  await seedDefaultListsForUser(user.id)

  const taskCount = await prisma.todoTask.count({ where: { userId: user.id } })
  if (taskCount > 0 && !force) {
    console.log(`[seed] DEMO user already has data (${taskCount} tasks); skip seeding`)
    return
  }

  if (force && taskCount > 0) {
    await clearDemoUserContent(user.id)
    console.log(`[seed] Cleared existing DEMO user data (DEMO_SEED_FORCE=true)`)
  }

  const lists = await listRepository.findListsByUserId(user.id)
  const inbox = lists.find((l) => l.name === 'Inbox')
  const work = lists.find((l) => l.name === 'Work')
  const personal = lists.find((l) => l.name === 'Personal')

  if (!inbox || !work || !personal) {
    console.error('[seed] DEMO user missing default lists; cannot seed content')
    return
  }

  await seedDemoUserContent(user.id, {
    inboxId: inbox.id,
    workId: work.id,
    personalId: personal.id,
  })

  console.log(`[seed] Seeded DEMO content for ${email}`)
}

if (require.main === module) {
  seedDemoUser()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error('[seed] Failed to seed demo user', err)
      void prisma.$disconnect()
      process.exit(1)
    })
}
