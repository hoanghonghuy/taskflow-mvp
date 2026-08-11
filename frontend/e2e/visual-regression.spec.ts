import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Visual Regression', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('login-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('register-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('dashboard renders correctly', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('list view renders correctly', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('list-view.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('board view renders correctly', async ({ page }) => {
    await page.goto('/board')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('board-view.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('calendar view renders correctly', async ({ page }) => {
    await page.goto('/calendar')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('calendar-view.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('matrix view renders correctly', async ({ page }) => {
    await page.goto('/matrix')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('matrix-view.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('settings page renders correctly', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('settings.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('habits page renders correctly', async ({ page }) => {
    await page.goto('/habits')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('habits.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('countdown page renders correctly', async ({ page }) => {
    await page.goto('/countdown')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('countdown.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('pomodoro page renders correctly', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    await expect(page).toHaveScreenshot('pomodoro.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('task form modal renders correctly', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const addButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
    await addButton.click()

    const modalHeading = page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })
    await expect(modalHeading).toBeVisible()

    await expect(page).toHaveScreenshot('task-form-modal.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.05,
    })
  })

  test('sidebar renders correctly', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Take screenshot of sidebar area
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toHaveScreenshot('sidebar.png', {
      maxDiffPixelRatio: 0.05,
    })
  })
})
