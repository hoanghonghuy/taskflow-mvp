import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { cleanupOwnedTestTasks } from './helpers/cleanup'

test.describe('Pomodoro', () => {
  test.afterEach(async ({ page }) => {
    await cleanupOwnedTestTasks(page, ['Focus Task'])
  })

  test('shows a clear focus timer and primary action', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /pomodoro/i })).toBeVisible()
    await expect(page.locator('text=/\\d{2}:\\d{2}/').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /^start$|^bắt đầu$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^stop$|^dừng$/i })).toBeHidden()
  })

  test('starts, pauses, resumes and stops the timer', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    const startButton = page.getByRole('button', { name: /^start$|^bắt đầu$/i })
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

    const pauseButton = page.getByRole('button', { name: /^pause$|^tạm dừng$/i })
    await expect(pauseButton).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^stop$|^dừng$/i })).toBeVisible()

    await pauseButton.click()
    const resumeButton = page.getByRole('button', { name: /^resume$|^tiếp tục$/i })
    await expect(resumeButton).toBeVisible()

    await resumeButton.click()
    await expect(pauseButton).toBeVisible()

    await page.getByRole('button', { name: /^stop$|^dừng$/i }).click()
    await expect(page.getByRole('button', { name: /^start$|^bắt đầu$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^stop$|^dừng$/i })).toBeHidden()
  })

  test('selects a task and exposes the selected focus target', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const taskTitle = `Focus Task ${Date.now()}`
    await page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last().click()
    await page
      .getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i)
      .fill(taskTitle)
    await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    await page.goto('/pomodoro')
    await waitForAppReady(page)

    const focusTargetButton = page.getByRole('button', {
      name: /select a task to focus on|chọn nhiệm vụ để tập trung/i,
    })
    await expect(focusTargetButton).toBeVisible()
    await focusTargetButton.click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByText(taskTitle, { exact: true }).click()

    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  })

  test('opens statistics without crowding the timer view', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    const statsButton = page.getByRole('button', { name: /statistics|thống kê/i })
    await expect(statsButton).toBeVisible()
    await statsButton.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/today|hôm nay|focus|tập trung/i).first()).toBeVisible()
  })

  test('navigates to pomodoro settings explicitly', async ({ page }) => {
    await page.goto('/pomodoro')
    await waitForAppReady(page)

    const settingsButton = page.getByRole('button', { name: /^settings$|^cài đặt$/i })
    await expect(settingsButton).toBeVisible()
    await settingsButton.click()
    await waitForAppReady(page)

    await expect(page).toHaveURL(/\/settings/)
    await expect(page.locator('#focus-duration')).toBeVisible()
  })

  test('changing focus duration in settings reflects on timer', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    const durationInput = page.locator('#focus-duration')
    await expect(durationInput).toBeVisible()
    await durationInput.fill('30')
    await durationInput.blur()

    await page.goto('/pomodoro')
    await waitForAppReady(page)

    await expect(page.getByText('30:00', { exact: true })).toBeVisible()
  })
})
