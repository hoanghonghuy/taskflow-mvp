import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'
import { assertNoPageGuardFailures, installPageGuards } from './page-guards'

/** Wait until the authenticated app shell finishes session verification. */
export async function waitForAppReady(page: Page): Promise<void> {
  installPageGuards(page)
  await expect(page.getByTestId('app-loading')).toBeHidden({ timeout: 60_000 })
  await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 60_000 })
  await assertNoPageGuardFailures(page)
}

/** Wait until the admin layout finishes auth/role checks. */
export async function waitForAdminReady(page: Page): Promise<void> {
  installPageGuards(page)
  await expect(page.locator('.animate-spin')).toBeHidden({ timeout: 60_000 })
  await assertNoPageGuardFailures(page)
}
