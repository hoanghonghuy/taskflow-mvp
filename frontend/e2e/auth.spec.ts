import { test, expect } from '@playwright/test'
import { submitRegister } from './helpers/auth'
import { E2E_PASSWORD, uniqueE2eEmail } from './helpers/test-data'

test.describe('Authentication UI', () => {
  test('login page renders and links to register', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText('Welcome back')).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/register')
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

    await page.goto('/login')
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
})
