import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('AI Features', () => {
  test('shows AI unavailable or coming soon message', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    await expect(
      page.getByText(/this ai feature is under development|coming soon/i).first(),
    ).toBeVisible()
  })

  test('AI task analysis when available', async ({ page }) => {
    test.skip(true, 'AI features are disabled by feature flag')

    await page.goto('/list')
    await waitForAppReady(page)

    const aiFeature = page.locator('[data-testid*="ai"], text=/ai.*analysis/i').first()
    await expect(aiFeature).toBeVisible()
    await aiFeature.click()
    await page.waitForTimeout(500)
  })

  test('AI briefing entry is hidden while AI is disabled', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Dashboard CTA is gated by AI_FEATURES_ENABLED — no button when AI is off.
    await expect(page.getByRole('button', { name: /daily briefing/i })).toHaveCount(0)
  })
})
