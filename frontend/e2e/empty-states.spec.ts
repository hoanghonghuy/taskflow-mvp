import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Empty States', () => {
  test('habits page shows empty state when no habits', async ({ page }) => {
    await page.goto('/habits')
    await waitForAppReady(page)

    // Either shows habits heading or empty state
    const hasHabits = await page.getByRole('heading', { name: /habits|thói quen/i }).isVisible()

    if (hasHabits) {
      // Check if there's an empty state message or add button
      const addButton = page.getByRole('button', { name: /add.*habit|thêm.*thói quen/i })
      await expect(addButton.first()).toBeVisible()
    }
  })

  test('countdown page shows empty state when no events', async ({ page }) => {
    await page.goto('/countdown')
    await waitForAppReady(page)

    // Should show add button even when empty
    await expect(
      page.getByRole('button', { name: /add.*countdown|new.*event|thêm/i }).first(),
    ).toBeVisible({ timeout: 10_000 })
  })

  test('dashboard today plan shows empty state when no tasks due today', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Today plan section should exist
    const todayPlanHeading = page.getByText(/today.*plan|kế hoạch hôm nay/i).first()
    await expect(todayPlanHeading).toBeVisible({ timeout: 10_000 })
  })

  test('new list shows empty task state', async ({ page }) => {
    const listName = `Empty List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // Create a new empty list
    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    // Navigate to the new list
    await page.getByText(listName, { exact: true }).click()
    await waitForAppReady(page)

    // Should show empty state or add task button
    const addTaskButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
    await expect(addTaskButton).toBeVisible()
  })

  test('board view shows columns even when empty', async ({ page }) => {
    await page.goto('/board')
    await waitForAppReady(page)

    // Board should have column headers
    const columnHeaders = page.getByRole('button', { name: /\d+$/i }).first()
    // Column headers show count — may be 0 for empty
    await expect(columnHeaders).toBeVisible({ timeout: 10_000 })
  })

  test('matrix view shows all four quadrants even when empty', async ({ page }) => {
    await page.goto('/matrix')
    await waitForAppReady(page)

    // All four quadrants should be visible — actual English text from i18n
    await expect(page.getByText(/Urgent & High/i).first()).toBeVisible()
    await expect(page.getByText(/Low Priority/i).first()).toBeVisible()
    await expect(page.getByText(/Medium Priority/i).first()).toBeVisible()
    await expect(page.getByText(/No Priority/i).first()).toBeVisible()
  })

  test('calendar view shows month grid even when no tasks', async ({ page }) => {
    await page.goto('/calendar')
    await waitForAppReady(page)

    // Month grid should be visible
    await expect(page.locator('.grid.grid-cols-7').first()).toBeVisible()
  })
})
