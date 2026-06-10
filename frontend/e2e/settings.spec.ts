import { test, expect, type Page } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

async function openSettings(page: Page) {
  await page.goto('/settings')
  await waitForAppReady(page)
}

async function ensureEnglish(page: Page) {
  const languageGroup = page.getByRole('group', { name: /language|ngôn ngữ/i })
  const englishButton = languageGroup.getByRole('button', { name: /^english$/i })
  if ((await englishButton.getAttribute('aria-pressed')) !== 'true') {
    await englishButton.click()
    await waitForAppReady(page)
  }
}

async function expectSettingsLoaded(page: Page) {
  await expect(
    page.getByRole('heading', { name: /^settings$|^cài đặt$/i, exact: true }),
  ).toBeVisible()
}

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await openSettings(page)
    await ensureEnglish(page)
  })

  test('loads settings page', async ({ page }) => {
    await expectSettingsLoaded(page)
  })

  test('changes language in app', async ({ page }) => {
    const languageGroup = page.getByRole('group', { name: /language|ngôn ngữ/i })
    await languageGroup.getByRole('button', { name: /tiếng việt/i }).click()
    await waitForAppReady(page)

    await expect(
      page.getByRole('group', { name: /language|ngôn ngữ/i }).getByRole('button', { name: /tiếng việt/i }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  test('changes theme preset', async ({ page }) => {
    const appearanceSection = page.locator('section').filter({
      has: page.getByRole('heading', { name: /^appearance$|^giao diện$/i }),
    })
    const warmIvory = appearanceSection.getByRole('button', { name: /warm ivory|ngà ấm/i })
    await warmIvory.click()
    await expect(warmIvory).toHaveAttribute('aria-pressed', 'true')
  })

  test('toggles theme filter', async ({ page }) => {
    const lightFilter = page.getByRole('button', { name: /light presets|chủ đề sáng/i })
    await lightFilter.click()
    await expect(lightFilter).toHaveClass(/bg-primary/)
  })

  test('verifies bottom nav persistence', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /bottom navigation|thanh điều hướng dưới/i }),
    ).toBeVisible()

    await page.goto('/list')
    await waitForAppReady(page)
    await openSettings(page)
    await expectSettingsLoaded(page)
  })

  test('changes pomodoro duration', async ({ page }) => {
    const durationInput = page.locator('#focus-duration')
    await expect(durationInput).toBeVisible()
    await durationInput.fill('30')
    await expect(durationInput).toHaveValue('30')
  })

  test('toggles notification switch', async ({ page }) => {
    const notificationSwitch = page.locator('#notifications-enabled')
    await expect(notificationSwitch).toBeVisible()

    const wasChecked = await notificationSwitch.isChecked()
    await notificationSwitch.click()
    await expect(notificationSwitch).toBeChecked({ checked: !wasChecked })
  })
})
