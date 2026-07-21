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
  'src/features/pomodoro/views/PomodoroView.tsx',
  'src/features/profile/views/ProfileView.tsx',
  'src/features/tasks/components/TaskList.tsx',
  'src/components/chatbot/Chatbot.tsx',
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
    expect(habits).toContain("colorToken: '--color-habits-summary-")
    expect(habits).toContain('card.colorToken')
  })

  it('PRIORITY_MAP and PRIORITY_COLORS use design tokens', () => {
    const constants = readFileSync(join(ROOT, 'src/lib/constants.tsx'), 'utf8')
    const priorityColorsBlock = constants.slice(
      constants.indexOf('export const PRIORITY_COLORS'),
      constants.indexOf('export const PRIORITY_MAP'),
    )
    const priorityMapBlock = constants.slice(
      constants.indexOf('export const PRIORITY_MAP'),
      constants.indexOf('export const SPECIAL_LISTS_CONFIG'),
    )
    expect(priorityColorsBlock.match(HARDCODED_PALETTE)).toBeNull()
    expect(priorityMapBlock.match(HARDCODED_PALETTE)).toBeNull()
    expect(priorityMapBlock).toContain('--color-priority-low')
    expect(priorityMapBlock).toContain('--color-priority-medium')
    expect(priorityMapBlock).toContain('--color-priority-high')
    expect(priorityMapBlock).toContain('--color-priority-urgent')
  })

  it('globals defines pomodoro session color tokens', () => {
    const globals = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf8')
    expect(globals).toContain('--color-pomodoro-focus')
    expect(globals).toContain('--color-pomodoro-short-break')
    expect(globals).toContain('--color-pomodoro-long-break')
  })

  it('page headers use responsive text-2xl md:text-3xl', () => {
    const sharedHeader = readFileSync(
      join(ROOT, 'src/components/layout/app-page-header.tsx'),
      'utf8',
    )
    expect(sharedHeader).toContain("'text-2xl md:text-3xl'")

    const sharedHeaderViews = [
      'src/features/pomodoro/views/PomodoroView.tsx',
      'src/features/countdown/views/CountdownView.tsx',
      'src/features/profile/views/ProfileView.tsx',
      'src/features/board/views/BoardView.tsx',
    ] as const

    for (const relativePath of sharedHeaderViews) {
      const content = readFileSync(join(ROOT, relativePath), 'utf8')
      if (content.includes('<AppPageHeader')) continue

      const h1Matches = [...content.matchAll(/<h1 className="([^"]+)"/g)]
      expect(h1Matches.length, `${relativePath} should have h1`).toBeGreaterThan(0)
      for (const match of h1Matches) {
        expect(match[1]).toMatch(/text-2xl\s+md:text-3xl/)
      }
    }

    const achievements = readFileSync(
      join(ROOT, 'src/features/achievements/views/AchievementsView.tsx'),
      'utf8',
    )
    expect(achievements.match(/<h1 className="([^"]+)"/)?.[1]).toMatch(
      /text-2xl\s+md:text-3xl/,
    )
  })
})
