import type { AppState } from '@/types'
import { DEFAULT_LISTS, DEFAULT_COLUMNS, DEFAULT_POMODORO_SETTINGS } from '@/lib/constants'

export const INITIAL_STATE: AppState = {
  view: 'dashboard',
  tasks: [],
  lists: DEFAULT_LISTS,
  columns: DEFAULT_COLUMNS,
  habits: [],
  countdownEvents: [],
  selectedTaskId: null,
  pomodoro: {
    isActive: false,
    isPaused: false,
    remainingTime: DEFAULT_POMODORO_SETTINGS.focusDuration * 60,
    currentSession: 'focus',
    focusedTaskId: null,
    sessionsCompleted: 0,
    focusHistory: [],
    settings: DEFAULT_POMODORO_SETTINGS,
  },
  unlockedAchievements: [],
}
