/**
 * Task Manager Store - Public API
 * 
 * This is the ONLY file that should be imported from outside
 * Example: import { taskActions, useTaskManager } from '@/lib/store/task-manager'
 */

// Types
export type { Action, HistoryState, TaskManagerContextType } from './types'

// Initial state
export { INITIAL_STATE } from './initial-state'

// Reducers
export { taskManagerReducer } from './reducer'
export { historyReducer } from './history-reducer'

// Action creators
export {
  taskActions,
  listActions,
  columnActions,
  habitActions,
  pomodoroActions,
  countdownActions,
  viewActions,
  historyActions,
} from './actions'

// Re-export provider hooks (will be defined in provider file)
export { useTaskManager, useTaskActions, useListActions, useHabitActions, usePomodoroActions } from '@/components/providers/task-manager-provider'
