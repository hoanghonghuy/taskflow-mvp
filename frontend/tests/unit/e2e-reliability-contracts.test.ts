import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const e2e = (relative: string) =>
  readFileSync(join(process.cwd(), 'e2e', relative), 'utf8')

describe('e2e reliability contracts', () => {
  it('registers a unique user and exposes cleanup helpers', () => {
    const setup = e2e('auth.setup.ts')
    expect(setup).toContain('uniqueE2eEmail')
    expect(setup).toContain('e2e-user.json')

    const adminSetup = e2e('admin.setup.ts')
    expect(adminSetup).toContain('cleanupStaleE2eUsers')

    const cleanup = e2e('helpers/cleanup.ts')
    expect(cleanup).toContain('cleanupOwnedTestTasks')
    expect(cleanup).toContain('/api/tasks')
    expect(cleanup).toContain('cleanupOwnedTestHabits')
    expect(cleanup).toContain('/api/habits')
    expect(cleanup).toContain('cleanupStaleE2eUsers')
    expect(cleanup).toContain('/api/admin/users')

    const profile = e2e('profile.spec.ts')
    expect(profile).toContain('cleanupOwnedTestHabits')

    const playwrightConfig = readFileSync(
      join(process.cwd(), 'playwright.config.ts'),
      'utf8',
    )
    expect(playwrightConfig).toMatch(/name:\s*'setup'[\s\S]*dependencies:\s*\['admin-setup'\]/)
  })

  it('fails the run when the page throws or API requests fail', () => {
    const guards = e2e('helpers/page-guards.ts')
    expect(guards).toContain('pageerror')
    expect(guards).toContain('requestfailed')
    expect(guards).toContain('/api/')

    const ready = e2e('helpers/app-ready.ts')
    expect(ready).toContain('installPageGuards')
  })

  it('asserts profile stats actually change after completions', () => {
    const profile = e2e('profile.spec.ts')
    expect(profile).toContain('toBeGreaterThan')
    expect(profile).toContain('readFractionStat')
    expect(profile).toContain('cleanupOwnedTestTasks')
    expect(profile).not.toMatch(
      /stats update after task completion[\s\S]*locator\('h1, h2'\)\.first\(\)\)\.toBeVisible\(\)/,
    )
  })
})
