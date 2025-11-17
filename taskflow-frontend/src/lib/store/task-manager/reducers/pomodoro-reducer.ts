import type { AppState, PomodoroState } from '@/types'
import type { Action } from '../types'

function completePomodoroSession(state: AppState): AppState {
  const { currentSession, sessionsCompleted, settings, focusedTaskId } = state.pomodoro
  let nextSession: PomodoroState['currentSession']
  let newSessionsCompleted = sessionsCompleted

  if (currentSession === 'focus') {
    newSessionsCompleted++
    nextSession = newSessionsCompleted % settings.sessionsUntilLongBreak === 0
      ? 'longBreak'
      : 'shortBreak'

    if (focusedTaskId) {
      const focusHistory = [
        ...state.pomodoro.focusHistory,
        {
          startTime: new Date().toISOString(),
          duration: settings.focusDuration * 60,
          taskId: focusedTaskId,
        },
      ]

      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          currentSession: nextSession,
          sessionsCompleted: newSessionsCompleted,
          remainingTime:
            (nextSession === 'longBreak'
              ? settings.longBreakDuration
              : settings.shortBreakDuration) * 60,
          isActive: false,
          focusHistory,
        },
      }
    }
  } else {
    nextSession = 'focus'
  }

  return {
    ...state,
    pomodoro: {
      ...state.pomodoro,
      currentSession: nextSession,
      sessionsCompleted: newSessionsCompleted,
      remainingTime:
        (nextSession === 'focus'
          ? settings.focusDuration
          : settings.shortBreakDuration) * 60,
      isActive: false,
    },
  }
}

export function pomodoroReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        pomodoro: { ...state.pomodoro, isActive: true, isPaused: false },
      }

    case 'PAUSE_TIMER':
      return {
        ...state,
        pomodoro: { ...state.pomodoro, isPaused: true },
      }

    case 'RESET_TIMER': {
      const { currentSession, settings } = state.pomodoro
      const duration =
        currentSession === 'focus'
          ? settings.focusDuration
          : currentSession === 'shortBreak'
          ? settings.shortBreakDuration
          : settings.longBreakDuration

      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          isActive: false,
          isPaused: false,
          remainingTime: duration * 60,
        },
      }
    }

    case 'TICK_TIMER': {
      if (!state.pomodoro.isActive || state.pomodoro.isPaused) return state
      const newRemainingTime = Math.max(0, state.pomodoro.remainingTime - 1)
      if (newRemainingTime === 0) {
        return completePomodoroSession(state)
      }
      return {
        ...state,
        pomodoro: { ...state.pomodoro, remainingTime: newRemainingTime },
      }
    }

    case 'SET_FOCUSED_TASK':
      return {
        ...state,
        pomodoro: { ...state.pomodoro, focusedTaskId: action.payload },
      }

    case 'COMPLETE_POMODORO_SESSION':
      return completePomodoroSession(state)

    case 'UPDATE_POMODORO_SETTINGS':
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          settings: { ...state.pomodoro.settings, ...action.payload },
        },
      }

    default:
      return state
  }
}
