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

    case 'REORDER_TASKS': {
      const { draggedId, droppedOnId } = action.payload
      const draggedIndex = state.tasks.findIndex((t) => t.id === draggedId)
      const droppedIndex = state.tasks.findIndex((t) => t.id === droppedOnId)
      if (draggedIndex === -1 || droppedIndex === -1) return state

      const reordered = [...state.tasks]
      const [draggedTask] = reordered.splice(draggedIndex, 1)
      reordered.splice(droppedIndex, 0, draggedTask)
      return { ...state, tasks: reordered }
    }

    case 'SET_TASKS':
      return { ...state, tasks: action.payload }

    default:
      return state
  }
}
