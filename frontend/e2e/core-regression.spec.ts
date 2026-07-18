import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

async function createTask(page: import('@playwright/test').Page, title: string) {
  await page.goto('/list')
  await waitForAppReady(page)

  const addTaskButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
  await expect(addTaskButton).toBeVisible()
  await addTaskButton.click()

  const taskModalHeading = page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })
  await expect(taskModalHeading).toBeVisible()

  await page
    .getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i)
    .fill(title)
  await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()

  await expect(taskModalHeading).toBeHidden({ timeout: 15_000 })
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}

test.describe('Core regression', () => {
  test('server search finds a newly created task', async ({ page }) => {
    const uniqueToken = `E2E-Search-${Date.now()}`
    await createTask(page, uniqueToken)

    const searchRequest = page.waitForRequest(
      (request) =>
        request.method() === 'GET' &&
        request.url().includes('/api/tasks/search') &&
        request.url().includes(encodeURIComponent(uniqueToken)),
    )

    await page.getByRole('button', { name: /search tasks|tìm nhiệm vụ/i }).click()
    await page
      .getByPlaceholder(/search tasks by title|tìm kiếm theo tiêu đề/i)
      .fill(uniqueToken)

    await searchRequest
    await expect(page.getByText(uniqueToken, { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('task recurrence can be set to daily', async ({ page }) => {
    const taskTitle = `E2E-Recurrence-${Date.now()}`
    await createTask(page, taskTitle)

    await page.getByText(taskTitle, { exact: true }).click()
    await expect(page.getByText(/^repeat$|^lặp lại$/i)).toBeVisible()

    const updateRequest = page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        request.url().includes('/api/tasks/'),
    )
    await page.locator('select:has(option[value="daily"])').selectOption('daily')
    const request = await updateRequest
    const payload = request.postDataJSON() as { recurrence?: { type?: string } }
    expect(payload.recurrence?.type).toBe('daily')
  })
})
