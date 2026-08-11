/** E2E admin — must match backend seed (ADMIN_EMAIL / ADMIN_PASSWORD). */
export const E2E_ADMIN_EMAIL =
  process.env.E2E_ADMIN_EMAIL?.trim().toLowerCase() || 'admin@gmail.com'

export const E2E_ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || 'admin123'

export const E2E_BACKEND_PORT = process.env.E2E_BACKEND_PORT || '8099'

export const E2E_DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:taskflow@localhost:5434/taskflow_db?sslmode=disable'

export function isMockE2e(): boolean {
  return process.env.E2E_MOCK_MODE === 'true'
}
