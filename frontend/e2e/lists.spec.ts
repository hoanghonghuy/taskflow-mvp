import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Lists', () => {
  test('loads sidebar with my lists section', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /my lists|danh sách/i })).toBeVisible()
  })

  test('creates a new list via sidebar', async ({ page }) => {
    const listName = `E2E List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await expect(addListInput).toBeVisible()
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')

    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('edits list name and color', async ({ page }) => {
    const originalName = `Edit List ${Date.now()}`
    const updatedName = `${originalName} Renamed`

    await page.goto('/list')
    await waitForAppReady(page)

    // Create list first
    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(originalName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(originalName, { exact: true })).toBeVisible({ timeout: 10_000 })

    // Open edit dialog
    const listRow = page.locator('div[role="button"]').filter({ hasText: originalName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Edit list"]').click()

    // Edit dialog should be visible
    await expect(page.locator('#list-edit-name')).toBeVisible()
    await page.locator('#list-edit-name').fill(updatedName)

    // Pick a different color
    const colorButtons = page.locator('button[aria-label*="Color option"]')
    const colorCount = await colorButtons.count()
    if (colorCount > 1) {
      await colorButtons.nth(1).click()
    }

    await page.getByRole('button', { name: /save|lưu/i }).click()

    await expect(page.getByText(updatedName, { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('deletes a list with confirmation', async ({ page }) => {
    const listName = `Delete List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // Create list
    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    // Delete
    const listRow = page.locator('div[role="button"]').filter({ hasText: listName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Delete list"]').click()

    // Confirm deletion
    await page.getByRole('button', { name: /delete|xóa/i }).last().click()

    await expect(page.getByText(listName, { exact: true })).not.toBeVisible({ timeout: 10_000 })
  })

  test('navigates to a list and shows its tasks', async ({ page }) => {
    const listName = `Nav List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // Create list
    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    // Click to navigate
    await page.getByText(listName, { exact: true }).click()
    await waitForAppReady(page)

    // Should show the list name as heading (desktop) or in mobile title
    await expect(page.getByText(listName, { exact: true }).first()).toBeVisible()
  })

  test('cannot delete inbox list', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Inbox should not have delete button
    const inboxRow = page.locator('div[role="button"]').filter({ hasText: /inbox|hộp thư đến/i })
    await inboxRow.hover()
    await expect(
      inboxRow.locator('button[aria-label*="Delete list"]'),
    ).toHaveCount(0)
  })
})
