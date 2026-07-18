import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { test as setup, expect } from '@playwright/test'
import { submitRegister } from './helpers/auth'
import { E2E_PASSWORD, uniqueE2eEmail } from './helpers/test-data'
import { waitForAppReady } from './helpers/app-ready'

const authDir = path.join(__dirname, '../playwright/.auth')
const authFile = path.join(authDir, 'user.json')
const e2eUserMetaFile = path.join(authDir, 'e2e-user.json')

setup('register and save authenticated session', async ({ page }) => {
  mkdirSync(authDir, { recursive: true })

  const email = uniqueE2eEmail('setup')
  const password = E2E_PASSWORD

  writeFileSync(e2eUserMetaFile, JSON.stringify({ email, name: 'E2E User' }), 'utf8')

  await submitRegister(page, { name: 'E2E User', email, password })

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  await waitForAppReady(page)
  await expect(page.getByText(/today|upcoming|habits/i).first()).toBeVisible()

  await page.context().storageState({ path: authFile })
})
