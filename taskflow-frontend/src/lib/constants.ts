// src/lib/constants.ts
import { Priority, PomodoroSettings, AppState } from '@/types'

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
}

export const DEFAULT_LISTS = [
  { id: 'inbox', name: 'Inbox', color: '#3b82f6', members: [] },
  { id: 'work', name: 'Work', color: '#8b5cf6', members: [] },
  { id: 'personal', name: 'Personal', color: '#10b981', members: [] },
]

export const DEFAULT_COLUMNS = [
  { id: 'todo', name: 'To Do', listId: 'inbox' },
  { id: 'in-progress', name: 'In Progress', listId: 'inbox' },
  { id: 'done', name: 'Done', listId: 'inbox' },
]

// ✅ FIX: Thay any bằng AppState
export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: 'first-task',
    title: 'First Step',
    description: 'Create your first task',
    icon: '🎯',
    condition: (state: AppState) => state.tasks.length >= 1,
  },
  {
    id: 'complete-10',
    title: 'Getting Started',
    description: 'Complete 10 tasks',
    icon: '🌟',
    condition: (state: AppState) => 
      state.tasks.filter(t => t.completed).length >= 10,
  },
  {
    id: 'complete-50',
    title: 'Productive',
    description: 'Complete 50 tasks',
    icon: '🔥',
    condition: (state: AppState) => 
      state.tasks.filter(t => t.completed).length >= 50,
  },
  {
    id: 'week-streak',
    title: 'Week Warrior',
    description: 'Complete tasks 7 days in a row',
    icon: '⚡',
    condition: (_state: AppState) => {  // ← Prefix unused param with _
      // TODO: Implement streak logic
      return false
    },
  },
]
