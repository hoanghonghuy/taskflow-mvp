import { test, expect } from '@playwright/test'
import { waitForAdminReady } from './helpers/app-ready'

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
    await expect(page.getByText('demo@taskflow.app')).toBeVisible()
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
