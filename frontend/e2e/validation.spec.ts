import { test, expect } from '@playwright/test'
import { clearAuthSession } from './helpers/auth'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Form Validation', () => {
  test('register rejects invalid email format', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email', { exact: true }).fill('not-an-email')
    await page.locator('#password').fill('ValidPass123!')
    await page.locator('#confirmPassword').fill('ValidPass123!')

    await page.getByRole('button', { name: 'Register' }).click()

    // Should show validation error and stay on register page
    await expect(page).toHaveURL(/\/register/, { timeout: 10_000 })
    await expect(page.getByText(/invalid email|email không hợp lệ/i).first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('register rejects mismatched passwords', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email', { exact: true }).fill('test@example.com')
    await page.locator('#password').fill('ValidPass123!')
    await page.locator('#confirmPassword').fill('DifferentPass456!')

    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/register/, { timeout: 10_000 })
    await expect(
      page.getByText(/passwords.*match|mật khẩu.*khớp|do not match|không khớp/i).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('register rejects short password', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Name').fill('Test User')
    await page.getByLabel('Email', { exact: true }).fill('test@example.com')
    await page.locator('#password').fill('123')
    await page.locator('#confirmPassword').fill('123')

    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/register/, { timeout: 10_000 })
    await expect(
      page.getByText(/password.*(?:short|weak|length|characters|ký tự)/i).first(),
    ).toBeVisible({ timeout: 5_000 })
  })

  test('register rejects empty name', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Email', { exact: true }).fill('test@example.com')
    await page.locator('#password').fill('ValidPass123!')
    await page.locator('#confirmPassword').fill('ValidPass123!')

    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/register/, { timeout: 10_000 })
    await expect(page.getByText(/name.*required|tên.*bắt buộc/i).first()).toBeVisible({
      timeout: 5_000,
    })
  })

  test('login shows error for invalid credentials', async ({ page }) => {
    await clearAuthSession(page)
    await page.goto('/login')

    await page.getByLabel('Email', { exact: true }).fill('nonexistent@taskflow.test')
    await page.getByLabel('Password', { exact: true }).fill('WrongPassword123!')

    await page.getByRole('button', { name: 'Login' }).click()

    // Should show error and stay on login page
    await expect(
      page.getByText(/invalid.*credentials|incorrect|wrong|sai|không đúng/i).first(),
    ).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/login/)
  })

  test('task form requires title', async ({ page }) => {
    // Use existing auth session
    await page.goto('/list')
    await waitForAppReady(page)

    const addButton = page.locator('button[aria-label*="Add"], button[aria-label*="Thêm"]').last()
    await expect(addButton).toBeVisible()
    await addButton.click()

    // Try to submit without title
    await page.getByRole('button', { name: /create task|tạo nhiệm vụ/i }).click()

    // Should still show the form (not closed)
    await expect(page.getByRole('heading', { name: /new task|nhiệm vụ mới/i })).toBeVisible()
  })
})
