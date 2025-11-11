/**
 * Action creators - Convenience functions for dispatching actions
 * These are reusable helpers that components can use
 */

import type { Task, List, Habit, Comment, PomodoroState } from '@/types'
import type { Action } from './types'
import { generateId } from '@/lib/utils'

// Task actions
export const taskActions = {
  add: (task: Omit<Task, 'id'>): Action => ({
    type: 'ADD_TASK',
    payload: { ...task, id: generateId() } as Task
  }),

  update: (task: Task): Action => ({
    type: 'UPDATE_TASK',
    payload: task
  }),

  delete: (taskId: string): Action => ({
    type: 'DELETE_TASK',
    payload: taskId
  }),

  toggle: (taskId: string): Action => ({
    type: 'TOGGLE_TASK_COMPLETION',
    payload: { taskId }
  }),

  assign: (taskId: string, userId: string | null): Action => ({
    type: 'ASSIGN_TASK',
    payload: { taskId, userId }
  }),

  addComment: (taskId: string, comment: Comment): Action => ({
    type: 'ADD_COMMENT',
    payload: { taskId, comment }
  }),

  moveToColumn: (taskId: string, newColumnId: string, listId: string): Action => ({
    type: 'MOVE_TASK_TO_COLUMN',
    payload: { taskId, newColumnId, listId }
  }),
}

// List actions
export const listActions = {
  add: (list: Omit<List, 'id'>): Action => ({
    type: 'ADD_LIST',
    payload: list
  }),

  update: (list: List): Action => ({
    type: 'UPDATE_LIST',
    payload: list
  }),

  delete: (listId: string): Action => ({
    type: 'DELETE_LIST',
    payload: listId
  }),

  share: (listId: string, userId: string): Action => ({
    type: 'SHARE_LIST',
    payload: { listId, userId }
  }),

  unshare: (listId: string, userId: string): Action => ({
    type: 'UNSHARE_LIST',
    payload: { listId, userId }
  }),
}

// Column actions
export const columnActions = {
  add: (listId: string, name: string): Action => ({
    type: 'ADD_COLUMN',
    payload: { listId, name }
  }),

  update: (columnId: string, name: string): Action => ({
    type: 'UPDATE_COLUMN',
    payload: { columnId, name }
  }),

  delete: (columnId: string, listId: string): Action => ({
    type: 'DELETE_COLUMN',
    payload: { columnId, listId }
  }),

  reorder: (listId: string, draggedId: string, droppedOnId: string): Action => ({
    type: 'REORDER_COLUMNS',
    payload: { listId, draggedId, droppedOnId }
  }),
}

// Habit actions
export const habitActions = {
  add: (habit: Omit<Habit, 'id' | 'completions' | 'createdAt'>): Action => ({
    type: 'ADD_HABIT',
    payload: habit
  }),

  update: (habit: Habit): Action => ({
    type: 'UPDATE_HABIT',
    payload: habit
  }),

  delete: (habitId: string): Action => ({
    type: 'DELETE_HABIT',
    payload: habitId
  }),

  toggleCompletion: (habitId: string, date: string): Action => ({
    type: 'TOGGLE_HABIT_COMPLETION',
    payload: { habitId, date }
  }),
}

// Pomodoro actions
export const pomodoroActions = {
  start: (): Action => ({ type: 'START_TIMER' }),
  
  pause: (): Action => ({ type: 'PAUSE_TIMER' }),
  
  reset: (): Action => ({ type: 'RESET_TIMER' }),
  
  setFocusedTask: (taskId: string | null): Action => ({
    type: 'SET_FOCUSED_TASK',
    payload: taskId
  }),
  
  updateSettings: (settings: Partial<PomodoroState['settings']>): Action => ({
    type: 'UPDATE_POMODORO_SETTINGS',
    payload: settings
  }),
}

// Countdown actions
export const countdownActions = {
  add: (event: Omit<import('@/types').CountdownEvent, 'id'>): Action => ({
    type: 'ADD_COUNTDOWN',
    payload: event
  }),

  update: (event: import('@/types').CountdownEvent): Action => ({
    type: 'UPDATE_COUNTDOWN',
    payload: event
  }),

  delete: (eventId: string): Action => ({
    type: 'DELETE_COUNTDOWN',
    payload: eventId
  }),
}

// View actions
export const viewActions = {
  setView: (view: import('@/types').View): Action => ({
    type: 'SET_VIEW',
    payload: view
  }),

  setSelectedTask: (taskId: string | null): Action => ({
    type: 'SET_SELECTED_TASK',
    payload: taskId
  }),
}

// History actions
export const historyActions = {
  undo: (): Action => ({ type: 'UNDO' }),
  redo: (): Action => ({ type: 'REDO' }),
}
