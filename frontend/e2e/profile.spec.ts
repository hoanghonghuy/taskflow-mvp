import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { cleanupOwnedTestHabits, cleanupOwnedTestTasks } from './helpers/cleanup'

async function readFractionStat(page: import('@playwright/test').Page, label: RegExp) {
  const card = page
    .locator('div.rounded-lg.border')
    .filter({ has: page.getByText(label) })
    .first()
  await expect(card).toBeVisible()
  const valueText = await card.locator('p.tabular-nums').textContent()
  const match = valueText?.match(/(\d+)\s*\/\s*(\d+)/)
  expect(match, `Could not parse fraction from "${valueText}"`).toBeTruthy()
  return {
    completed: Number(match![1]),
    total: Number(match![2]),
  }
}

test.describe('Profile', () => {
  test.afterEach(async ({ page }) => {
    await cleanupOwnedTestTasks(page, ['Stats Test', 'Profile Test'])
    await cleanupOwnedTestHabits(page, ['Profile Test'])
  })

  test('loads profile page', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: /profile|hồ sơ/i }).first()).toBeVisible()
  })

  test('displays avatar, name and email', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    await expect(page.getByRole('heading', { name: 'E2E User' })).toBeVisible()
    await expect(page.getByText(/@taskflow\.test/i)).toBeVisible()
  })

  test('shows stats grid', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)

    await expect(page.getByText(/tasks completed|nhiệm vụ hoàn thành/i).first()).toBeVisible()
    await expect(page.getByText(/completed today|hoàn thành hôm nay/i).first()).toBeVisible()
  })

  test('stats update after task completion', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)
    const before = await readFractionStat(page, /tasks completed|nhiệm vụ hoàn thành/i)

    await page.goto('/list')
    await waitForAppReady(page)

    const taskTitle = `Stats Test ${Date.now()}`
    await page.getByLabel('Add Task', { exact: true }).click()
    await page.getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i).fill(taskTitle)
    await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    const taskRow = page.locator('.group').filter({
      has: page.getByText(taskTitle, { exact: true }),
    })
    await taskRow.getByRole('button', { name: /mark task as complete|đánh dấu.*hoàn thành/i }).click()

    await page.goto('/profile')
    await waitForAppReady(page)
    const after = await readFractionStat(page, /tasks completed|nhiệm vụ hoàn thành/i)

    expect(after.total).toBeGreaterThan(before.total)
    expect(after.completed).toBeGreaterThan(before.completed)
  })

  test('stats update after habit completion', async ({ page }) => {
    await page.goto('/profile')
    await waitForAppReady(page)
    const before = await readFractionStat(page, /habits completed|thói quen/i)

    await page.goto('/habits')
    await waitForAppReady(page)

    const habitName = `Profile Test ${Date.now()}`
    await page.getByRole('button', { name: /add.*habit|thêm.*thói quen/i }).click()
    await page.getByPlaceholder(/habit name|tên thói quen/i).fill(habitName)
    await page.getByRole('button', { name: /create|add|tạo|thêm/i }).click()
    await expect(page.getByText(habitName, { exact: true })).toBeVisible()

    const habitCard = page.locator('div').filter({ has: page.getByText(habitName, { exact: true }) }).first()
    const completeButton = habitCard.getByRole('button', {
      name: /mark complete|đánh dấu hoàn thành|completed|đã hoàn thành/i,
    }).first()
    if (await completeButton.isVisible()) {
      await completeButton.click()
    }

    await page.goto('/profile')
    await waitForAppReady(page)
    const after = await readFractionStat(page, /habits completed|thói quen/i)

    expect(after.total).toBeGreaterThan(before.total)
  })
})
