import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Tasks', () => {
  test('creates a task and marks it complete', async ({ page }) => {
    const taskTitle = `E2E task ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // FAB (Floating Action Button) at bottom right - use flexible selector
    const addTaskButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
    await expect(addTaskButton).toBeVisible()
    await addTaskButton.click()

    const taskModalHeading = page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })
    await expect(taskModalHeading).toBeVisible()

    await page
      .getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i)
      .fill(taskTitle)
    await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()

    await expect(taskModalHeading).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    const taskRow = page.locator('.group').filter({
      has: page.getByText(taskTitle, { exact: true }),
    })
    await taskRow
      .getByRole('button', { name: /mark task as complete|đánh dấu nhiệm vụ hoàn thành/i })
      .click()

    const completedSection = page.getByRole('button', { name: /completed|đã hoàn thành/i })
    await expect(completedSection).toBeVisible()
    await completedSection.click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  })

  test('dashboard is accessible when authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    // Dashboard subtitle is in header which is hidden on mobile (hidden md:block)
    // Check for dashboard content instead (stats cards)
    await expect(page.getByText(/today|upcoming|habits/i).first()).toBeVisible()
  })
})
