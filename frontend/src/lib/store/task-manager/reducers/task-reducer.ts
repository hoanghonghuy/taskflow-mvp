import type { AppState, Task } from '@/types'
import type { Action } from '../types'
import { generateId } from '@/lib/utils'

export function taskReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_TASK': {
      const newTask: Task = { ...action.payload, id: action.payload.id || generateId() }
      return { ...state, tasks: [...state.tasks, newTask] }
    }

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => (t.id === action.payload.id ? action.payload : t)),
      }

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
        selectedTaskId: state.selectedTaskId === action.payload ? null : state.selectedTaskId,
      }

    case 'TOGGLE_TASK_COMPLETION': {
      const { taskId } = action.payload
      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.id === taskId) {
            const isCompleting = !t.completed
            return {
              ...t,
              completed: isCompleting,
              completedAt: isCompleting ? new Date().toISOString() : undefined,
            }
          }
          return t
        }),
      }
    }

    case 'ASSIGN_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId ? { ...t, assigneeId: action.payload.userId } : t,
        ),
      }

    case 'ADD_COMMENT':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, comments: [...(t.comments || []), action.payload.comment] }
            : t,
        ),
      }

    default:
      return state
  }
}
