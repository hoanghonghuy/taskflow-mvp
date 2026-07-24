import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { test as setup, expect } from '@playwright/test'
import { submitLogin, submitRegister } from './helpers/auth'
import { cleanupStaleE2eUsers } from './helpers/cleanup'
import { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, isMockE2e } from './helpers/env'
import { E2E_PASSWORD, uniqueE2eAdminEmail } from './helpers/test-data'

const authDir = path.join(__dirname, '../playwright/.auth')
const adminAuthFile = path.join(authDir, 'admin.json')

setup('authenticate admin and save session', async ({ page }) => {
  mkdirSync(authDir, { recursive: true })

  if (isMockE2e()) {
    const email = uniqueE2eAdminEmail('setup')
    await submitRegister(page, { name: 'E2E Admin', email, password: E2E_PASSWORD })
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  } else {
    await submitLogin(page, {
      email: E2E_ADMIN_EMAIL,
      password: E2E_ADMIN_PASSWORD,
    })
    await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 })
    await cleanupStaleE2eUsers(page)
  }

  await page.context().storageState({ path: adminAuthFile })
})
