import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Achievements', () => {
  test('loads achievements page', async ({ page }) => {
    await page.goto('/achievements')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /achievements/i })).toBeVisible()
  })

  test('displays locked and unlocked badges', async ({ page }) => {
    await page.goto('/achievements')
    await waitForAppReady(page)

    const badges = page.locator('.grid > div').filter({ has: page.locator('h3') })
    await expect(badges.first()).toBeVisible()
    expect(await badges.count()).toBeGreaterThan(0)
  })

  test('shows achievements stats on profile', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /^achievements$/i, level: 3 })).toBeVisible()
  })

  test('navigates to achievements from dropdown', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const featureBar = page.locator('nav').filter({
      has: page.getByRole('button', { name: /toggle sidebar|bật\/tắt thanh bên/i }),
    })
    // DOM click avoids Next.js dev overlay intercepting pointer events in local dev
    await featureBar.locator('button.p-1.rounded-full').evaluate((button) => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await page.getByRole('button', { name: /achievements|thành tích/i }).click({ force: true })
    await waitForAppReady(page)
    await expect(page).toHaveURL(/\/achievements/)
  })
})
