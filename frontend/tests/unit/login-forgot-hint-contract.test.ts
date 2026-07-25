import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('login forgot-password MVP hint contract', () => {
  it('shows Email reset not available yet on login when reset is disabled', () => {
    const loginPage = readFileSync(
      join(process.cwd(), 'src/app/(auth)/login/page.tsx'),
      'utf8',
    )
    const en = JSON.parse(
      readFileSync(join(process.cwd(), 'src/messages/en.json'), 'utf8'),
    ) as { auth: { forgotPasswordMvpNote?: string } }

    expect(loginPage).toContain('PASSWORD_RESET_ENABLED')
    expect(loginPage).toContain('auth.forgotPasswordMvpNote')
    expect(en.auth.forgotPasswordMvpNote).toBe('Email reset not available yet')
  })
})
