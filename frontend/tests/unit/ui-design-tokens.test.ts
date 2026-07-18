import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = join(__dirname, '../..')

/** Tailwind palette utilities that should use CSS design tokens instead. */
const HARDCODED_PALETTE =
  /\b(?:bg|text|border)-(?:blue|purple|green|orange|red|yellow|gray)-\d{2,3}(?:\/\d+)?(?:\s|['"`]|$)/

const AUDITED_FILES = [
  'src/app/(app)/dashboard/page.tsx',
  'src/features/matrix/views/MatrixView.tsx',
  'src/features/habits/views/HabitsView.tsx',
  'src/components/layout/bottom-nav-bar.tsx',
] as const

describe('UI design tokens (audit regression)', () => {
  it.each(AUDITED_FILES)(
    '%s does not hardcode Tailwind palette colors',
    (relativePath) => {
      const content = readFileSync(join(ROOT, relativePath), 'utf8')
      const match = content.match(HARDCODED_PALETTE)
      expect(match, `Found hardcoded palette class: ${match?.[0] ?? ''}`).toBeNull()
    },
  )

  it('bottom-nav and selection avoid hardcoded blue rgba glow', () => {
    const bottomNav = readFileSync(
      join(ROOT, 'src/components/layout/bottom-nav-bar.tsx'),
      'utf8',
    )
    const globals = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf8')
    expect(bottomNav).not.toMatch(/rgba\(\s*59\s*,\s*130\s*,\s*246/)
    expect(globals).not.toMatch(/rgba\(\s*59\s*,\s*130\s*,\s*246/)
    expect(globals).not.toMatch(/rgba\(\s*96\s*,\s*165\s*,\s*250/)
  })

  it('habits summary cards consume colorToken when rendering', () => {
    const habits = readFileSync(
      join(ROOT, 'src/features/habits/views/HabitsView.tsx'),
      'utf8',
    )
    expect(habits).toMatch(/colorToken:\s*'--color-habits-summary-/)
    expect(habits).toMatch(/card\.colorToken/)
  })
})
