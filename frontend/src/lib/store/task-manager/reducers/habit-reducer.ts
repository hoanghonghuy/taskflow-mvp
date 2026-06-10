import type { AppState, Habit } from '@/types'
import type { Action } from '../types'
import { generateId } from '@/lib/utils'

export function habitReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_HABIT': {
      const payload = action.payload as Partial<Habit> & { name: string }
      const newHabit: Habit = {
        name: payload.name,
        id: payload.id ?? generateId(),
        completions: payload.completions ?? [],
        createdAt: payload.createdAt ?? new Date().toISOString(),
      }
      return { ...state, habits: [...state.habits, newHabit] }
    }

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => (h.id === action.payload.id ? action.payload : h)),
      }

    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter(h => h.id !== action.payload) }

    case 'TOGGLE_HABIT_COMPLETION': {
      const { habitId, date } = action.payload
      return {
        ...state,
        habits: state.habits.map(h => {
          if (h.id !== habitId) return h
          const completions = h.completions.includes(date)
            ? h.completions.filter(d => d !== date)
            : [...h.completions, date]
          return { ...h, completions }
        }),
      }
    }

    default:
      return state
  }
}
