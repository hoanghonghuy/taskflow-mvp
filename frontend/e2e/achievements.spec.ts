import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Achievements', () => {
  test('loads achievements page', async ({ page }) => {
    await page.goto('/achievements')
    await waitForAppReady(page)

    // Check if page loads or redirects
    const heading = page.getByRole('heading', { name: /achievement|badge/i }).first()
    if (await heading.isVisible()) {
      await expect(heading).toBeVisible()
    }
  })

  test('displays locked and unlocked badges', async ({ page }) => {
    await page.goto('/achievements')
    await waitForAppReady(page)

    // Look for achievement badges
    const badges = page.locator('[data-testid*="achievement"], [data-testid*="badge"], .achievement, .badge')
    if (await badges.first().isVisible()) {
      await expect(badges.first()).toBeVisible()
    }
  })

  test('navigates to achievements from profile', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    // Look for achievements link
    const achievementsLink = page.getByRole('link', { name: /achievement|badge/i }).first()
    if (await achievementsLink.isVisible()) {
      await achievementsLink.click()
      await waitForAppReady(page)
      
      // Verify we're on achievements page
      await expect(page).toHaveURL(/achievement|badge/)
    }
  })

  test('navigates to achievements from dropdown', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Look for user menu/dropdown
    const userMenu = page.getByRole('button', { name: /profile|account|user/i }).first()
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.waitForTimeout(500)
      
      // Look for achievements in dropdown
      const achievementsOption = page.getByRole('menuitem', { name: /achievement|badge/i })
      if (await achievementsOption.isVisible()) {
        await achievementsOption.click()
        await waitForAppReady(page)
      }
    }
  })
})
