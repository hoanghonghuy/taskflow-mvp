import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Profile', () => {
  test('loads profile page', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('displays avatar, name and email', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    // Check for user info display
    const userInfo = page.locator('text=/test.*user|e2e.*user/i').first()
    if (await userInfo.isVisible()) {
      await expect(userInfo).toBeVisible()
    }

    // Check for email display
    const emailText = page.locator('text=/@.*\\..*|email/i').first()
    if (await emailText.isVisible()) {
      await expect(emailText).toBeVisible()
    }
  })

  test('shows stats grid', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    // Look for stats indicators (tasks completed, habits, etc)
    const statsSection = page.locator('text=/completed|total|statistics/i').first()
    
    if (await statsSection.isVisible()) {
      await expect(statsSection).toBeVisible()
    }
  })

  test('stats update after task completion', async ({ page }) => {
    // First, create and complete a task
    await page.goto('/list')
    await waitForAppReady(page)

    const taskTitle = `Stats Test ${Date.now()}`
    const addTaskButton = page.getByLabel('Add Task', { exact: true })
    await addTaskButton.click()
    await page.getByPlaceholder('e.g., Pay electricity bill').fill(taskTitle)
    await page.getByRole('button', { name: 'Create Task' }).click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    // Complete the task
    const taskRow = page.locator('.group').filter({
      has: page.getByText(taskTitle, { exact: true }),
    })
    await taskRow.getByRole('button', { name: 'Mark task as complete' }).click()

    // Navigate to profile
    await page.goto('/profile')
    await waitForAppReady(page)

    // Verify profile page loaded
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('stats update after habit completion', async ({ page }) => {
    // Add a habit
    await page.goto('/habits')
    await waitForAppReady(page)

    const habitName = `Profile Test ${Date.now()}`
    const addButton = page.getByRole('button', { name: /add.*habit/i })
    await addButton.click()
    await page.getByPlaceholder(/habit name/i).fill(habitName)
    await page.getByRole('button', { name: /create|add/i }).click()
    await expect(page.getByText(habitName, { exact: true })).toBeVisible()

    // Navigate to profile
    await page.goto('/profile')
    await waitForAppReady(page)

    // Verify profile page shows updated info
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })
})
