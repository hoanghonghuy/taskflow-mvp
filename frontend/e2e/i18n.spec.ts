import { test, expect } from '@playwright/test'

test.describe('Internationalization', () => {
  test('switches login page to Vietnamese', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Welcome back')).toBeVisible()

    await page.getByRole('button', { name: 'Tiếng Việt' }).click()
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible()
    await expect(page.getByLabel('Email', { exact: true })).toBeVisible()
  })

  test('switches register page to Vietnamese', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Create an account')).toBeVisible()

    await page.getByRole('button', { name: 'Tiếng Việt' }).click()
    await expect(page.getByText('Tạo tài khoản')).toBeVisible()
  })
})
