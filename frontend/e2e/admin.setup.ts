import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { test as setup, expect } from '@playwright/test'
import { submitRegister } from './helpers/auth'
import { E2E_PASSWORD, uniqueE2eAdminEmail } from './helpers/test-data'

const authDir = path.join(__dirname, '../playwright/.auth')
const adminAuthFile = path.join(authDir, 'admin.json')

setup('register admin and save session', async ({ page }) => {
  mkdirSync(authDir, { recursive: true })

  const email = uniqueE2eAdminEmail('setup')
  const password = E2E_PASSWORD

  await submitRegister(page, { name: 'E2E Admin', email, password })

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })

  await page.context().storageState({ path: adminAuthFile })
})
