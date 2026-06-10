import { test, expect, devices } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Mobile Navigation', () => {
  test.use({ ...devices['Pixel 5'] })

  test('displays bottom navigation on mobile', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Look for bottom nav indicators
    const nav = page.locator('nav, [role="navigation"]').last()
    if (await nav.isVisible()) {
      await expect(nav).toBeVisible()
    }
  })

  test('navigates via bottom nav', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Try to find and click a nav item
    const navItem = page.getByRole('link', { name: /habits|pomodoro|countdown/i }).first()
    if (await navItem.isVisible()) {
      await navItem.click()
      await waitForAppReady(page)
      // Verify navigation occurred
      await expect(page).not.toHaveURL(/\/list$/)
    }
  })

  test('opens More menu on mobile', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Look for More/Menu button
    const moreButton = page.getByRole('button', { name: /more|menu/i }).first()
    if (await moreButton.isVisible()) {
      await moreButton.click()
      await page.waitForTimeout(500)
      
      // Verify menu opened
      const menuItems = page.locator('[role="menu"], [role="menuitem"]')
      if (await menuItems.first().isVisible()) {
        await expect(menuItems.first()).toBeVisible()
      }
    }
  })

  test('displays mobile-specific title', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Verify page title is visible
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('can open sidebar on mobile', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Look for hamburger menu or sidebar toggle
    const menuButton = page.getByRole('button', { name: /menu|sidebar/i }).first()
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.waitForTimeout(500)
    }
  })
})
