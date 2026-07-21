import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(process.cwd(), 'src')

describe('provider account isolation contracts', () => {
  it('remounts task state when the authenticated user changes', () => {
    const providers = readFileSync(
      join(ROOT, 'components/providers/providers.tsx'),
      'utf8',
    )

    expect(providers).toContain(
      '<TaskManagerProvider key={user?.id ?? \'anonymous\'}>',
    )
  })

  it('retries the complete hydration pipeline after startup failure', () => {
    const provider = readFileSync(
      join(ROOT, 'components/providers/task-manager-provider.tsx'),
      'utf8',
    )
    const layout = readFileSync(join(ROOT, 'app/(app)/layout.tsx'), 'utf8')

    expect(provider).toContain('retryHydration')
    expect(provider).toContain('[dispatch, hydrationAttempt, isAuthenticated]')
    expect(layout).toContain('onClick={retryHydration}')
    expect(layout).not.toContain('onClick={() => void syncFromBackend()}')
  })

  it('runs the production Next build in CI', () => {
    const workflow = readFileSync(
      join(process.cwd(), '..', '.github/workflows/ci.yml'),
      'utf8',
    )

    expect(workflow).toContain('run: npm run build')
  })
})
