import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { waitForAdminReady } from './helpers/app-ready'
import { isMockE2e } from './helpers/env'
import { E2E_PASSWORD } from './helpers/test-data'

function getE2eUserEmail(): string {
  const metaPath = path.join(__dirname, '../playwright/.auth/e2e-user.json')
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as { email: string }
  return meta.email
}

function getBackendUrl(): string {
  return (process.env.BACKEND_URL || 'http://127.0.0.1:8099').replace(/\/$/, '')
}

async function registerDisposableUser(): Promise<{ email: string; name: string }> {
  const email = `e2e-admin-del-${Date.now()}@taskflow.test`
  const name = 'E2E Delete Me'
  const res = await fetch(`${getBackendUrl()}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password: E2E_PASSWORD }),
  })
  if (!res.ok) {
    throw new Error(`Failed to register disposable user: ${res.status}`)
  }
  return { email, name }
}

test.describe('Admin area', () => {
  test('loads admin dashboard with stats', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await waitForAdminReady(page)

    await expect(page.getByRole('heading', { name: /admin dashboard|bảng điều khiển quản trị/i })).toBeVisible()
    await expect(page.getByText(/total users|tổng người dùng/i)).toBeVisible()
    await expect(page.getByText(/total tasks|tổng nhiệm vụ/i)).toBeVisible()
  })

  test('lists users in admin panel', async ({ page }) => {
    await page.goto('/admin/users')
    await waitForAdminReady(page)

    await expect(page.getByRole('heading', { name: /user management|quản lý người dùng/i })).toBeVisible()

    const expectedEmail = isMockE2e() ? 'demo@taskflow.app' : getE2eUserEmail()
    await expect(page.getByText(expectedEmail)).toBeVisible({ timeout: 15_000 })
  })

  test('edits a regular user profile', async ({ page }) => {
    test.skip(isMockE2e(), 'Requires real backend user detail API')

    const userEmail = getE2eUserEmail()
    const updatedName = `E2E Edited ${Date.now()}`

    await page.goto('/admin/users')
    await waitForAdminReady(page)

    const row = page.locator('tr').filter({ hasText: userEmail })
    await row.getByRole('link', { name: /details|chi tiết/i }).click()
    await waitForAdminReady(page)

    await page.locator('#admin-user-name').fill(updatedName)
    await page.getByRole('button', { name: /save changes|lưu thay đổi/i }).click()

    await expect(page.getByRole('heading', { name: updatedName })).toBeVisible({ timeout: 15_000 })
  })

  test('deletes a disposable regular user', async ({ page }) => {
    test.skip(isMockE2e(), 'Requires real backend delete API')

    const disposable = await registerDisposableUser()

    await page.goto('/admin/users')
    await waitForAdminReady(page)
    await page.getByPlaceholder(/search by name or email|tìm theo tên hoặc email/i).fill(disposable.email)
    await page.getByRole('button', { name: /^search$|^tìm kiếm$/i }).click()

    const row = page.locator('tr').filter({ hasText: disposable.email })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('link', { name: /details|chi tiết/i }).click()
    await waitForAdminReady(page)

    await page.getByRole('button', { name: /delete user|xóa người dùng/i }).click()
    await page.getByRole('button', { name: /^delete user$|^xóa người dùng$/i }).last().click()

    await expect(page).toHaveURL(/\/admin\/users/, { timeout: 15_000 })
    await expect(page.getByText(disposable.email)).not.toBeVisible()
  })

  test('redirects non-admin users away from admin', async ({ browser }) => {
    const userContext = await browser.newContext({
      storageState: 'playwright/.auth/user.json',
    })
    const page = await userContext.newPage()

    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })

    await userContext.close()
  })
})
