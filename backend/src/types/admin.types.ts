import type { UserRole } from './roles'

export interface AdminStatsDto {
  totalUsers: number
  totalTasks: number
  totalHabits: number
  newUsersLast7Days: number
}

export interface AdminUserListItemDto {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface AdminUserListDto {
  items: AdminUserListItemDto[]
  total: number
  page: number
  pageSize: number
}

export interface AdminUserDetailDto extends AdminUserListItemDto {
  taskCount: number
  habitCount: number
  listCount: number
  pomodoroSessionCount: number
}
