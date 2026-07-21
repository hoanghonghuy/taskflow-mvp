import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Wait until the authenticated app shell finishes session verification. */
export async function waitForAppReady(page: Page): Promise<void> {
  await expect(page.getByTestId('app-loading')).toBeHidden({ timeout: 60_000 })
  await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 60_000 })
}

/** Wait until the admin layout finishes auth/role checks. */
export async function waitForAdminReady(page: Page): Promise<void> {
  await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 60_000 })
}
