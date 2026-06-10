import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

const useMock = process.env.E2E_MOCK_MODE === 'true'
const frontendPort = process.env.PLAYWRIGHT_PORT ?? '3099'
const backendPort = process.env.E2E_BACKEND_PORT ?? '8099'
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${frontendPort}`
const backendUrl =
  (process.env.BACKEND_URL ?? `http://127.0.0.1:${backendPort}`).replace(/\/$/, '')

const databaseUrl =
  process.env.DATABASE_URL ||
  'postgresql://postgres:taskflow@localhost:5434/taskflow_db?sslmode=disable'

const e2eAdminEmail = process.env.E2E_ADMIN_EMAIL?.trim().toLowerCase() || 'e2e-admin@taskflow.test'
const e2eAdminPassword = process.env.E2E_ADMIN_PASSWORD || 'E2eAdminPass123!'

const userAuthFile = 'playwright/.auth/user.json'
const adminAuthFile = 'playwright/.auth/admin.json'
const backendDir = path.join(__dirname, '..', 'backend')

const frontendServer = {
  command: `npm run dev -- --port ${frontendPort} --hostname 127.0.0.1`,
  url: baseURL,
  name: useMock ? 'Frontend (mock)' : 'Frontend',
  timeout: 180_000,
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe' as const,
  stderr: 'pipe' as const,
  env: {
    MOCK_MODE: useMock ? 'true' : 'false',
    BACKEND_URL: backendUrl,
    NEXT_DIST_DIR: '.next-e2e',
  },
}

const backendServer = {
  command: 'npx prisma migrate deploy && npm run dev',
  cwd: backendDir,
  url: `${backendUrl}/health`,
  name: 'Backend',
  timeout: 180_000,
  reuseExistingServer: !process.env.CI,
  stdout: 'pipe' as const,
  stderr: 'pipe' as const,
  env: {
    PORT: backendPort,
    DATABASE_URL: databaseUrl,
    JWT_KEY: process.env.JWT_KEY || 'e2e-jwt-key-must-be-at-least-32-chars-long',
    JWT_ISSUER: 'Taskflow',
    JWT_AUDIENCE: 'TaskflowClient',
    ADMIN_EMAIL: e2eAdminEmail,
    ADMIN_PASSWORD: e2eAdminPassword,
    ADMIN_NAME: 'E2E Admin',
    NODE_ENV: 'development',
    CORS_ORIGIN: baseURL,
  },
}

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
  expect: { timeout: 15_000 },

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Default: real Postgres + Express API (MOCK_MODE=false).
  // Quick local run without DB: E2E_MOCK_MODE=true npm run test:e2e
  webServer: useMock ? frontendServer : [backendServer, frontendServer],

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
