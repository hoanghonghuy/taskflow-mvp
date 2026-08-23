import { describe, expect, it } from 'vitest'
import { isOnlyRemainingTimeChange } from '@/components/providers/task-manager-provider'
import type { AppState } from '@/types'

function baseState(): AppState {
  return {
    view: 'list',
    tasks: [],
    lists: [],
    columns: [],
    habits: [],
    countdownEvents: [],
    selectedTaskId: null,
    activeListId: 'inbox',
    activeTag: null,
    tags: [],
    unlockedAchievements: [],
    sortOrder: 'manual',
    pomodoro: {
      isActive: true,
      isPaused: false,
      remainingTime: 1500,
      currentSession: 'focus',
      sessionsCompleted: 0,
      focusHistory: [],
      settings: {
        focusDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4,
      },
      focusedTaskId: null,
      focusedHabitId: null,
    },
  }
}

describe('isOnlyRemainingTimeChange', () => {
  it('returns true when only remainingTime differs (timer tick)', () => {
    const prev = baseState()
    const next: AppState = {
      ...prev,
      pomodoro: { ...prev.pomodoro, remainingTime: 1499 },
    }
    expect(isOnlyRemainingTimeChange(prev, next)).toBe(true)
  })

  it('returns false when a structural field changes (e.g. isActive)', () => {
    const prev = baseState()
    const next: AppState = {
      ...prev,
      pomodoro: { ...prev.pomodoro, isActive: false },
    }
    expect(isOnlyRemainingTimeChange(prev, next)).toBe(false)
  })

  it('returns false when tasks array reference changes', () => {
    const prev = baseState()
    const next: AppState = { ...prev, tasks: [] }
    expect(isOnlyRemainingTimeChange(prev, next)).toBe(false)
  })

  it('returns false when remainingTime is unchanged', () => {
    const prev = baseState()
    const next: AppState = { ...prev, pomodoro: { ...prev.pomodoro } }
    expect(isOnlyRemainingTimeChange(prev, next)).toBe(false)
  })
})
