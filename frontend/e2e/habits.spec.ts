import { test, expect, type Page } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

async function createHabit(page: Page, habitName: string) {
  const addButton = page.getByRole('button', { name: /add.*habit/i }).first()
  await expect(addButton).toBeVisible()
  await addButton.click()
  await page.getByPlaceholder(/habit name/i).fill(habitName)
  await page.getByRole('button', { name: /add habit/i }).click()
  await expect(page.getByText(habitName, { exact: true })).toBeVisible()
}

function habitCard(page: Page, habitName: string) {
  return page.locator('.bg-card').filter({ hasText: habitName })
}

test.describe('Habits', () => {
  test('loads habits page', async ({ page }) => {
    await page.goto('/habits')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: 'Habits' })).toBeVisible()
  })

  test('adds a new habit', async ({ page }) => {
    const habitName = `E2E Habit ${Date.now()}`

    await page.goto('/habits')
    await waitForAppReady(page)
    await createHabit(page, habitName)
  })

  test('completes habit for today', async ({ page }) => {
    const habitName = `Complete Test ${Date.now()}`

    await page.goto('/habits')
    await waitForAppReady(page)
    await createHabit(page, habitName)

    const card = habitCard(page, habitName)
    await card.getByRole('button', { name: /mark complete/i }).click()
    await expect(card.getByRole('button', { name: /completed/i })).toBeVisible({ timeout: 15_000 })
  })

  test('toggles weekly grid view', async ({ page }) => {
    const habitName = `Grid Test ${Date.now()}`

    await page.goto('/habits')
    await waitForAppReady(page)
    await createHabit(page, habitName)

    const card = habitCard(page, habitName)
    const gridCells = card.locator('.grid-cols-30 > div')
    await expect(gridCells).toHaveCount(30)

    const todayCell = card.locator('.grid-cols-30 > div.ring-primary').first()
    await todayCell.click()
    await expect(todayCell).toHaveClass(/color-habits-completed/, { timeout: 15_000 })
  })

  test('deletes a habit with confirmation', async ({ page }) => {
    const habitName = `Delete Test ${Date.now()}`

    await page.goto('/habits')
    await waitForAppReady(page)
    await createHabit(page, habitName)

    const card = habitCard(page, habitName)
    await card.getByRole('button', { name: /delete habit/i }).click()
    await page.getByRole('button', { name: /^delete habit$/i }).last().click()

    await expect(page.getByText(habitName, { exact: true })).not.toBeVisible()
  })

  test('navigates via FeatureBar', async ({ page }) => {
    await page.goto('/habits')
    await waitForAppReady(page)

    const navButton = page.getByRole('button', { name: /^list view$/i })
    await expect(navButton).toBeVisible()
    await navButton.click()
    await waitForAppReady(page)
    await expect(page).toHaveURL(/\/list/)
  })
})
