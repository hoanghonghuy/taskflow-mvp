/** Password for all e2e users — avoid dev autofilled values cleared by login/register pages. */
export const E2E_PASSWORD = 'E2eTestPass123!'

export function uniqueE2eEmail(prefix = 'user'): string {
  return `e2e-${prefix}-${Date.now()}@taskflow.test`
}

export function uniqueE2eAdminEmail(prefix = 'admin'): string {
  return `e2e-${prefix}-${Date.now()}@taskflow.admin`
}
