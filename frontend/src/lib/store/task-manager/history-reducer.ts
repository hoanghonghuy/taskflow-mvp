import type { HistoryState, Action } from './types'
import { taskManagerReducer } from './reducer'

/**
 * Mutations that are (or will be) persisted via API.
 * Stacking them onto undo would desync local state from the server.
 */
const SERVER_SYNCED_ACTIONS = new Set<Action['type']>([
  'ADD_TASK',
  'UPDATE_TASK',
  'DELETE_TASK',
  'TOGGLE_TASK_COMPLETION',
  'ASSIGN_TASK',
  'ADD_COMMENT',
  'REORDER_TASKS',
  'SET_TASKS',
  'ADD_LIST',
  'UPDATE_LIST',
  'DELETE_LIST',
  'UPDATE_LIST_MEMBERS',
  'SHARE_LIST',
  'UNSHARE_LIST',
  'ADD_COLUMN',
  'UPDATE_COLUMN',
  'DELETE_COLUMN',
  'MOVE_TASK_TO_COLUMN',
  'REORDER_COLUMNS',
  'ADD_HABIT',
  'UPDATE_HABIT',
  'DELETE_HABIT',
  'TOGGLE_HABIT_COMPLETION',
  'ADD_COUNTDOWN',
  'UPDATE_COUNTDOWN',
  'DELETE_COUNTDOWN',
  'ADD_TAG',
  'DELETE_TAG',
  'SET_UNLOCKED_ACHIEVEMENTS',
])

/**
 * Timer mutations are high-frequency and purely client-side; stacking them onto
 * undo would grow `past` unbounded (~1 entry/second while the timer runs).
 */
const TIMER_ACTIONS = new Set<Action['type']>([
  'START_TIMER',
  'PAUSE_TIMER',
  'RESET_TIMER',
  'TICK_TIMER',
])

export function historyReducer(historyState: HistoryState, action: Action): HistoryState {
  switch (action.type) {
    case 'UNDO': {
      if (historyState.past.length === 0) return historyState

      const previous = historyState.past[historyState.past.length - 1]
      const newPast = historyState.past.slice(0, historyState.past.length - 1)

      return {
        past: newPast,
        present: previous,
        future: [historyState.present, ...historyState.future]
      }
    }

    case 'REDO': {
      if (historyState.future.length === 0) return historyState

      const next = historyState.future[0]
      const newFuture = historyState.future.slice(1)

      return {
        past: [...historyState.past, historyState.present],
        present: next,
        future: newFuture
      }
    }

    case 'LOAD_STATE': {
      return {
        past: [],
        present: action.payload,
        future: []
      }
    }

    case 'CLEAR_HISTORY': {
      return {
        past: [],
        present: historyState.present,
        future: [],
      }
    }

    default: {
      const newPresent = taskManagerReducer(historyState.present, action)
      
      // If state didn't change, don't add to history
      if (newPresent === historyState.present) {
        return historyState
      }

      // Server-synced mutations update present without undo stack (avoids local≠server).
      if (SERVER_SYNCED_ACTIONS.has(action.type)) {
        return {
          past: [],
          present: newPresent,
          future: [],
        }
      }

      // Timer ticks update present in place; they must not pollute undo history.
      if (TIMER_ACTIONS.has(action.type)) {
        return historyState
          ? { ...historyState, present: newPresent }
          : { past: [], present: newPresent, future: [] }
      }

      return {
        past: [...historyState.past, historyState.present],
        present: newPresent,
        future: []
      }
    }
  }
}
