import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Board', () => {
  test('persists task column after reload', async ({ page }) => {
    const taskTitle = `Board E2E ${Date.now()}`

    await page.goto('/board')
    await waitForAppReady(page)

    const listSelect = page.locator('select[aria-label]:visible').first()
    await expect(listSelect).toBeVisible()
    const listOptions = await listSelect.locator('option').all()
    expect(listOptions.length).toBeGreaterThan(0)

    await listSelect.selectOption({ index: 0 })

    const addTaskButton = page.locator('button').filter({ hasText: /add task|thêm nhiệm vụ/i }).first()
    await addTaskButton.click()

    await page.getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i).fill(taskTitle)
    await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    const taskCard = page
      .locator('.group:has(select[aria-label])')
      .filter({ has: page.getByText(taskTitle, { exact: true }) })
      .first()
    const moveSelect = taskCard.getByRole('combobox', {
      name: /move task to column|chuyển nhiệm vụ sang cột/i,
    })
    const targetOption = moveSelect
      .locator('option')
      .filter({ hasText: /in progress|đang thực hiện/i })
      .first()
    const targetValue = await targetOption.getAttribute('value')
    expect(targetValue).toBeTruthy()
    const moveResponse = page.waitForResponse((response) => {
      const request = response.request()
      if (
        request.method() !== 'PUT' ||
        !/\/api\/tasks\/[^/]+$/.test(new URL(response.url()).pathname)
      ) {
        return false
      }
      const body = request.postDataJSON() as { columnId?: string } | null
      return response.ok() && body?.columnId === targetValue
    })
    await Promise.all([moveResponse, moveSelect.selectOption(targetValue!)])

    const inProgressColumn = page
      .getByRole('button', { name: /^(in progress|đang thực hiện)\s+\d+$/i })
      .locator('xpath=ancestor::div[contains(@class,"md:w-72")][1]')
    await expect(inProgressColumn.getByText(taskTitle, { exact: true })).toBeVisible()

    await page.reload()
    await waitForAppReady(page)
    await expect(inProgressColumn.getByText(taskTitle, { exact: true })).toBeVisible()
  })
})
