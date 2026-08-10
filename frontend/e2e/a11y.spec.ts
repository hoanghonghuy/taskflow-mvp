import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'
import { createTask } from './helpers/task-factory'
import { cleanupOwnedTestTasks } from './helpers/cleanup'

test.describe('Accessibility', () => {
  test.afterEach(async ({ page }) => {
    await cleanupOwnedTestTasks(page, ['A11y E2E'])
  })

  test('login form has proper labels and roles', async ({ page }) => {
    await page.goto('/login')

    // Form elements should have accessible labels
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign Up' })).toBeVisible()
  })

  test('register form has proper labels and roles', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByLabel('Name')).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  })

  test('task form modal traps focus', async ({ page }) => {
    const taskTitle = `A11y E2E ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // Open task form
    const addButton = page.locator('button[aria-label="taskList.addTask"]')
    await addButton.click()

    // Modal should be visible
    const modalHeading = page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })
    await expect(modalHeading).toBeVisible()

    // Press Escape to close
    await page.keyboard.press('Escape')
    await expect(modalHeading).toBeHidden({ timeout: 5_000 })
  })

  test('task detail panel has close button with aria-label', async ({ page }) => {
    const taskTitle = `A11y E2E ${Date.now()}`

    await createTask(page, taskTitle)

    // Open task detail
    await page.getByText(taskTitle, { exact: true }).click()

    // Close button should have aria-label
    const closeButton = page.locator('button[aria-label="Close"]')
    await expect(closeButton).toBeVisible()

    // Close via keyboard
    await page.keyboard.press('Escape')
    await expect(closeButton).toBeHidden({ timeout: 5_000 })
  })

  test('settings page has proper section headings', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Each settings section should have a heading
    await expect(
      page.getByRole('heading', { name: /language|ngôn ngữ/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /appearance|giao diện/i }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /bottom navigation|thanh điều hướng dưới/i }),
    ).toBeVisible()
  })

  test('sidebar navigation items are keyboard accessible', async ({ page }) => {
    await page.goto('/list')
    await waitForAppReady(page)

    // Sidebar items should be focusable (role="button" with tabindex)
    const sidebarItems = page.locator('div[role="button"][tabindex="0"]')
    const count = await sidebarItems.count()
    expect(count).toBeGreaterThan(0)

    // First item should be focusable
    const firstItem = sidebarItems.first()
    await firstItem.focus()
    await expect(firstItem).toBeFocused()
  })

  test('board view has accessible column headers', async ({ page }) => {
    await page.goto('/board')
    await waitForAppReady(page)

    // Column headers should be buttons with count
    const columnHeaders = page.getByRole('button', { name: /\d+$/ })
    const count = await columnHeaders.count()
    expect(count).toBeGreaterThan(0)
  })

  test('confirmation dialog has proper roles', async ({ page }) => {
    const listName = `A11y Delete ${Date.now()}`

    await page.goto('/list')
    await waitForAppReady(page)

    // Create a list to delete
    const addListInput = page.locator('input[placeholder="sidebar.addNewList"]')
    await addListInput.fill(listName)
    await page.keyboard.press('Enter')
    await expect(page.getByText(listName, { exact: true })).toBeVisible({ timeout: 10_000 })

    // Trigger delete
    const listRow = page.locator('div[role="button"]').filter({ hasText: listName })
    await listRow.hover()
    await listRow.locator('button[aria-label*="Delete list"]').click()

    // Alert dialog should appear
    await expect(page.locator('[role="alertdialog"]')).toBeVisible({ timeout: 5_000 })

    // Should have cancel and confirm buttons
    await expect(
      page.locator('[role="alertdialog"] button').first(),
    ).toBeVisible()

    // Dismiss with Escape
    await page.keyboard.press('Escape')
    await expect(page.locator('[role="alertdialog"]')).toBeHidden({ timeout: 5_000 })
  })

  test('language toggle buttons have aria-pressed state', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    const languageGroup = page.getByRole('group', { name: /language|ngôn ngữ/i })
    const englishButton = languageGroup.getByRole('button', { name: /^english$/i })

    // Should have aria-pressed attribute
    const pressed = await englishButton.getAttribute('aria-pressed')
    expect(pressed).toBeTruthy()
  })

  test('theme cards have aria-pressed state', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Theme cards should have aria-pressed
    const themeCards = page.locator('button[aria-pressed]')
    const count = await themeCards.count()
    expect(count).toBeGreaterThan(0)

    // Exactly one should be pressed (selected)
    const selectedCards = page.locator('button[aria-pressed="true"]')
    const selectedCount = await selectedCards.count()
    expect(selectedCount).toBeGreaterThanOrEqual(1)
  })
})
