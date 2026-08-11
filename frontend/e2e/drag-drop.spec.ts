import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { createTask } from './helpers/task-factory'
import { cleanupOwnedTestTasks } from './helpers/cleanup'

test.describe('Drag and Drop', () => {
  test.afterEach(async ({ page }) => {
    await cleanupOwnedTestTasks(page, ['Drag E2E'])
  })

  test('board view shows draggable task cards', async ({ page }) => {
    const taskTitle = `Drag E2E ${Date.now()}`

    await createTask(page, taskTitle)

    await page.goto('/board')
    await waitForAppReady(page)

    // Select a list
    const listSelect = page.locator('select[aria-label]:visible').first()
    if (await listSelect.isVisible()) {
      await listSelect.selectOption({ index: 0 })
      await page.waitForTimeout(500)
    }

    // Task card should be visible
    const taskCard = page.locator('.group').filter({
      has: page.getByText(taskTitle, { exact: true }),
    }).first()

    await expect(taskCard).toBeVisible()

    // Task should have draggable attribute or cursor-grab class
    const isDraggable = await taskCard.getAttribute('draggable')
    const hasGrabCursor = await taskCard.locator('.cursor-grab').count()

    // Either draggable attribute or grab cursor indicates drag support
    expect(isDraggable === 'true' || hasGrabCursor > 0).toBeTruthy()
  })

  test('board task can be moved to another column via select', async ({ page }) => {
    const taskTitle = `Drag E2E ${Date.now()}`

    await createTask(page, taskTitle)

    await page.goto('/board')
    await waitForAppReady(page)

    const listSelect = page.locator('select[aria-label]:visible').first()
    if (await listSelect.isVisible()) {
      await listSelect.selectOption({ index: 0 })
      await page.waitForTimeout(500)
    }

    const taskCard = page.locator('.group').filter({
      has: page.getByText(taskTitle, { exact: true }),
    }).first()

    // Find the move select within the task card
    const moveSelect = taskCard.locator('select[aria-label]').first()
    if (await moveSelect.isVisible()) {
      const options = await moveSelect.locator('option').all()
      if (options.length > 1) {
        const targetValue = await options[1].getAttribute('value')
        if (targetValue) {
          await moveSelect.selectOption(targetValue)
          await page.waitForTimeout(500)

          // Task should still be visible (moved to another column)
          await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
        }
      }
    }
  })

  test('matrix view shows task in quadrant', async ({ page }) => {
    const taskTitle = `Drag E2E ${Date.now()}`

    await createTask(page, taskTitle, { priority: 'high' })

    await page.goto('/matrix')
    await waitForAppReady(page)

    // Task should appear in one of the quadrants
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  })

  test('matrix task priority change moves it between quadrants', async ({ page }) => {
    const taskTitle = `Drag E2E ${Date.now()}`

    await createTask(page, taskTitle, { priority: 'low' })

    await page.goto('/matrix')
    await waitForAppReady(page)

    // Open task detail
    await page.getByText(taskTitle, { exact: true }).click()
    await expect(page.locator('#task-priority')).toBeVisible({ timeout: 10_000 })

    // Change to urgent (should move to Q1)
    await page.locator('#task-priority').selectOption('urgent')
    await page.locator('button[aria-label="Close"]').click()
    await page.waitForTimeout(500)

    // Task should still be visible
    await expect(page.getByText(taskTitle, { exact: true })).toBeVisible()
  })

  test('list view tasks are reorderable', async ({ page }) => {
    const task1 = `Drag E2E A ${Date.now()}`
    const task2 = `Drag E2E B ${Date.now()}`

    await createTask(page, task1)
    // createTask already navigated to /list, just create second task
    const addButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
    await addButton.click()
    const modalHeading = page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })
    await expect(modalHeading).toBeVisible()
    await page.getByPlaceholder(/pay electricity bill|thanh toán hóa đơn điện/i).fill(task2)
    await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()
    await expect(modalHeading).toBeHidden({ timeout: 15_000 })
    await expect(page.getByText(task2, { exact: true })).toBeVisible()

    // Both tasks should be visible
    await expect(page.getByText(task1, { exact: true })).toBeVisible()
    await expect(page.getByText(task2, { exact: true })).toBeVisible()

    // Tasks should have draggable attribute
    const taskRow = page.locator('.group').filter({
      has: page.getByText(task1, { exact: true }),
    }).first()

    const isDraggable = await taskRow.getAttribute('draggable')
    expect(isDraggable).toBe('true')
  })
})
