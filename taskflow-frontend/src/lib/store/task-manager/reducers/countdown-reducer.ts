import type { AppState, CountdownEvent } from '@/types'
import type { Action } from '../types'

export function countdownReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_COUNTDOWN': {
      const newEvent: CountdownEvent = action.payload as CountdownEvent
      return { ...state, countdownEvents: [...state.countdownEvents, newEvent] }
    }

    case 'UPDATE_COUNTDOWN':
      return {
        ...state,
        countdownEvents: state.countdownEvents.map(e =>
          e.id === action.payload.id ? action.payload : e,
        ),
      }

    case 'DELETE_COUNTDOWN':
      return {
        ...state,
        countdownEvents: state.countdownEvents.filter(e => e.id !== action.payload),
      }

    default:
      return state
  }
}
