import type { Page, Response } from '@playwright/test'

/** Clear auth cookies so /login is reachable (middleware redirects authenticated users). */
export async function clearAuthSession(page: Page): Promise<void> {
  await page.context().clearCookies()
}

function isAuthResponse(response: Response, action: 'login' | 'register'): boolean {
  const request = response.request()
  if (request.method() !== 'POST') return false

  const pathname = decodeURIComponent(new URL(response.url()).pathname)
  if (!pathname.endsWith('/api/auth/[...nextauth]')) return false

  try {
    const body = request.postDataJSON() as { action?: unknown } | null
    return body?.action === action
  } catch {
    return false
  }
}

function assertSuccessfulAuthResponse(response: Response, action: 'Login' | 'Register'): void {
  if (!response.ok()) {
    throw new Error(`${action} request failed with HTTP ${response.status()}`)
  }
}

export async function submitLogin(
  page: Page,
  params: { email: string; password: string },
): Promise<void> {
  await clearAuthSession(page)
  await page.goto('/login')
  await page.getByLabel('Email', { exact: true }).fill(params.email)
  await page.getByLabel('Password', { exact: true }).fill(params.password)

  const [response] = await Promise.all([
    page.waitForResponse((candidate) => isAuthResponse(candidate, 'login')),
    page.getByRole('button', { name: 'Login' }).click(),
  ])

  assertSuccessfulAuthResponse(response, 'Login')
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

  const [response] = await Promise.all([
    page.waitForResponse((candidate) => isAuthResponse(candidate, 'register')),
    page.getByRole('button', { name: 'Register' }).click(),
  ])

  assertSuccessfulAuthResponse(response, 'Register')
}
