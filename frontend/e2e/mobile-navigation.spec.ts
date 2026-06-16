import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

function bottomNav(page: import('@playwright/test').Page) {
  return page.locator('nav.fixed.bottom-0')
}

test.describe('Mobile Navigation', () => {
  test('displays bottom navigation on mobile', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const nav = bottomNav(page)
    await expect(nav).toBeVisible()
    await expect(nav.getByRole('button').first()).toBeVisible()
  })

  test('navigates via bottom nav', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const nav = bottomNav(page)
    await nav.getByRole('button', { name: /^calendar view$|^lịch$/i }).click()
    await waitForAppReady(page)
    await expect(page).toHaveURL(/\/calendar/)
  })

  test('navigates to board via bottom nav', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const nav = bottomNav(page)
    await nav.getByRole('button', { name: /board view|bảng/i }).click()
    await waitForAppReady(page)
    await expect(page).toHaveURL(/\/board/)
  })

  test('navigates to habits via More menu', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const nav = bottomNav(page)
    await nav.getByRole('button', { name: /^more$|^thêm$/i }).click()
    await page.getByRole('button', { name: /habit tracker|thói quen/i }).click()
    await waitForAppReady(page)
    await expect(page).toHaveURL(/\/habits/)
  })

  test('opens More menu on mobile', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const moreButton = bottomNav(page).getByRole('button', { name: /^more$/i })
    await moreButton.click()

    const menuItem = page.getByRole('button', { name: /pomodoro|habit|countdown/i }).first()
    await expect(menuItem).toBeVisible()
  })

  test('displays mobile-specific title', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const nav = bottomNav(page)
    await expect(nav.getByText(/list view|danh sách/i)).toBeVisible()
  })

  test('can open sidebar on mobile', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    await page.getByRole('button', { name: /open sidebar/i }).click()
    await expect(page.getByRole('heading', { name: /my lists|danh sách/i })).toBeVisible()
  })
})
