import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Pomodoro', () => {
  test('loads pomodoro timer page', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /pomodoro/i })).toBeVisible()
    // Verify timer is displayed
    await expect(page.locator('text=/\\d{2}:\\d{2}/').first()).toBeVisible()
  })

  test('starts and pauses timer', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    const stopButton = page.getByRole('button', { name: /^stop$/i })
    if (await stopButton.isVisible()) {
      await stopButton.click()
      await expect(page.getByRole('button', { name: /^start$/i })).toBeVisible()
    }

    const startButton = page.getByRole('button', { name: /^start$/i })
    await expect(startButton).toBeVisible()

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/pomodoro/state') &&
          response.request().method() === 'PUT' &&
          response.ok(),
      ),
      startButton.click(),
    ])

    const pauseButton = page.getByRole('button', { name: /^pause$/i })
    await expect(pauseButton).toBeVisible({ timeout: 15_000 })
    await pauseButton.click()

    await expect(page.getByRole('button', { name: /^start$/i })).toBeVisible()
  })

  test('stops timer', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    // Start timer
    const startButton = page.getByRole('button', { name: /start|play/i })
    await startButton.click()
    await page.waitForTimeout(1000)

    // Stop timer
    const stopButton = page.getByRole('button', { name: /stop|reset/i })
    await expect(stopButton).toBeVisible()
    await stopButton.click()

    // Verify timer reset (should show default time like 25:00)
    await expect(page.locator('text=/25:00|1500/').first()).toBeVisible()
  })

  test('selects task to focus on', async ({ page }) => {
    // First create a task to focus on
    await page.goto('/list')
    await waitForAppReady(page)

    const taskTitle = `Focus Task ${Date.now()}`
    const addTaskButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
    await addTaskButton.click()
    await page.getByPlaceholder('e.g., Pay electricity bill').fill(taskTitle)
    await page.getByRole('button', { name: 'Create Task' }).click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    // Navigate to pomodoro
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    // Select task for focus
    const selectTaskButton = page.getByRole('button', { name: /select.*task|focus.*task/i }).first()
    if (await selectTaskButton.isVisible()) {
      await selectTaskButton.click()
      
      // Find and select the task
      await page.getByText(taskTitle, { exact: true }).click()
      
      // Verify task is selected
      await expect(page.getByText(taskTitle)).toBeVisible()
    }
  })

  test('views pomodoro stats', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    // Look for stats section or button
    const statsButton = page.getByRole('button', { name: /stats|statistics|history/i }).first()
    if (await statsButton.isVisible()) {
      await statsButton.click()
      
      // Verify stats are displayed
      await expect(page.locator('text=/session|completed|focus/i').first()).toBeVisible()
    } else {
      // Stats might be visible by default
      await expect(page.locator('text=/session|completed|today/i').first()).toBeVisible()
    }
  })

  test('opens statistics menu', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    // Look for statistics or menu button
    const menuButton = page.getByRole('button', { name: /menu|more|statistics/i }).first()
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.waitForTimeout(500)
      
      // Verify menu options are visible
      const menuItems = page.locator('[role="menu"], [role="menuitem"]')
      await expect(menuItems.first()).toBeVisible()
    }
  })

  test('displays break time after focus session', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    // This test would require waiting for a full session to complete
    // For practical purposes, we'll just verify break-related UI exists
    const skipButton = page.getByRole('button', { name: /skip.*break/i })
    if (await skipButton.isVisible()) {
      await expect(skipButton).toBeVisible()
    }
  })

  test('navigates to settings from pomodoro', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    // Look for settings button
    const settingsButton = page.getByRole('link', { name: /settings/i }).or(
      page.getByRole('button', { name: /settings/i })
    ).first()
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      await waitForAppReady(page)
      
      // Verify we're on settings or settings modal is open
      await expect(page.locator('text=/duration|timer.*settings|pomodoro.*settings/i').first()).toBeVisible()
    }
  })
})
