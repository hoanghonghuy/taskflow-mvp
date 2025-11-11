import type { HistoryState, Action } from './types'
import { taskManagerReducer } from './reducer'

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

    default: {
      const newPresent = taskManagerReducer(historyState.present, action)
      
      // If state didn't change, don't add to history
      if (newPresent === historyState.present) {
        return historyState
      }

      return {
        past: [...historyState.past, historyState.present],
        present: newPresent,
        future: []
      }
    }
  }
}
