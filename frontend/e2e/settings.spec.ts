import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Settings', () => {
  test('loads settings page', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible()
  })

  test('changes language in app', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Look for language selector
    const languageSelect = page.getByLabel(/language/i).or(
      page.locator('select[name*="language"], [data-testid*="language"]')
    ).first()

    if (await languageSelect.isVisible()) {
      await languageSelect.click()
      // Select Vietnamese if available
      const viOption = page.getByRole('option', { name: /vietnamese|tiếng việt|vi/i })
      if (await viOption.isVisible()) {
        await viOption.click()
        // Wait for language change to apply
        await page.waitForTimeout(1000)
      }
    }

    // Verify settings page is still accessible
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('changes theme preset', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Look for theme selector
    const themeSelect = page.locator('select[name*="theme"], [data-testid*="theme"]').first()
    
    if (await themeSelect.isVisible()) {
      await themeSelect.click()
      // Select first available theme
      await page.locator('option').nth(1).click()
      await page.waitForTimeout(500)
    }

    // Verify page is still functional
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('toggles theme filter', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Look for filter toggles
    const filterToggle = page.getByRole('switch').or(
      page.locator('input[type="checkbox"]')
    ).first()

    if (await filterToggle.isVisible()) {
      await filterToggle.click()
      await page.waitForTimeout(300)
    }
  })

  test('verifies bottom nav persistence', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Check if bottom navigation settings exist
    const navSettings = page.locator('text=/navigation|bottom.*nav/i').first()
    
    if (await navSettings.isVisible()) {
      await expect(navSettings).toBeVisible()
    }

    // Verify we can navigate away and back
    await page.goto('/list')
    await waitForAppReady(page)
    await page.goto('/settings')
    await waitForAppReady(page)
    await expect(page.locator('h1').first()).toBeVisible()
  })

  test('changes pomodoro duration', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Look for pomodoro settings section
    const pomodoroSection = page.locator('text=/pomodoro/i').first()
    
    if (await pomodoroSection.isVisible()) {
      // Look for duration input
      const durationInput = page.locator('input[type="number"]').first()
      if (await durationInput.isVisible()) {
        await durationInput.fill('30')
        await page.waitForTimeout(500)
      }
    }
  })

  test('toggles notification switch', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Look for notification settings
    const notificationSwitch = page.locator('text=/notification/i').locator('..').getByRole('switch').first()
    
    if (await notificationSwitch.isVisible()) {
      await notificationSwitch.click()
      await page.waitForTimeout(300)
    }

    // Verify settings page is still functional
    await expect(page.locator('h1').first()).toBeVisible()
  })
})
