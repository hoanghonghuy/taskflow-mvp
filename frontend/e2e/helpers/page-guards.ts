import type { Page, Request } from '@playwright/test'
import { expect } from '@playwright/test'

const installed = new WeakMap<Page, string[]>()

function isApiRequest(request: Request): boolean {
  try {
    return new URL(request.url()).pathname.startsWith('/api/')
  } catch {
    return false
  }
}

/**
 * Collect page crashes and failed authenticated API calls.
 * Install once per page; assert via assertNoPageGuardFailures.
 */
export function installPageGuards(page: Page): void {
  if (installed.has(page)) return

  const errors: string[] = []
  installed.set(page, errors)

  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`)
  })

  page.on('requestfailed', (request) => {
    if (!isApiRequest(request)) return
    const failure = request.failure()
    // Aborted/navigated-away requests are expected during SPA transitions.
    if (failure?.errorText === 'net::ERR_ABORTED' || failure?.errorText === 'NS_BINDING_ABORTED') {
      return
    }
    errors.push(
      `requestfailed: ${request.method()} ${request.url()} (${failure?.errorText ?? 'unknown'})`,
    )
  })
}

export async function assertNoPageGuardFailures(page: Page): Promise<void> {
  const errors = installed.get(page) ?? []
  expect(errors, errors.join('\n')).toEqual([])
}
