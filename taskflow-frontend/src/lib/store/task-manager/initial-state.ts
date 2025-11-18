import type { AppState } from '@/types'
import { DEFAULT_LISTS, DEFAULT_COLUMNS, DEFAULT_POMODORO_SETTINGS } from '@/lib/task-constants'

export const INITIAL_STATE: AppState = {
  view: 'dashboard',
  tasks: [],
  lists: DEFAULT_LISTS,
  columns: DEFAULT_COLUMNS,
  habits: [],
  countdownEvents: [],
  selectedTaskId: null,
  activeListId: 'inbox',
  activeTag: null,
  tags: [],
  sortOrder: 'default',
  pomodoro: {
    isActive: false,
    isPaused: false,
    remainingTime: DEFAULT_POMODORO_SETTINGS.focusDuration * 60,
    currentSession: 'focus',
    focusedTaskId: null,
    focusedHabitId: null,
    sessionsCompleted: 0,
    focusHistory: [],
    settings: DEFAULT_POMODORO_SETTINGS,
  },
  unlockedAchievements: [],
}
