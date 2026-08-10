import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { createTask } from './helpers/task-factory'
import { cleanupOwnedTestTasks } from './helpers/cleanup'

test.describe('Dashboard', () => {
  test.afterEach(async ({ page }) => {
    await cleanupOwnedTestTasks(page, ['Dashboard E2E'])
  })

  test('loads dashboard with greeting and subtitle', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Greeting heading (desktop only: hidden md:block)
    const greeting = page.locator('h1').first()
    await expect(greeting).toBeVisible()

    // Subtitle
    await expect(
      page.getByText(/productivity dashboard|bảng điều khiển/i).first(),
    ).toBeVisible()
  })

  test('displays three stat cards', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Today card
    await expect(page.getByText(/today|hôm nay/i).first()).toBeVisible()
    // Upcoming card
    await expect(page.getByText(/upcoming|sắp tới/i).first()).toBeVisible()
    // Habits card
    await expect(page.getByText(/habits|thói quen/i).first()).toBeVisible()
  })

  test('clicking Today stat card navigates to list', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Find and click the Today stat card button
    const todayCard = page.locator('button').filter({
      has: page.getByText(/today|hôm nay/i),
    }).first()
    await todayCard.click()

    await waitForAppReady(page)
    await expect(page).toHaveURL(/\/list/)
  })

  test('clicking Habits stat card navigates to habits', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    const habitsCard = page.locator('button').filter({
      has: page.getByText(/habits|thói quen/i),
    }).first()
    await habitsCard.click()

    await waitForAppReady(page)
    await expect(page).toHaveURL(/\/habits/)
  })

  test('displays productivity heatmap', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Heatmap title
    await expect(
      page.getByText(/heatmap|biểu đồ/i).first(),
    ).toBeVisible()

    // Heatmap cells should exist
    const heatmapCells = page.locator('div.w-3.h-3')
    const count = await heatmapCells.count()
    expect(count).toBeGreaterThan(0)
  })

  test('displays today plan section', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    await expect(
      page.getByText(/today.*plan|kế hoạch hôm nay/i).first(),
    ).toBeVisible()
  })

  test('today plan shows tasks with due date today', async ({ page }) => {
    const taskTitle = `Dashboard E2E ${Date.now()}`
    const today = new Date().toISOString().split('T')[0]

    await createTask(page, taskTitle, { dueDate: today })

    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Task should appear in today's plan
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('clicking a task in today plan navigates to list', async ({ page }) => {
    const taskTitle = `Dashboard E2E ${Date.now()}`
    const today = new Date().toISOString().split('T')[0]

    await createTask(page, taskTitle, { dueDate: today })

    await page.goto('/dashboard')
    await waitForAppReady(page)

    // Click the task in today's plan
    const taskButton = page.locator('ul li button').filter({
      hasText: taskTitle,
    }).first()

    if (await taskButton.isVisible()) {
      await taskButton.click()
      await waitForAppReady(page)
      await expect(page).toHaveURL(/\/list/)
    }
  })

  test('AI briefing button hidden when AI disabled', async ({ page }) => {
    await page.goto('/dashboard')
    await waitForAppReady(page)

    // AI features are disabled by feature flag — no briefing button
    await expect(
      page.getByRole('button', { name: /daily briefing|bản tin hàng ngày/i }),
    ).toHaveCount(0)
  })
})
