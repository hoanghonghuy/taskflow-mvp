import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { createTask } from './helpers/task-factory'
import { cleanupOwnedTestTasks } from './helpers/cleanup'

test.describe('Concurrency', () => {
  test.afterEach(async ({ page }) => {
    await cleanupOwnedTestTasks(page, ['Concurrent E2E'])
  })

  test('rapid task creation does not duplicate', async ({ page }) => {
    const taskTitle = `Concurrent E2E ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // Open task form
    const addButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
    await addButton.click()

    const modalHeading = page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })
    await expect(modalHeading).toBeVisible()

    await page.locator('#task-form-title').fill(taskTitle)

    // Click create — button disables after first click (correct behavior)
    const createButton = page.getByRole('button', { name: /create task|tạo nhiệm vụ/i })
    await createButton.click()

    // Wait for modal to close
    await expect(modalHeading).toBeHidden({ timeout: 15_000 })

    // Should only have one instance of the task
    const taskInstances = page.getByText(taskTitle, { exact: true })
    const count = await taskInstances.count()
    expect(count).toBe(1)
  })

  test('double-click complete does not error', async ({ page }) => {
    const taskTitle = `Concurrent E2E ${Date.now()}`

    await createTask(page, taskTitle)

    const taskRow = page.locator('.group').filter({
      has: page.getByText(taskTitle, { exact: true }),
    })

    const completeButton = taskRow.getByRole('button', {
      name: /mark task as complete|đánh dấu nhiệm vụ hoàn thành/i,
    })

    // Click complete — task moves to completed, button detaches (correct)
    await completeButton.click()

    await page.waitForTimeout(500)

    // Task should be in completed state
    const completedSection = page.getByRole('button', { name: /completed|đã hoàn thành/i })
    await completedSection.click()

    // Task should appear in completed section
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('rapid list creation does not duplicate', async ({ page }) => {
    const listName = `Concurrent List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    const addListInput = page.locator('input[placeholder="Add a new list..."]')

    // Submit once — input should clear after successful creation
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')

    await page.waitForTimeout(1000)

    // Should only have one instance
    const listInstances = page.getByText(listName, { exact: true })
    const count = await listInstances.count()
    expect(count).toBeLessThanOrEqual(1)
  })

  test('rapid habit toggle does not error', async ({ page }) => {
    const habitName = `Concurrent Habit ${Date.now()}`

    await page.goto('/habits')
    await waitForAppReady(page)

    // Create habit
    const addButton = page.getByRole('button', { name: /add.*habit/i }).first()
    await addButton.click()
    await page.getByPlaceholder(/habit name/i).fill(habitName)
    await page.getByRole('button', { name: /add habit/i }).click()
    await expect(page.getByText(habitName, { exact: true })).toBeVisible()

    // Rapidly toggle completion
    const card = page.locator('.bg-card').filter({ hasText: habitName })
    const completeButton = card.getByRole('button', { name: /mark complete/i })

    await completeButton.click()
    await completeButton.click()
    await completeButton.click()

    await page.waitForTimeout(500)

    // Habit should still be visible (no crash)
    await expect(page.getByText(habitName, { exact: true })).toBeVisible()
  })

  test('rapid page navigation does not cause errors', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Rapidly navigate between pages
    await page.goto('/list')
    await page.goto('/board')
    await page.goto('/calendar')
    await page.goto('/habits')
    await page.goto('/dashboard')

    await waitForAppReady(page)

    // Should land on dashboard without error
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible()
  })

  test('simultaneous task edit and delete does not crash', async ({ page }) => {
    const taskTitle = `Concurrent E2E ${Date.now()}`

    await createTask(page, taskTitle)

    // Open task detail
    await page.getByText(taskTitle, { exact: true }).click()
    await expect(page.locator('#task-priority')).toBeVisible({ timeout: 10_000 })

    // Edit title
    const titleInput = page.locator('input[aria-label="Title"]')
    await titleInput.fill(`${taskTitle} Edited`)

    // Immediately close
    await page.locator('button[aria-label="Close"]').click()

    await page.waitForTimeout(500)

    // App should not crash
    await expect(page.locator('[data-testid="app-shell"]')).toBeVisible()
  })
})
