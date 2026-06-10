import { readFileSync } from 'node:fs'
import path from 'node:path'
import { test, expect } from '@playwright/test'
import { waitForAdminReady } from './helpers/app-ready'
import { isMockE2e } from './helpers/env'

function getE2eUserEmail(): string {
  const metaPath = path.join(__dirname, '../playwright/.auth/e2e-user.json')
  const meta = JSON.parse(readFileSync(metaPath, 'utf8')) as { email: string }
  return meta.email
}

test.describe('Admin area', () => {
  test('loads admin dashboard with stats', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await waitForAdminReady(page)

    await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible()
    await expect(page.getByText('Total users')).toBeVisible()
    await expect(page.getByText('Total tasks')).toBeVisible()
  })

  test('lists users in admin panel', async ({ page }) => {
    await page.goto('/admin/users')
    await waitForAdminReady(page)

    await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible()

    const expectedEmail = isMockE2e() ? 'demo@taskflow.app' : getE2eUserEmail()
    await expect(page.getByText(expectedEmail)).toBeVisible({ timeout: 15_000 })
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
