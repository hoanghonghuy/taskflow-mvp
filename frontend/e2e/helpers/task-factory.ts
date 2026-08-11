import { type Page, expect } from '@playwright/test'
import { waitForAppReady } from './app-ready'

export async function createTask(
  page: Page,
  title: string,
  options?: {
    description?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    dueDate?: string
    tags?: string[]
  },
) {
  await page.goto('/list')
  await waitForAppReady(page)

  const addButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
  await expect(addButton).toBeVisible()
  await addButton.click()

  const modalHeading = page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })
  await expect(modalHeading).toBeVisible()

  await page
    .getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i)
    .fill(title)

  if (options?.description) {
    await page.locator('#task-form-description').fill(options.description)
  }

  if (options?.priority) {
    await page.locator('#task-form-priority').selectOption(options.priority)
  }

  if (options?.dueDate) {
    await page.locator('#task-form-due-date').fill(options.dueDate)
  }

  if (options?.tags && options.tags.length > 0) {
    for (const tag of options.tags) {
      await page.locator('#task-form-tags').fill(tag)
      await page.keyboard.press('Enter')
    }
  }

  await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()
  await expect(modalHeading).toBeHidden({ timeout: 15_000 })
  await expect(page.getByText(title, { exact: true })).toBeVisible()
}

export async function openTaskDetail(page: Page, title: string) {
  await page.getByRole('button', { name: title, exact: true }).click()
  await expect(page.locator('#task-priority')).toBeVisible({ timeout: 10_000 })
}

export async function deleteTaskViaDetail(page: Page, title: string) {
  await openTaskDetail(page, title)
  // Click delete button in detail panel header
  await page.locator('button[aria-label="Delete"]').first().click({ force: true })
  // Wait for Radix AlertDialog to appear
  await expect(page.locator('[role="alertdialog"]')).toBeVisible({ timeout: 5_000 })
  // Confirm button text is "Delete task"
  await page.locator('[role="alertdialog"]').getByRole('button', { name: /Delete task/i }).click()
  await expect(page.getByText(title, { exact: true })).not.toBeVisible({ timeout: 15_000 })
}
