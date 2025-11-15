import type { AppState, List, Column, Habit, CountdownEvent, PomodoroState } from '@/types'
import type { Action } from './types'
import { generateId } from '@/lib/utils'

export function taskManagerReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.payload }

    case 'SET_SELECTED_TASK':
      return { ...state, selectedTaskId: action.payload }

    case 'SET_ACTIVE_LIST':
      return { ...state, activeListId: action.payload, activeTag: null, selectedTaskId: null, view: 'list' }

    case 'SET_ACTIVE_TAG':
      return { ...state, activeTag: action.payload, activeListId: 'inbox', selectedTaskId: null, view: 'list' }

    case 'ADD_TAG': {
      const newTagName = action.payload.name.trim().toLowerCase()
      if (newTagName && !state.tags.includes(newTagName)) {
        return { ...state, tags: [...state.tags, newTagName] }
      }
      return state
    }

    case 'DELETE_TAG': {
      const tagToDelete = action.payload
      return {
        ...state,
        tags: state.tags.filter(tag => tag !== tagToDelete),
        tasks: state.tasks.map(task => ({
          ...task,
          tags: task.tags.filter(tag => tag !== tagToDelete)
        })),
        activeTag: state.activeTag === tagToDelete ? null : state.activeTag,
      }
    }

    case 'ADD_TASK': {
      const newTask = { ...action.payload, id: action.payload.id || generateId() }
      return { ...state, tasks: [...state.tasks, newTask] }
    }

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      }

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
        selectedTaskId: state.selectedTaskId === action.payload ? null : state.selectedTaskId
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
              completedAt: isCompleting ? new Date().toISOString() : undefined
            }
          }
          return t
        })
      }
    }

    case 'ADD_LIST': {
      const newList: List = { ...action.payload, id: generateId() }
      return { ...state, lists: [...state.lists, newList] }
    }

    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map(l => l.id === action.payload.id ? action.payload : l)
      }

    case 'DELETE_LIST':
      return {
        ...state,
        lists: state.lists.filter(l => l.id !== action.payload),
        tasks: state.tasks.filter(t => t.listId !== action.payload),
        columns: state.columns.filter(c => c.listId !== action.payload)
      }

    case 'ADD_COLUMN': {
      const newColumn: Column = {
        id: generateId(),
        name: action.payload.name,
        listId: action.payload.listId,
      }
      return { ...state, columns: [...state.columns, newColumn] }
    }

    case 'UPDATE_COLUMN':
      return {
        ...state,
        columns: state.columns.map(c =>
          c.id === action.payload.columnId ? { ...c, name: action.payload.name } : c
        )
      }

    case 'DELETE_COLUMN': {
      const { columnId, listId } = action.payload
      const columnsForList = state.columns.filter(c => c.listId === listId)
      const firstColumnId = columnsForList[0]?.id

      return {
        ...state,
        columns: state.columns.filter(c => c.id !== columnId),
        tasks: state.tasks.map(t =>
          t.columnId === columnId ? { ...t, columnId: firstColumnId } : t
        )
      }
    }

    case 'MOVE_TASK_TO_COLUMN':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, columnId: action.payload.newColumnId, listId: action.payload.listId }
            : t
        )
      }

    case 'REORDER_COLUMNS': {
      const { listId, draggedId, droppedOnId } = action.payload
      const columnsForList = state.columns.filter(c => c.listId === listId)
      const otherColumns = state.columns.filter(c => c.listId !== listId)

      const draggedIndex = columnsForList.findIndex(c => c.id === draggedId)
      const droppedIndex = columnsForList.findIndex(c => c.id === droppedOnId)

      if (draggedIndex === -1 || droppedIndex === -1) return state

      const reordered = [...columnsForList]
      const [draggedColumn] = reordered.splice(draggedIndex, 1)
      reordered.splice(droppedIndex, 0, draggedColumn)

      return { ...state, columns: [...otherColumns, ...reordered] }
    }

    case 'ADD_HABIT': {
      const newHabit: Habit = {
        ...action.payload,
        id: generateId(),
        completions: [],
        createdAt: new Date().toISOString(),
      }
      return { ...state, habits: [...state.habits, newHabit] }
    }

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map(h => h.id === action.payload.id ? action.payload : h)
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
        })
      }
    }

    case 'ADD_COUNTDOWN': {
      const newEvent: CountdownEvent = { ...action.payload, id: generateId() }
      return { ...state, countdownEvents: [...state.countdownEvents, newEvent] }
    }

    case 'UPDATE_COUNTDOWN':
      return {
        ...state,
        countdownEvents: state.countdownEvents.map(e =>
          e.id === action.payload.id ? action.payload : e
        )
      }

    case 'DELETE_COUNTDOWN':
      return {
        ...state,
        countdownEvents: state.countdownEvents.filter(e => e.id !== action.payload)
      }

    case 'START_TIMER':
      return {
        ...state,
        pomodoro: { ...state.pomodoro, isActive: true, isPaused: false }
      }

    case 'PAUSE_TIMER':
      return {
        ...state,
        pomodoro: { ...state.pomodoro, isPaused: true }
      }

    case 'RESET_TIMER': {
      const { currentSession, settings } = state.pomodoro
      const duration = currentSession === 'focus'
        ? settings.focusDuration
        : currentSession === 'shortBreak'
        ? settings.shortBreakDuration
        : settings.longBreakDuration

      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          isActive: false,
          isPaused: false,
          remainingTime: duration * 60,
        }
      }
    }

    case 'TICK_TIMER': {
      if (!state.pomodoro.isActive || state.pomodoro.isPaused) return state
      const newRemainingTime = Math.max(0, state.pomodoro.remainingTime - 1)
      if (newRemainingTime === 0) {
        return taskManagerReducer(state, { type: 'COMPLETE_POMODORO_SESSION' })
      }
      return { ...state, pomodoro: { ...state.pomodoro, remainingTime: newRemainingTime } }
    }

    case 'SET_FOCUSED_TASK':
      return {
        ...state,
        pomodoro: { ...state.pomodoro, focusedTaskId: action.payload }
      }

    case 'COMPLETE_POMODORO_SESSION': {
      const { currentSession, sessionsCompleted, settings, focusedTaskId } = state.pomodoro
      let nextSession: PomodoroState['currentSession']
      let newSessionsCompleted = sessionsCompleted

      if (currentSession === 'focus') {
        newSessionsCompleted++
        nextSession = (newSessionsCompleted % settings.sessionsUntilLongBreak === 0)
          ? 'longBreak' : 'shortBreak'
        
        if (focusedTaskId) {
          const focusHistory = [
            ...state.pomodoro.focusHistory,
            {
              date: new Date().toISOString(),
              duration: settings.focusDuration * 60,
              taskId: focusedTaskId,
            }
          ]
          return {
            ...state,
            pomodoro: {
              ...state.pomodoro,
              currentSession: nextSession,
              sessionsCompleted: newSessionsCompleted,
              remainingTime: (nextSession === 'longBreak' ? settings.longBreakDuration : settings.shortBreakDuration) * 60,
              isActive: false,
              focusHistory,
            }
          }
        }
      } else {
        nextSession = 'focus'
      }

      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          currentSession: nextSession,
          sessionsCompleted: newSessionsCompleted,
          remainingTime: (nextSession === 'focus' ? settings.focusDuration : settings.shortBreakDuration) * 60,
          isActive: false,
        }
      }
    }

    case 'UPDATE_POMODORO_SETTINGS':
      return {
        ...state,
        pomodoro: {
          ...state.pomodoro,
          settings: { ...state.pomodoro.settings, ...action.payload }
        }
      }

    case 'ASSIGN_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId ? { ...t, assigneeId: action.payload.userId } : t
        )
      }

    case 'ADD_COMMENT':
      return {
        ...state,
        tasks: state.tasks.map(t =>
          t.id === action.payload.taskId
            ? { ...t, comments: [...(t.comments || []), action.payload.comment] }
            : t
        )
      }

    case 'SHARE_LIST':
      return {
        ...state,
        lists: state.lists.map(l =>
          l.id === action.payload.listId
            ? { ...l, members: [...l.members, action.payload.userId] }
            : l
        )
      }

    case 'UNSHARE_LIST':
      return {
        ...state,
        lists: state.lists.map(l =>
          l.id === action.payload.listId
            ? { ...l, members: l.members.filter(id => id !== action.payload.userId) }
            : l
        )
      }

    case 'LOAD_STATE':
      return action.payload

    default:
      return state
  }
}
