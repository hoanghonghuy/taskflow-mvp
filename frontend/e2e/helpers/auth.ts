import type { Page } from '@playwright/test'

export async function submitLogin(
  page: Page,
  params: { email: string; password: string },
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(params.email)
  await page.getByLabel('Password', { exact: true }).fill(params.password)

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth') &&
        response.request().method() === 'POST' &&
        response.ok(),
    ),
    page.getByRole('button', { name: 'Login' }).click(),
  ])
}

export async function submitRegister(
  page: Page,
  params: { name: string; email: string; password: string },
): Promise<void> {
  await page.goto('/register')
  await page.getByLabel('Name').fill(params.name)
  await page.getByLabel('Email', { exact: true }).fill(params.email)
  await page.locator('#password').fill(params.password)
  await page.locator('#confirmPassword').fill(params.password)

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/auth') &&
        response.request().method() === 'POST' &&
        response.ok(),
    ),
    page.getByRole('button', { name: 'Register' }).click(),
  ])
}
