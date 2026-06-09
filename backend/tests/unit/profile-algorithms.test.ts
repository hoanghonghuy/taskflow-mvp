import {
  getLongestHabitCompletionStreak,
  getUnlockedAchievementIds,
} from '../../src/modules/profile/profile.service'

describe('profile algorithms', () => {
  it('getLongestHabitCompletionStreak returns 0 for empty', () => {
    expect(getLongestHabitCompletionStreak([])).toBe(0)
  })

  it('getLongestHabitCompletionStreak counts consecutive days across habits', () => {
    const habits = [
      { completions: '["2026-06-01","2026-06-02","2026-06-03"]' },
      { completions: '["2026-06-04","2026-06-05"]' },
    ]
    expect(getLongestHabitCompletionStreak(habits)).toBe(5)
  })

  it('getLongestHabitCompletionStreak ignores invalid dates', () => {
    const habits = [{ completions: '["invalid","2026-06-01"]' }]
    expect(getLongestHabitCompletionStreak(habits)).toBe(1)
  })

  it('getUnlockedAchievementIds applies all rules', () => {
    const ids = getUnlockedAchievementIds(
      50,
      50,
      [{ completions: '["2026-06-01","2026-06-02","2026-06-03","2026-06-04","2026-06-05","2026-06-06","2026-06-07"]' }],
      [{ durationSeconds: 3600 }],
    )
    expect(ids).toEqual(
      expect.arrayContaining([
        'first-task',
        'complete-10',
        'complete-50',
        'habit-7-day-streak',
        'focus-1h',
      ]),
    )
  })

  it('getUnlockedAchievementIds returns empty for new user', () => {
    expect(getUnlockedAchievementIds(0, 0, [], [])).toEqual([])
  })
})
