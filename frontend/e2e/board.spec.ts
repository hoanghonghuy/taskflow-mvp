import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Board', () => {
  test('persists task column after reload', async ({ page }) => {
    const taskTitle = `Board E2E ${Date.now()}`

    await page.goto('/board')
    await waitForAppReady(page)

    const listSelect = page.locator('select').first()
    await expect(listSelect).toBeVisible()
    const listOptions = await listSelect.locator('option').all()
    if (listOptions.length === 0) {
      test.skip()
      return
    }

    await listSelect.selectOption({ index: 0 })

    const addTaskButton = page.locator('button').filter({ hasText: /add task|thêm nhiệm vụ/i }).first()
    await addTaskButton.click()

    await page.getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i).fill(taskTitle)
    await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()

    const taskCard = page.locator('.group').filter({ has: page.getByText(taskTitle, { exact: true }) })
    const columns = page.locator('[class*="md:w-72"]').filter({ has: page.getByText(/in progress|đang thực hiện/i) })
    const targetColumn = columns.first()

    await taskCard.dragTo(targetColumn)
    await page.waitForTimeout(500)

    await page.reload()
    await waitForAppReady(page)
    await page.goto('/board')
    await waitForAppReady(page)

    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
    const inProgressColumn = page.locator('[class*="md:w-72"]').filter({ has: page.getByText(/in progress|đang thực hiện/i) })
    await expect(inProgressColumn.getByText(taskTitle, { exact: true })).toBeVisible()
  })
})
