import type { Page } from '@playwright/test'

type ApiEntity = {
  id?: string
  title?: string
  name?: string
}

function unwrapEntities(payload: unknown): ApiEntity[] {
  if (Array.isArray(payload)) return payload as ApiEntity[]
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: ApiEntity[] }).data
  }
  return []
}

function matchesPrefix(value: string | undefined, prefixes: string[]): boolean {
  if (!value) return false
  return prefixes.some((prefix) => value.startsWith(prefix))
}

/**
 * Deletes owned tasks whose titles match the given prefixes (e.g. "Board E2E", "Stats Test").
 * Keeps seed/demo data intact while preventing e2e leftovers from polluting later assertions.
 */
export async function cleanupOwnedTestTasks(
  page: Page,
  titlePrefixes: string[] = ['Board E2E', 'Stats Test', 'E2E', 'Profile Test'],
): Promise<number> {
  const response = await page.request.get('/api/tasks')
  if (!response.ok()) return 0

  const tasks = unwrapEntities(await response.json())
  let deleted = 0

  for (const task of tasks) {
    if (!task.id || !matchesPrefix(task.title, titlePrefixes)) continue

    const deleteResponse = await page.request.delete(`/api/tasks/${encodeURIComponent(task.id)}`)
    if (deleteResponse.ok() || deleteResponse.status() === 404) {
      deleted += 1
    }
  }

  return deleted
}

/**
 * Deletes owned habits whose names match the given prefixes (e.g. "Profile Test").
 */
export async function cleanupOwnedTestHabits(
  page: Page,
  namePrefixes: string[] = ['Profile Test', 'E2E Habit', 'Habit E2E'],
): Promise<number> {
  const response = await page.request.get('/api/habits')
  if (!response.ok()) return 0

  const habits = unwrapEntities(await response.json())
  let deleted = 0

  for (const habit of habits) {
    if (!habit.id || !matchesPrefix(habit.name, namePrefixes)) continue

    const deleteResponse = await page.request.delete(`/api/habits/${encodeURIComponent(habit.id)}`)
    if (deleteResponse.ok() || deleteResponse.status() === 404) {
      deleted += 1
    }
  }

  return deleted
}

type AdminUserListItem = {
  id?: string
  email?: string
  role?: string
}

type AdminUserListResponse = {
  items?: AdminUserListItem[]
  total?: number
  page?: number
  pageSize?: number
}

const E2E_USER_EMAIL_RE = /^e2e-.+@taskflow\.test$/i

/**
 * Deletes leftover E2E users (`e2e-*@taskflow.test`) via the admin API.
 * Skips ADMIN accounts and any emails listed in `keepEmails`.
 * Requires an authenticated admin session on `page`.
 */
export async function cleanupStaleE2eUsers(
  page: Page,
  keepEmails: string[] = [],
): Promise<number> {
  const keep = new Set(keepEmails.map((email) => email.trim().toLowerCase()).filter(Boolean))
  const targetIds: string[] = []
  let pageNum = 1

  for (;;) {
    const response = await page.request.get(
      `/api/admin/users?page=${pageNum}&pageSize=100&search=${encodeURIComponent('e2e-')}`,
    )
    if (!response.ok()) break

    const payload = (await response.json()) as AdminUserListResponse
    const items = Array.isArray(payload.items) ? payload.items : []

    for (const user of items) {
      if (!user.id || !user.email) continue
      const email = user.email.trim().toLowerCase()
      if (!E2E_USER_EMAIL_RE.test(email)) continue
      if (keep.has(email)) continue
      if (user.role === 'ADMIN') continue
      targetIds.push(user.id)
    }

    const total = typeof payload.total === 'number' ? payload.total : items.length
    if (pageNum * 100 >= total || items.length === 0) break
    pageNum += 1
  }

  let deleted = 0
  for (const id of targetIds) {
    const deleteResponse = await page.request.delete(`/api/admin/users/${encodeURIComponent(id)}`)
    if (deleteResponse.ok() || deleteResponse.status() === 404) {
      deleted += 1
    }
  }

  return deleted
}
