import {
  getLongestHabitCompletionStreak,
  getTaskCompletionStreak,
  getUnlockedAchievementIds,
} from '../../src/services/profileService'

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

  it('getTaskCompletionStreak counts consecutive completion days', () => {
    const tasks = [
      { completed: true, completedAt: new Date('2026-06-01T10:00:00Z') },
      { completed: true, completedAt: new Date('2026-06-02T10:00:00Z') },
      { completed: true, completedAt: new Date('2026-06-04T10:00:00Z') },
    ]
    expect(getTaskCompletionStreak(tasks)).toBe(2)
  })

  it('getTaskCompletionStreak counts recurring completions via recurrence.completedDates', () => {
    const tasks = [
      {
        completed: false,
        completedAt: null,
        recurrence: JSON.stringify({
          type: 'daily',
          interval: 1,
          completedDates: ['2026-06-01', '2026-06-02', '2026-06-03'],
        }),
      },
    ]
    expect(getTaskCompletionStreak(tasks)).toBe(3)
  })

  it('getUnlockedAchievementIds applies all rules', () => {
    const taskStreak = Array.from({ length: 7 }, (_, i) => ({
      completed: true,
      completedAt: new Date(`2026-06-${String(i + 1).padStart(2, '0')}T10:00:00Z`),
    }))

    const ids = getUnlockedAchievementIds(
      50,
      50,
      [{ completions: '["2026-06-01","2026-06-02","2026-06-03","2026-06-04","2026-06-05","2026-06-06","2026-06-07"]' }],
      [{ durationSeconds: 3600 }],
      taskStreak,
    )
    expect(ids).toEqual(
      expect.arrayContaining([
        'first-task',
        'complete-10',
        'complete-50',
        'habit-7-day-streak',
        'focus-1h',
        'week-streak',
      ]),
    )
  })

  it('getUnlockedAchievementIds returns empty for new user', () => {
    expect(getUnlockedAchievementIds(0, 0, [], [], [])).toEqual([])
  })
})
