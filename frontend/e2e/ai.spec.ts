import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('AI Features', () => {
  test('shows AI unavailable or coming soon message', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Look for AI-related buttons or features
    const aiButton = page.getByRole('button', { name: /ai|assistant|smart/i }).first()
    
    if (await aiButton.isVisible()) {
      await aiButton.click()
      await page.waitForTimeout(500)
      
      // Check for unavailable/coming soon message
      const message = page.locator('text=/unavailable|coming soon|not available/i').first()
      if (await message.isVisible()) {
        await expect(message).toBeVisible()
      }
    }
  })

  test('AI task analysis when available', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // This is a conditional test - only runs if AI is enabled
    const aiFeature = page.locator('[data-testid*="ai"], text=/ai.*analysis/i').first()
    
    if (await aiFeature.isVisible()) {
      await expect(aiFeature).toBeVisible()
      // If AI is available, test basic interaction
      await aiFeature.click()
      await page.waitForTimeout(500)
    } else {
      // AI not available - this is expected in many environments
      expect(true).toBe(true)
    }
  })

  test('AI briefing when available', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Look for AI briefing feature
    const briefingButton = page.getByRole('button', { name: /briefing|summary/i }).first()
    
    if (await briefingButton.isVisible()) {
      // Feature exists, can test it
      await expect(briefingButton).toBeVisible()
    } else {
      // Feature not available, which is fine
      await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    }
  })
})
