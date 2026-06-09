import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { test as setup, expect } from '@playwright/test'
import { submitRegister } from './helpers/auth'
import { E2E_PASSWORD, uniqueE2eEmail } from './helpers/test-data'

const authDir = path.join(__dirname, '../playwright/.auth')
const authFile = path.join(authDir, 'user.json')

setup('register and save authenticated session', async ({ page }) => {
  mkdirSync(authDir, { recursive: true })

  const email = uniqueE2eEmail('setup')
  const password = E2E_PASSWORD

  await submitRegister(page, { name: 'E2E User', email, password })

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  await expect(page.getByText("Here's your productivity dashboard for today.")).toBeVisible()

  await page.context().storageState({ path: authFile })
})
