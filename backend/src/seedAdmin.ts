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
    const data: { role: 'ADMIN'; passwordHash?: string; name?: string } = {
      role: 'ADMIN',
    }

    // Chỉ ghi đè passwordHash khi user CHƯA phải admin (vd mới promote từ USER).
    // Nếu user đã là ADMIN thì KHÔNG động vào hash: admin có thể đã đổi mật khẩu
    // qua UI, ghi đè mỗi restart sẽ reset mật khẩu admin thật.
    if (existing.role !== 'ADMIN') {
      data.passwordHash = await hashPassword(password)
    }

    if (name && existing.name !== name) {
      data.name = name
    }

    await prisma.user.update({ where: { id: existing.id }, data })

    if (existing.role !== 'ADMIN') {
      console.log(`[seed] Promoted existing user to ADMIN: ${email}`)
    } else {
      console.log(`[seed] ADMIN account unchanged: ${email}`)
    }

    // KHÔNG gọi demoteExtraAdmins khi user đã tồn tại: tôn trọng các admin khác
    // do operator tạo thủ công. Auto-demote chỉ áp dụng khi admin vừa tạo mới
    // (nhánh bên dưới) để đảm bảo chỉ có 1 admin từ env.
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

  // Auto-demote chỉ chạy khi admin env vừa được tạo lần đầu, tránh xóa
  // quyền admin khác ở những lần restart tiếp theo.
  const demoted = await adminRepository.demoteExtraAdmins(email)
  if (demoted > 0) {
    console.log(`[seed] Demoted ${demoted} extra ADMIN account(s) to USER`)
  }
}

if (require.main === module) {
  seedAdminUser()
    .then(() => prisma.$disconnect())
    .catch((err) => {
      console.error('[seed] Failed to seed admin user', err)
      void prisma.$disconnect()
      process.exit(1)
    })
}
