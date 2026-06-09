import { AppError } from '../middleware/errorHandler'
import * as adminRepository from '../repositories/adminRepository'
import type {
  AdminStatsDto,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserListItemDto,
} from '../types/admin.types'
import type { UserRole } from '../types/roles'

function mapListItem(user: {
  id: string
  name: string
  email: string
  role: string
  createdAt: Date
}): AdminUserListItemDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === 'ADMIN' ? 'ADMIN' : 'USER',
    createdAt: user.createdAt.toISOString(),
  }
}

export async function getStats(): Promise<AdminStatsDto> {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const [totalUsers, totalTasks, totalHabits, newUsersLast7Days] = await Promise.all([
    adminRepository.countUsers(),
    adminRepository.countTasks(),
    adminRepository.countHabits(),
    adminRepository.countUsersCreatedSince(since),
  ])

  return { totalUsers, totalTasks, totalHabits, newUsersLast7Days }
}

export async function listUsers(params: {
  page: number
  pageSize: number
  search?: string
}): Promise<AdminUserListDto> {
  const skip = (params.page - 1) * params.pageSize
  const { items, total } = await adminRepository.findUsers({
    skip,
    take: params.pageSize,
    search: params.search,
  })

  return {
    items: items.map(mapListItem),
    total,
    page: params.page,
    pageSize: params.pageSize,
  }
}

export async function getUserDetail(userId: string): Promise<AdminUserDetailDto> {
  const user = await adminRepository.findUserById(userId)
  if (!user) {
    throw new AppError(404, 'not_found', 'User not found')
  }

  return {
    ...mapListItem(user),
    taskCount: user._count.tasks,
    habitCount: user._count.habits,
    listCount: user._count.lists,
    pomodoroSessionCount: user._count.pomodoroSessions,
  }
}

async function assertCanChangeRole(
  actorUserId: string,
  targetUserId: string,
  nextRole: UserRole,
  currentTargetRole: UserRole,
): Promise<void> {
  if (actorUserId === targetUserId && nextRole !== 'ADMIN') {
    const adminCount = await adminRepository.countAdmins()
    if (adminCount <= 1 && currentTargetRole === 'ADMIN') {
      throw new AppError(400, 'invalid_request', 'Cannot demote the last admin account')
    }
  }
}

export async function updateUserRole(
  actorUserId: string,
  targetUserId: string,
  role: UserRole,
): Promise<AdminUserListItemDto> {
  const existing = await adminRepository.findUserById(targetUserId)
  if (!existing) {
    throw new AppError(404, 'not_found', 'User not found')
  }

  const currentRole = existing.role === 'ADMIN' ? 'ADMIN' : 'USER'
  await assertCanChangeRole(actorUserId, targetUserId, role, currentRole)

  const updated = await adminRepository.updateUserRole(targetUserId, role)
  return mapListItem(updated)
}

export async function deleteUser(actorUserId: string, targetUserId: string): Promise<void> {
  if (actorUserId === targetUserId) {
    throw new AppError(400, 'invalid_request', 'Cannot delete your own account')
  }

  const existing = await adminRepository.findUserById(targetUserId)
  if (!existing) {
    throw new AppError(404, 'not_found', 'User not found')
  }

  if (existing.role === 'ADMIN') {
    const adminCount = await adminRepository.countAdmins()
    if (adminCount <= 1) {
      throw new AppError(400, 'invalid_request', 'Cannot delete the last admin account')
    }
  }

  await adminRepository.deleteUserById(targetUserId)
}
