import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PLAYWRIGHT_PORT ?? '3099'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`
const useRealBackend = process.env.E2E_REAL_BACKEND === 'true'
const backendUrl = (process.env.BACKEND_URL ?? 'http://localhost:8081').replace(/\/$/, '')

const userAuthFile = 'playwright/.auth/user.json'
const adminAuthFile = 'playwright/.auth/admin.json'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Mock mode (default): self-contained — no Docker/backend required.
  // Real backend: set E2E_REAL_BACKEND=true and run `docker compose up -d` first.
  webServer: {
    command: `npm run dev -- --port ${PORT} --hostname 127.0.0.1`,
    url: baseURL,
    name: useRealBackend ? 'Frontend (real backend)' : 'Frontend (mock mode)',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      MOCK_MODE: useRealBackend ? 'false' : 'true',
      BACKEND_URL: backendUrl,
      NEXT_DIST_DIR: '.next-e2e',
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'admin-setup',
      testMatch: /admin\.setup\.ts/,
    },
    {
      name: 'auth-flow',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'i18n',
      testMatch: /i18n\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: userAuthFile,
      },
      dependencies: ['setup'],
      testMatch: /(?:tasks|navigation)\.spec\.ts/,
    },
    {
      name: 'admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: adminAuthFile,
      },
      dependencies: ['admin-setup', 'setup'],
      testMatch: /admin\.spec\.ts/,
    },
  ],
})
