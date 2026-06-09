import { AppError } from '../middleware/errorHandler'
import * as adminRepository from '../repositories/adminRepository'
import type {
  AdminStatsDto,
  AdminUpdateUserDto,
  AdminUserDetailDto,
  AdminUserListDto,
  AdminUserListItemDto,
} from '../types/admin.types'

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

function assertNotSystemAdmin(user: { role: string }, action: string): void {
  if (user.role === 'ADMIN') {
    throw new AppError(400, 'invalid_request', `Cannot ${action} the system admin account`)
  }
}

export async function getStats(): Promise<AdminStatsDto> {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const [
    totalUsers,
    regularUsers,
    totalTasks,
    totalHabits,
    totalLists,
    totalPomodoroSessions,
    totalCountdowns,
    newUsersLast7Days,
    recentUsers,
  ] = await Promise.all([
    adminRepository.countUsers(),
    adminRepository.countUsersByRole('USER'),
    adminRepository.countTasks(),
    adminRepository.countHabits(),
    adminRepository.countLists(),
    adminRepository.countPomodoroSessions(),
    adminRepository.countCountdowns(),
    adminRepository.countUsersCreatedSince(since),
    adminRepository.findRecentUsers(5),
  ])

  return {
    totalUsers,
    regularUsers,
    totalTasks,
    totalHabits,
    totalLists,
    totalPomodoroSessions,
    totalCountdowns,
    newUsersLast7Days,
    recentUsers: recentUsers.map(mapListItem),
  }
}

export async function listUsers(params: {
  page: number
  pageSize: number
  search?: string
  role?: 'USER' | 'ADMIN'
}): Promise<AdminUserListDto> {
  const skip = (params.page - 1) * params.pageSize
  const { items, total } = await adminRepository.findUsers({
    skip,
    take: params.pageSize,
    search: params.search,
    role: params.role,
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
    countdownCount: user._count.countdownEvents,
  }
}

export async function updateUser(
  targetUserId: string,
  updates: AdminUpdateUserDto,
): Promise<AdminUserListItemDto> {
  const existing = await adminRepository.findUserById(targetUserId)
  if (!existing) {
    throw new AppError(404, 'not_found', 'User not found')
  }

  assertNotSystemAdmin(existing, 'modify')

  const data: { name?: string; email?: string } = {}

  if (updates.name !== undefined) {
    data.name = updates.name.trim()
  }

  if (updates.email !== undefined) {
    const normalizedEmail = updates.email.trim().toLowerCase()
    if (normalizedEmail !== existing.email) {
      const emailOwner = await adminRepository.findUserByEmail(normalizedEmail)
      if (emailOwner && emailOwner.id !== targetUserId) {
        throw new AppError(409, 'conflict', 'Email is already registered.')
      }
      data.email = normalizedEmail
    }
  }

  const updated = await adminRepository.updateUser(targetUserId, data)
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

  assertNotSystemAdmin(existing, 'delete')

  await adminRepository.deleteUserById(targetUserId)
}
