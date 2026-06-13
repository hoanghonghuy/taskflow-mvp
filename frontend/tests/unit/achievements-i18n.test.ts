import { describe, expect, it } from 'vitest'
import {
  achievementDescriptionKey,
  achievementItemKey,
  achievementTitleKey,
} from '@/lib/achievements-i18n'

describe('achievementItemKey', () => {
  it('maps kebab-case ids to camelCase i18n segments', () => {
    expect(achievementItemKey('first-task')).toBe('firstTask')
    expect(achievementItemKey('complete-10')).toBe('complete10')
    expect(achievementItemKey('habit-7-day-streak')).toBe('habit7DayStreak')
  })

  it('builds translation keys for achievement copy', () => {
    expect(achievementTitleKey('week-streak')).toBe('achievements.items.weekStreak.title')
    expect(achievementDescriptionKey('focus-1h')).toBe('achievements.items.focus1h.description')
  })
})
