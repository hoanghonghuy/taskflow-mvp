import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { clearAuthSession } from './helpers/auth'

test.describe('Session Management', () => {
  test('session persists across page reload', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Verify authenticated
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible()

    // Reload
    await page.reload()
    await waitForAppReady(page)

    // Should still be authenticated
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('session persists across navigation', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Navigate to different pages
    await page.goto('/list')
    await waitForAppReady(page)
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible()

    await page.goto('/settings')
    await waitForAppReady(page)
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible()

    await page.goto('/profile')
    await waitForAppReady(page)
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible()
  })

  test('localStorage has auth state after login', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    const isAuth = await page.evaluate(() => localStorage.getItem('isAuthenticated'))
    expect(isAuth).toBe('true')

    const user = await page.evaluate(() => localStorage.getItem('user'))
    expect(user).toBeTruthy()

    const userData = JSON.parse(user!)
    expect(userData.email).toBeTruthy()
  })

  test('logout clears session and redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Open user menu and logout
    const featureBar = page.locator('nav').filter({
      has: page.getByRole('button', { name: /toggle sidebar|bật\/tắt thanh bên/i }),
    })
    await featureBar.locator('button.p-1.rounded-full').evaluate((button) => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await page.getByRole('button', { name: 'Logout', exact: true }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })

    // localStorage should be cleared
    const isAuth = await page.evaluate(() => localStorage.getItem('isAuthenticated'))
    expect(isAuth).toBeNull()
  })

  test('clearing cookies redirects to login on next navigation', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Clear cookies
    await clearAuthSession(page)

    // Try to navigate to a protected page
    await page.goto('/list')
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })

  test('login page redirects authenticated users to dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Try to go to login while authenticated
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  })

  test('register page redirects authenticated users to dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Try to go to register while authenticated
    await page.goto('/register')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  })
})
