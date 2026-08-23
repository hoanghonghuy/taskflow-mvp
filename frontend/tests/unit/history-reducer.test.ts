import { describe, expect, it } from 'vitest'
import { historyReducer } from '@/lib/store/task-manager/history-reducer'
import type { AppState, HistoryState } from '@/lib/store/task-manager/types'
import type { Task } from '@/types'

function emptyState(overrides: Partial<AppState> = {}): AppState {
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
      isActive: false,
      isPaused: false,
      remainingTime: 25 * 60,
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
    ...overrides,
  }
}

describe('historyReducer', () => {
  it('does not stack server-synced mutations onto undo past', () => {
    const task: Task = {
      id: 't1',
      title: 'A',
      completed: false,
      listId: 'inbox',
      priority: 'none',
      subtasks: [],
      tags: [],
      comments: [],
      createdAt: '2026-01-01T00:00:00.000Z',
    }

    const initial: HistoryState = {
      past: [],
      present: emptyState(),
      future: [],
    }

    const afterAdd = historyReducer(initial, { type: 'ADD_TASK', payload: task })
    expect(afterAdd.present.tasks).toHaveLength(1)
    expect(afterAdd.past).toHaveLength(0)

    const updated = { ...task, title: 'B' }
    const afterUpdate = historyReducer(afterAdd, { type: 'UPDATE_TASK', payload: updated })
    expect(afterUpdate.present.tasks[0]?.title).toBe('B')
    expect(afterUpdate.past).toHaveLength(0)
  })

  it.each(['TICK_TIMER', 'START_TIMER', 'PAUSE_TIMER'] as const)(
    'does not stack %s onto undo past',
    (actionType) => {
      const initial: HistoryState = {
        past: [],
        present: emptyState({
          pomodoro: {
            isActive: false,
            isPaused: false,
            remainingTime: 25 * 60,
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
        }),
        future: [],
      }

      let current = initial
      for (let i = 0; i < 5; i++) {
        current = historyReducer(current, { type: actionType })
      }

      expect(current.past).toHaveLength(0)
      expect(current.future).toHaveLength(0)
    },
  )
})
