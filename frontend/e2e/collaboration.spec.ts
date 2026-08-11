import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Collaboration', () => {
  test('opens share modal from sidebar list', async ({ page }) => {
    const listName = `Share List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // Create a list
    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    // Open share modal
    const listRow = page.locator('div[role="button"]').filter({ hasText: listName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Share list"]').click()

    // Modal should be visible
    await expect(page.locator(`[aria-label*="${listName}"]`).first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/share list|chia sẻ danh sách/i).first()).toBeVisible()
  })

  test('share modal shows invite form and owner', async ({ page }) => {
    const listName = `Share List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    const listRow = page.locator('div[role="button"]').filter({ hasText: listName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Share list"]').click()

    // Email input should be visible
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()

    // Owner badge should be visible
    await expect(page.getByText(/owner|chủ sở hữu/i).first()).toBeVisible()

    // Invite button should be present
    await expect(page.getByRole('button', { name: /invite|mời/i }).first()).toBeVisible()
  })

  test('share modal shows error for non-existent user', async ({ page }) => {
    const listName = `Share List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    const listRow = page.locator('div[role="button"]').filter({ hasText: listName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Share list"]').click()

    // Try inviting a non-existent user
    const emailInput = page.locator('input[type="email"]')
    await emailInput.fill('nonexistent-user@nowhere.test')
    await page.getByRole('button', { name: /invite|mời/i }).first().click()

    // Should show error
    await expect(page.locator('p[role="alert"]')).toBeVisible({ timeout: 10_000 })
  })

  test('share modal shows error for self-invite', async ({ page }) => {
    const listName = `Share List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    const listRow = page.locator('div[role="button"]').filter({ hasText: listName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Share list"]').click()

    // Get current user email from profile
    const emailInput = page.locator('input[type="email"]')
    // Try inviting self — use a known e2e email pattern
    await emailInput.fill('e2e-user@taskflow.test')
    await page.getByRole('button', { name: /invite|mời/i }).first().click()

    // Should show error (cannot invite self)
    await expect(page.locator('p[role="alert"]')).toBeVisible({ timeout: 10_000 })
  })

  test('closes share modal with done button', async ({ page }) => {
    const listName = `Share List ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    const addListInput = page.locator('input[placeholder="Add a new list..."]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    const listRow = page.locator('div[role="button"]').filter({ hasText: listName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Share list"]').click()

    await expect(page.locator('input[type="email"]')).toBeVisible()

    // Click Done
    await page.getByRole('button', { name: /done|xong/i }).click()

    // Modal should close
    await expect(page.locator('input[type="email"]')).not.toBeVisible({ timeout: 5_000 })
  })

  test('inbox list has no share button', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    const inboxRow = page.locator('div[role="button"]').filter({
      hasText: /inbox|hộp thư đến/i,
    }).first()
    await inboxRow.hover()

    await expect(
      inboxRow.locator('button[aria-label*="Share list"]'),
    ).toHaveCount(0)
  })
})
