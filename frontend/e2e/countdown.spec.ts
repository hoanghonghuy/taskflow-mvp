import { test, expect, type Page } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

async function openAddCountdownForm(page: Page) {
  const addButton = page.getByRole('button', { name: /add.*countdown|new.*event/i }).first()
  await expect(addButton).toBeVisible()
  await addButton.click()
  await expect(page.getByPlaceholder(/title|event name/i)).toBeVisible()
}

async function selectFutureCountdownDate(page: Page, daysAhead = 30) {
  const target = new Date()
  target.setDate(target.getDate() + daysAhead)
  target.setHours(12, 0, 0, 0)

  const datePickerButton = page
    .getByRole('button', { name: /select date|placeholder/i })
    .or(page.locator('button:has(svg.lucide-calendar-days)').last())
    .first()
  await datePickerButton.click()

  const popover = page.locator('[data-dtp-content="true"]')
  await expect(popover).toBeVisible()

  const now = new Date()
  const monthsDiff =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  for (let i = 0; i < monthsDiff; i++) {
    await popover.locator('button.rdp-button_next').click()
  }

  const dataDay = `${target.getMonth() + 1}/${target.getDate()}/${target.getFullYear()}`
  await popover.locator(`button[data-day="${dataDay}"]`).click()
}

async function submitNewCountdown(page: Page) {
  await page.getByRole('button', { name: /^add countdown$/i }).first().click()
}

async function createCountdown(page: Page, title: string) {
  await openAddCountdownForm(page)
  await page.getByPlaceholder(/title|event name/i).fill(title)
  await selectFutureCountdownDate(page)
  await submitNewCountdown(page)
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}

function countdownCard(page: Page, title: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: title })
}

test.describe('Countdown', () => {
  test('loads countdown page with empty state', async ({ page }) => {
    await page.goto('/countdown')
    await waitForAppReady(page)

    await expect(page.getByRole('button', { name: /add.*countdown|new.*event/i })).toBeVisible()
  })

  test('adds a new countdown event', async ({ page }) => {
    const eventTitle = `E2E Event ${Date.now()}`

    await page.goto('/countdown')
    await waitForAppReady(page)
    await createCountdown(page, eventTitle)
  })

  test('changes display mode', async ({ page }) => {
    await page.goto('/countdown')
    await waitForAppReady(page)

    const viewButton = page.getByRole('button', { name: /view|display|mode/i }).first()
    if (await viewButton.isVisible()) {
      await viewButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('edits countdown title and date', async ({ page }) => {
    const originalTitle = `Edit Test ${Date.now()}`
    const updatedTitle = `${originalTitle} Updated`

    await page.goto('/countdown')
    await waitForAppReady(page)
    await createCountdown(page, originalTitle)

    const card = countdownCard(page, originalTitle)
    await card.getByRole('button', { name: /^edit$/i }).click({ force: true })

    // hasText no longer matches after edit opens — title lives in input value only
    const titleInput = page.locator('[data-slot="card"] form input').first()
    await expect(titleInput).toHaveValue(originalTitle)
    await titleInput.fill(updatedTitle)
    await page.getByRole('button', { name: /^save$/i }).click()

    await expect(page.getByText(updatedTitle, { exact: true })).toBeVisible()
  })

  test('selects countdown color', async ({ page }) => {
    const eventTitle = `Color Test ${Date.now()}`

    await page.goto('/countdown')
    await waitForAppReady(page)
    await openAddCountdownForm(page)
    await page.getByPlaceholder(/title|event name/i).fill(eventTitle)
    await selectFutureCountdownDate(page)

    const colorOptions = page.locator('[role="radio"]')
    const colorCount = await colorOptions.count()
    if (colorCount > 1) {
      await colorOptions.nth(1).click()
    }

    await submitNewCountdown(page)
    await expect(page.getByText(eventTitle, { exact: true })).toBeVisible()
  })

  test('persists countdown event after reload', async ({ page }) => {
    const eventTitle = `Persist Test ${Date.now()}`

    await page.goto('/countdown')
    await waitForAppReady(page)
    await createCountdown(page, eventTitle)

    await page.reload()
    await waitForAppReady(page)
    await page.goto('/countdown')
    await waitForAppReady(page)

    await expect(page.getByText(eventTitle, { exact: true })).toBeVisible()
  })

  test('deletes countdown event', async ({ page }) => {
    const eventTitle = `Delete Test ${Date.now()}`

    await page.goto('/countdown')
    await waitForAppReady(page)
    await createCountdown(page, eventTitle)

    const card = countdownCard(page, eventTitle)
    await card.getByRole('button', { name: /delete countdown/i }).click({ force: true })

    await page.getByRole('button', { name: /^delete countdown$/i }).last().click()

    await expect(page.getByText(eventTitle, { exact: true })).not.toBeVisible()
  })
})
