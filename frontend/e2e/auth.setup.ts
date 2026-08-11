import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test as setup, expect } from '@playwright/test'
import { submitLogin, submitRegister } from './helpers/auth'
import { E2E_PASSWORD } from './helpers/test-data'
import { waitForAppReady } from './helpers/app-ready'

const authDir = path.join(__dirname, '../playwright/.auth')
const authFile = path.join(authDir, 'user.json')
const e2eUserMetaFile = path.join(authDir, 'e2e-user.json')

const USER_EMAIL = 'user@gmail.com'
const USER_PASSWORD = E2E_PASSWORD

setup('register and save authenticated session', async ({ page }) => {
  mkdirSync(authDir, { recursive: true })

  writeFileSync(e2eUserMetaFile, JSON.stringify({ email: USER_EMAIL, name: 'E2E User' }), 'utf8')

  // Try login first — if user already exists from previous run
  try {
    await submitLogin(page, { email: USER_EMAIL, password: USER_PASSWORD })
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  } catch {
    // Register if login fails (first run or user was cleaned up)
    await submitRegister(page, { name: 'E2E User', email: USER_EMAIL, password: USER_PASSWORD })
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  }

  await waitForAppReady(page)
  await expect(page.getByText(/today|upcoming|habits/i).first()).toBeVisible()

  await page.context().storageState({ path: authFile })
})
