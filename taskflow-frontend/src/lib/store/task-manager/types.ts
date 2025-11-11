import type { 
  AppState, 
  Task, 
  List, 
  Habit, 
  CountdownEvent, 
  PomodoroState,
  View,
  Comment,
} from '@/types'

export type Action =
  | { type: 'SET_VIEW'; payload: View }
  | { type: 'SET_SELECTED_TASK'; payload: string | null }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string } }
  | { type: 'ADD_LIST'; payload: Omit<List, 'id'> }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'ADD_COLUMN'; payload: { listId: string; name: string } }
  | { type: 'UPDATE_COLUMN'; payload: { columnId: string; name: string } }
  | { type: 'DELETE_COLUMN'; payload: { columnId: string; listId: string } }
  | { type: 'MOVE_TASK_TO_COLUMN'; payload: { taskId: string; newColumnId: string; listId: string } }
  | { type: 'REORDER_COLUMNS'; payload: { listId: string; draggedId: string; droppedOnId: string } }
  | { type: 'ADD_HABIT'; payload: Omit<Habit, 'id' | 'completions' | 'createdAt'> }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'TOGGLE_HABIT_COMPLETION'; payload: { habitId: string; date: string } }
  | { type: 'ADD_COUNTDOWN'; payload: Omit<CountdownEvent, 'id'> }
  | { type: 'UPDATE_COUNTDOWN'; payload: CountdownEvent }
  | { type: 'DELETE_COUNTDOWN'; payload: string }
  | { type: 'START_TIMER' }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'TICK_TIMER' }
  | { type: 'SET_FOCUSED_TASK'; payload: string | null }
  | { type: 'COMPLETE_POMODORO_SESSION' }
  | { type: 'UPDATE_POMODORO_SETTINGS'; payload: Partial<PomodoroState['settings']> }
  | { type: 'ASSIGN_TASK'; payload: { taskId: string; userId: string | null } }
  | { type: 'ADD_COMMENT'; payload: { taskId: string; comment: Comment } }
  | { type: 'SHARE_LIST'; payload: { listId: string; userId: string } }
  | { type: 'UNSHARE_LIST'; payload: { listId: string; userId: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'LOAD_STATE'; payload: AppState }

export interface HistoryState {
  past: AppState[]
  present: AppState
  future: AppState[]
}

export interface TaskManagerContextType {
  state: AppState
  dispatch: (action: Action) => void
  canUndo: boolean
  canRedo: boolean
}
