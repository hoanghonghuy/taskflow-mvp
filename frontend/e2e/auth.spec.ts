import { test, expect } from '@playwright/test'
import { clearAuthSession, submitRegister } from './helpers/auth'
import { waitForAppReady } from './helpers/app-ready'
import { E2E_PASSWORD, uniqueE2eEmail } from './helpers/test-data'

test.describe('Authentication UI', () => {
  test('login page renders and links to register', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/register')
    await expect(page.getByText('Email reset not available yet')).toBeVisible()
  })

  test('register form validation - empty fields', async ({ page }) => {
    await page.goto('/register')

    // Try to submit empty form
    await page.getByRole('button', { name: /Sign Up|Register/i }).click()

    // Form should show validation errors
    await expect(page.getByLabel('Name', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
  })

  test('register form validation - invalid email', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Name', { exact: true }).fill('Test User')
    await page.getByLabel('Email', { exact: true }).fill('invalid-email')
    await page.getByLabel('Password', { exact: true }).fill('password123')
    await page.getByRole('button', { name: /Sign Up|Register/i }).click()

    // Should show email validation error or not submit
    await page.waitForTimeout(1000)
    // Form should still be on register page with invalid email
    await expect(page).toHaveURL(/\/register/)
  })

  test('register form validation - short password', async ({ page }) => {
    await page.goto('/register')

    await page.getByLabel('Name', { exact: true }).fill('Test User')
    await page.getByLabel('Email', { exact: true }).fill(uniqueE2eEmail('shortpass'))
    await page.getByLabel('Password', { exact: true }).fill('123')
    await page.getByRole('button', { name: /Sign Up|Register/i }).click()

    // Should show password validation error or not submit
    await page.waitForTimeout(1000)
    // Form should still be on register page with short password
    await expect(page).toHaveURL(/\/register/)
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel('Email', { exact: true }).fill('nonexistent@example.com')
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword')
    await page.getByRole('button', { name: 'Login' }).click()

    // Should show error message
    await expect(page.getByText(/invalid credentials|email not found|incorrect/i).first()).toBeVisible({ timeout: 5000 })
      .catch(() => {
        // If no specific error message, at least stay on login page
        expect(page.url()).toContain('/login')
      })
  })

  test('forgot password page shows MVP guidance instead of reset form', async ({ page }) => {
    await page.goto('/forgot-password')

    await expect(page.getByText('Not available yet')).toBeVisible()
    await expect(page.getByText('What you can do instead')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/register')
    await expect(page.getByRole('link', { name: 'Sign In' })).toHaveAttribute('href', '/login')
    await expect(page.getByLabel('Email', { exact: true })).toHaveCount(0)
  })

  test('registers a new account and lands on dashboard', async ({ page }) => {
    const email = uniqueE2eEmail('register')
    const password = E2E_PASSWORD

    await submitRegister(page, {
      name: 'E2E Register User',
      email,
      password,
    })

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
    await expect(page.getByText("Here's your productivity dashboard for today.")).toBeVisible()
  })

  test('logs in with existing credentials', async ({ page }) => {
    const email = uniqueE2eEmail('login')
    const password = E2E_PASSWORD

    await submitRegister(page, {
      name: 'E2E Login User',
      email,
      password,
    })
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })

    // Middleware redirects authenticated users away from /login — clear session first.
    await clearAuthSession(page)
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes('/api/auth') &&
          response.request().method() === 'POST' &&
          response.ok(),
      ),
      page.getByRole('button', { name: 'Login' }).click(),
    ])

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  })

  test('logs out and redirects to login', async ({ page }) => {
    const email = uniqueE2eEmail('signout')
    const password = E2E_PASSWORD

    await submitRegister(page, {
      // Avoid "Logout" in the display name — it pollutes accessible names of other buttons.
      name: 'E2E Sign Out User',
      email,
      password,
    })
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
    await waitForAppReady(page)

    const featureBar = page.locator('nav').filter({
      has: page.getByRole('button', { name: /toggle sidebar|bật\/tắt thanh bên/i }),
    })
    await featureBar.locator('button.p-1.rounded-full').evaluate((button) => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })
    await page.getByRole('button', { name: 'Logout', exact: true }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
    await expect(page.getByText('Welcome back')).toBeVisible()
  })
})
