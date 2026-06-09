import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Tasks', () => {
  test('creates a task and marks it complete', async ({ page }) => {
    const taskTitle = `E2E task ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    const addTaskButton = page.getByLabel('Add Task', { exact: true })
    await expect(addTaskButton).toBeVisible()
    await addTaskButton.click()
    await expect(page.getByRole('heading', { name: 'New Task' })).toBeVisible()

    await page.getByPlaceholder('e.g., Pay electricity bill').fill(taskTitle)
    await page.getByRole('button', { name: 'Create Task' }).click()

    await expect(page.getByRole('heading', { name: 'New Task' })).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    const taskRow = page.locator('.group').filter({
      has: page.getByText(taskTitle, { exact: true }),
    })
    await taskRow.getByRole('button', { name: 'Mark task as complete' }).click()

    const completedSection = page.getByRole('button', { name: /Completed \(\d+\)/ })
    await expect(completedSection).toBeVisible()
    await completedSection.click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  })

  test('dashboard is accessible when authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)
    await expect(page.getByText("Here's your productivity dashboard for today.")).toBeVisible()
  })
})
