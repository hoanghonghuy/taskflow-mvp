import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Navigation', () => {
  test('opens settings and profile pages', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)
    await expect(page.locator('h1.text-2xl.font-bold').filter({ hasText: 'Settings' })).toBeVisible()
    await expect(page.getByRole('group', { name: 'Language' })).toBeVisible()

    await page.goto('/profile')
    await waitForAppReady(page)
    // Profile heading uses responsive classes (text-2xl md:text-3xl), not bare text-3xl.
    await expect(page.getByRole('heading', { name: 'Profile', level: 1 })).toBeVisible()
  })

  test('navigates to board view from sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await page.getByRole('button', { name: 'Board View' }).click()
    await expect(page).toHaveURL(/\/board/)
    await waitForAppReady(page)
  })
})
