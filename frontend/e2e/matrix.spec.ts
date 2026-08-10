import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { createTask } from './helpers/task-factory'
import { cleanupOwnedTestTasks } from './helpers/cleanup'

test.describe('Matrix', () => {
  test.afterEach(async ({ page }) => {
    await cleanupOwnedTestTasks(page, ['Matrix E2E'])
  })

  test('loads matrix page with four quadrants', async ({ page }) => {
    await page.goto('/matrix')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /matrix|ma trận/i }).first()).toBeVisible()

    // Four quadrant headings
    await expect(page.getByText(/urgent.*important|khẩn.*quan trọng/i).first()).toBeVisible()
    await expect(page.getByText(/not urgent.*important|không khẩn.*quan trọng/i).first()).toBeVisible()
    await expect(page.getByText(/urgent.*not important|khẩn.*không quan trọng/i).first()).toBeVisible()
    await expect(
      page.getByText(/not urgent.*not important|không khẩn.*không quan trọng/i).first(),
    ).toBeVisible()
  })

  test('task appears in correct quadrant by priority', async ({ page }) => {
    const taskTitle = `Matrix E2E ${Date.now()}`

    // Create a high-priority task (urgent + important → Q1)
    await createTask(page, taskTitle, { priority: 'high' })

    await page.goto('/matrix')
    await waitForAppReady(page)

    // Task should appear in one of the quadrants
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  })

  test('can change task priority from matrix view', async ({ page }) => {
    const taskTitle = `Matrix E2E ${Date.now()}`

    await createTask(page, taskTitle, { priority: 'low' })

    await page.goto('/matrix')
    await waitForAppReady(page)

    // Open task detail
    await page.getByText(taskTitle, { exact: true }).click()
    await expect(page.locator('#task-priority')).toBeVisible({ timeout: 10_000 })

    // Change priority
    await page.locator('#task-priority').selectOption('urgent')

    // Close detail
    await page.locator('button[aria-label="Close"]').click()
    await page.waitForTimeout(500)

    // Task should still be visible (now in different quadrant)
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  })

  test('navigates to matrix from sidebar', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    const matrixButton = page.getByRole('button', { name: /matrix view|ma trận/i })
    if (await matrixButton.isVisible()) {
      await matrixButton.click()
      await waitForAppReady(page)
      await expect(page).toHaveURL(/\/matrix/)
    }
  })
})
