import { apiFetchJson } from './client'
import type { UserRole } from '@/types'

export interface AdminStats {
  totalUsers: number
  regularUsers: number
  totalTasks: number
  totalHabits: number
  totalLists: number
  totalPomodoroSessions: number
  totalCountdowns: number
  newUsersLast7Days: number
  recentUsers: AdminUserListItem[]
}

export interface AdminUserListItem {
  id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
}

export interface AdminUserList {
  items: AdminUserListItem[]
  total: number
  page: number
  pageSize: number
}

export interface AdminUserDetail extends AdminUserListItem {
  taskCount: number
  habitCount: number
  listCount: number
  pomodoroSessionCount: number
  countdownCount: number
}

export interface AdminUpdateUserInput {
  name?: string
  email?: string
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return apiFetchJson<AdminStats>('/api/admin/stats')
}

export async function fetchAdminUsers(params?: {
  page?: number
  pageSize?: number
  search?: string
  role?: UserRole
}): Promise<AdminUserList> {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.pageSize) query.set('pageSize', String(params.pageSize))
  if (params?.search) query.set('search', params.search)
  if (params?.role) query.set('role', params.role)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetchJson<AdminUserList>(`/api/admin/users${suffix}`)
}

export async function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  return apiFetchJson<AdminUserDetail>(`/api/admin/users/${id}`)
}

export async function updateAdminUser(
  id: string,
  input: AdminUpdateUserInput,
): Promise<AdminUserListItem> {
  return apiFetchJson<AdminUserListItem>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiFetchJson(`/api/admin/users/${id}`, { method: 'DELETE' })
}
