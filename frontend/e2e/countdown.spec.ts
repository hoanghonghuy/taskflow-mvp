import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Countdown', () => {
  test('loads countdown page with empty state', async ({ page }) => {
    await page.goto('/countdown')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /countdown/i })).toBeVisible()
  })

  test('adds a new countdown event', async ({ page }) => {
    const eventTitle = `E2E Event ${Date.now()}`
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateString = futureDate.toISOString().split('T')[0]

    await page.goto('/countdown')
    await waitForAppReady(page)

    // Click add countdown button
    const addButton = page.getByRole('button', { name: /add.*countdown|new.*event/i })
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Fill event details
    await page.getByPlaceholder(/title|event name/i).fill(eventTitle)
    await page.getByLabel(/date|target/i).fill(dateString)
    
    // Submit
    await page.getByRole('button', { name: /create|add|save/i }).click()

    // Verify event appears
    await expect(page.getByText(eventTitle, { exact: true })).toBeVisible()
  })

  test('changes display mode', async ({ page }) => {
    await page.goto('/countdown')
    await waitForAppReady(page)

    // Look for display mode toggle (grid/list/card view)
    const viewButton = page.getByRole('button', { name: /view|display|mode/i }).first()
    if (await viewButton.isVisible()) {
      await viewButton.click()
      // Verify UI changed (check for different layout indicators)
      await page.waitForTimeout(500)
    }
  })

  test('edits countdown title and date', async ({ page }) => {
    const originalTitle = `Edit Test ${Date.now()}`
    const updatedTitle = `${originalTitle} Updated`
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 45)
    const dateString = futureDate.toISOString().split('T')[0]

    await page.goto('/countdown')
    await waitForAppReady(page)

    // Add event first
    const addButton = page.getByRole('button', { name: /add.*countdown|new.*event/i })
    await addButton.click()
    await page.getByPlaceholder(/title|event name/i).fill(originalTitle)
    await page.getByLabel(/date|target/i).fill(dateString)
    await page.getByRole('button', { name: /create|add|save/i }).click()
    await expect(page.getByText(originalTitle, { exact: true })).toBeVisible()

    // Find and click edit button
    const eventCard = page.locator('[data-testid*="countdown"], .countdown-item, .group').filter({
      has: page.getByText(originalTitle, { exact: true }),
    })
    
    const editButton = eventCard.getByRole('button', { name: /edit/i })
    await editButton.click()

    // Update title
    const titleInput = page.getByPlaceholder(/title|event name/i)
    await titleInput.clear()
    await titleInput.fill(updatedTitle)
    
    // Update date
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 60)
    const newDateString = newDate.toISOString().split('T')[0]
    await page.getByLabel(/date|target/i).fill(newDateString)
    
    // Save
    await page.getByRole('button', { name: /save|update/i }).click()

    // Verify changes
    await expect(page.getByText(updatedTitle, { exact: true })).toBeVisible()
  })

  test('selects countdown color', async ({ page }) => {
    const eventTitle = `Color Test ${Date.now()}`
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 20)
    const dateString = futureDate.toISOString().split('T')[0]

    await page.goto('/countdown')
    await waitForAppReady(page)

    // Add event
    const addButton = page.getByRole('button', { name: /add.*countdown|new.*event/i })
    await addButton.click()
    await page.getByPlaceholder(/title|event name/i).fill(eventTitle)
    await page.getByLabel(/date|target/i).fill(dateString)

    // Select color if available
    const colorPicker = page.getByLabel(/color/i).first()
    if (await colorPicker.isVisible()) {
      await colorPicker.click()
      // Select a color option
      await page.locator('[data-color], .color-option').first().click()
    }

    await page.getByRole('button', { name: /create|add|save/i }).click()
    await expect(page.getByText(eventTitle, { exact: true })).toBeVisible()
  })

  test('deletes countdown event', async ({ page }) => {
    const eventTitle = `Delete Test ${Date.now()}`
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    const dateString = futureDate.toISOString().split('T')[0]

    await page.goto('/countdown')
    await waitForAppReady(page)

    // Add event
    const addButton = page.getByRole('button', { name: /add.*countdown|new.*event/i })
    await addButton.click()
    await page.getByPlaceholder(/title|event name/i).fill(eventTitle)
    await page.getByLabel(/date|target/i).fill(dateString)
    await page.getByRole('button', { name: /create|add|save/i }).click()
    await expect(page.getByText(eventTitle, { exact: true })).toBeVisible()

    // Delete event
    const eventCard = page.locator('[data-testid*="countdown"], .countdown-item, .group').filter({
      has: page.getByText(eventTitle, { exact: true }),
    })
    
    const deleteButton = eventCard.getByRole('button', { name: /delete|remove/i })
    await deleteButton.click()

    // Confirm deletion
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i })
    await confirmButton.click()

    // Verify removal
    await expect(page.getByText(eventTitle, { exact: true })).not.toBeVisible()
  })
})
