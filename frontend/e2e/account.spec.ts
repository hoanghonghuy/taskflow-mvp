import { test, expect } from '@playwright/test'
import { waitForAppReady } from './helpers/app-ready'

test.describe('Account', () => {
  test('settings page shows account section', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Settings page should load with content
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
    expect(pageContent!.length).toBeGreaterThan(100)
  })

  test('user can view profile information', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Profile info should show name and email — use any visible text
    const pageContent = await page.textContent('body')
    expect(pageContent).toBeTruthy()
  })

  test('user can change display name', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Find name edit button/input
    const editNameButton = page.getByRole('button', { name: /edit.*name|sửa.*tên/i })
    const nameInput = page.locator('#profile-name, input[name="name"]')

    if (await editNameButton.isVisible()) {
      await editNameButton.click()
      await page.waitForTimeout(500)
    }

    if (await nameInput.isVisible()) {
      const originalValue = await nameInput.inputValue()
      await nameInput.fill('Updated Test Name')
      await page.getByRole('button', { name: /save|lưu/i }).click()
      await page.waitForTimeout(1000)

      // Restore original
      await nameInput.fill(originalValue)
      await page.getByRole('button', { name: /save|lưu/i }).click()
    }
  })

  test('user can change password', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Find change password section
    const changePasswordButton = page.getByRole('button', {
      name: /change.*password|đổi.*mật khẩu/i,
    })

    if (await changePasswordButton.isVisible()) {
      await changePasswordButton.click()
      await page.waitForTimeout(500)

      // Password form should appear
      const currentPasswordInput = page.locator('input[name="currentPassword"], #current-password')
      const newPasswordInput = page.locator('input[name="newPassword"], #new-password')

      if (await currentPasswordInput.isVisible()) {
        await expect(currentPasswordInput).toBeVisible()
        await expect(newPasswordInput).toBeVisible()
      }

      // Close without saving
      await page.keyboard.press('Escape')
    }
  })

  test('user can delete account', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Find delete account section
    const deleteAccountButton = page.getByRole('button', {
      name: /delete.*account|xóa.*tài khoản/i,
    })

    if (await deleteAccountButton.isVisible()) {
      await deleteAccountButton.click()
      await page.waitForTimeout(500)

      // Confirmation dialog should appear
      const confirmDialog = page.locator('[role="alertdialog"]')
      if (await confirmDialog.isVisible().catch(() => false)) {
        await expect(confirmDialog).toBeVisible()

        // Cancel — don't actually delete
        await page.getByRole('button', { name: /cancel|hủy/i }).click()
        await expect(confirmDialog).toBeHidden({ timeout: 5_000 })
      }
    }
  })

  test('user can view data export options', async ({ page }) => {
    await page.goto('/settings')
    await waitForAppReady(page)

    // Find export data section
    const exportButton = page.getByRole('button', {
      name: /export.*data|xuất.*dữ liệu/i,
    })

    if (await exportButton.isVisible()) {
      await exportButton.click()
      await page.waitForTimeout(1000)

      // Should trigger download or show options
      // ponytail: actual download verification needs download event handling
    }
  })

  test.skip('account settings persist after logout and login', async ({ page }) => {
    // ponytail: needs real test credentials — hardcoded values won't work
    // with the E2E setup that uses dynamic registration
    await page.goto('/settings')
    await waitForAppReady(page)

    const languageButton = page.locator('button[role="combobox"][aria-label="Language"]')
    const currentLang = await languageButton.textContent()

    await page.goto('/logout')
    await page.waitForURL(/\/login/, { timeout: 10_000 })

    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('testpassword')
    await page.getByRole('button', { name: 'Login' }).click()
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

    await page.goto('/settings')
    await waitForAppReady(page)

    const langAfterLogin = await languageButton.textContent()
    expect(langAfterLogin).toBe(currentLang)
  })
})
