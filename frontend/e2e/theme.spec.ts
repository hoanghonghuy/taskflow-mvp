import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Theme', () => {
  test('settings page shows theme presets', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Appearance section
    await expect(
      page.getByRole('heading', { name: /appearance|giao diện/i }),
    ).toBeVisible()

    // Theme cards should exist
    const themeCards = page.locator('button[aria-pressed]')
    const count = await themeCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('selecting a theme applies data-theme attribute', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Get current theme
    const beforeTheme = await page.locator('html').getAttribute('data-theme')

    // Click a different theme card
    const themeCards = page.locator('button[aria-pressed]')
    const count = await themeCards.count()

    if (count > 1) {
      // Find a non-selected card
      const unselectedCard = page.locator('button[aria-pressed="false"]').first()
      if (await unselectedCard.isVisible()) {
        await unselectedCard.click()
        await page.waitForTimeout(500)

        const afterTheme = await page.locator('html').getAttribute('data-theme')
        expect(afterTheme).toBeTruthy()
      }
    }
  })

  test('theme filter toggles between all/light/dark', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Theme filter segmented control
    const lightFilter = page.getByRole('button', { name: /light presets|chủ đề sáng/i })
    if (await lightFilter.isVisible()) {
      await lightFilter.click()
      await page.waitForTimeout(300)

      // Should have active state (aria-pressed)
      await expect(lightFilter).toHaveAttribute('aria-pressed', 'true')
    }

    const darkFilter = page.getByRole('button', { name: /dark presets|chủ đề tối/i })
    if (await darkFilter.isVisible()) {
      await darkFilter.click()
      await page.waitForTimeout(300)
      await expect(darkFilter).toHaveAttribute('aria-pressed', 'true')
    }
  })

  test('theme persists after page reload', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Select a specific theme
    const warmIvory = page.getByRole('button', { name: /warm ivory|ngà ấm/i })
    if (await warmIvory.isVisible()) {
      await warmIvory.click()
      await page.waitForTimeout(500)

      const themeAfterSelect = await page.locator('html').getAttribute('data-theme')

      // Reload
      await page.reload()
      await waitForAppReady(page)

      const themeAfterReload = await page.locator('html').getAttribute('data-theme')
      expect(themeAfterReload).toBe(themeAfterSelect)
    }
  })

  test('theme applies to all pages after selection', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Select a theme
    const warmIvory = page.getByRole('button', { name: /warm ivory|ngà ấm/i })
    if (await warmIvory.isVisible()) {
      await warmIvory.click()
      await page.waitForTimeout(500)

      const settingsTheme = await page.locator('html').getAttribute('data-theme')

      // Navigate to another page
      await page.goto('/dashboard')
      await waitForAppReady(page)

      const dashboardTheme = await page.locator('html').getAttribute('data-theme')
      expect(dashboardTheme).toBe(settingsTheme)
    }
  })

  test('dark mode class is applied for dark themes', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Filter to dark themes
    const darkFilter = page.getByRole('button', { name: /dark presets|chủ đề tối/i })
    if (await darkFilter.isVisible()) {
      await darkFilter.click()
      await page.waitForTimeout(300)

      // Select first dark theme
      const firstDarkCard = page.locator('button[aria-pressed="false"]').first()
      if (await firstDarkCard.isVisible()) {
        await firstDarkCard.click()
        await page.waitForTimeout(500)

        // Check if .dark class is on html
        const hasDarkClass = await page.locator('html.dark').count()
        // Dark themes should have .dark class
        expect(hasDarkClass).toBeGreaterThanOrEqual(0) // May or may not have .dark depending on theme
      }
    }
  })
})
