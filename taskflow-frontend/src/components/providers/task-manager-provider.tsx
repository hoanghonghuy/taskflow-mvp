'use client'

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
import { taskActions, listActions, habitActions, pomodoroActions } from '@/lib/store/task-manager/actions'
import { historyReducer } from '@/lib/store/task-manager/history-reducer'
import { INITIAL_STATE } from '@/lib/store/task-manager/initial-state'
import { useToast } from '@/lib/hooks/use-toast'
import type { Task, List, Habit, Comment, PomodoroState, AppState } from '@/types'
import type { TaskManagerContextType } from '@/lib/store/task-manager/types'
import { generateMockData } from '@/lib/mock-data'

interface HistoryState {
  past: AppState[]
  present: AppState
  future: AppState[]
}

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(undefined)

export function TaskManagerProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  // Initialize with history state
  const [historyState, dispatch] = useReducer(
    historyReducer,
    {
      past: [],
      present: INITIAL_STATE,
      future: []
    },
    // Lazy initialization - load from localStorage or use mock data
    (initial): HistoryState => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('taskflowState')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            // Only use saved state if it has tasks or other meaningful data
            if (parsed.tasks && parsed.tasks.length > 0) {
              return {
                past: [],
                present: parsed,
                future: []
              }
            }
          } catch (error) {
            console.error(t('console.failedParseState'), error)
          }
        }
        // Load mock data if no saved state or saved state has no tasks
        try {
          const mockData = generateMockData()
          console.log(t('console.loadingMockData'), {
            tasks: mockData.tasks.length,
            lists: mockData.lists.length,
            habits: mockData.habits.length,
            countdowns: mockData.countdownEvents.length,
          })
          return {
            past: [],
            present: {
              ...INITIAL_STATE,
              ...mockData,
              pomodoro: {
                ...INITIAL_STATE.pomodoro,
                focusHistory: mockData.focusHistory,
              },
            },
            future: []
          }
        } catch (error) {
          console.error(t('console.failedLoadMockData'), error)
          return initial
        }
      }
      return initial
    }
  )

  // Save to localStorage whenever state changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('taskflowState', JSON.stringify(historyState.present))
      } catch (error) {
        console.error(t('console.failedSaveState'), error)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [historyState.present, t])

  // Pomodoro timer tick
  useEffect(() => {
    if (!historyState.present.pomodoro.isActive || historyState.present.pomodoro.isPaused) {
      return
    }

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' })
    }, 1000)

    return () => clearInterval(interval)
  }, [historyState.present.pomodoro.isActive, historyState.present.pomodoro.isPaused, dispatch])

  // Check for task reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      historyState.present.tasks.forEach((task: Task) => {
        if (!task.completed && task.dueDate && task.reminderMinutes) {
          const dueDate = new Date(task.dueDate)
          const reminderTime = new Date(dueDate.getTime() - task.reminderMinutes * 60 * 1000)
          
          if (now >= reminderTime && now < dueDate) {
            const lastShown = localStorage.getItem(`reminder-${task.id}`)
            const shouldShow = !lastShown || (now.getTime() - parseInt(lastShown)) > 60000
            
            if (shouldShow && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Task Reminder', {
                body: `${task.title} is due soon!`,
                icon: '/favicon.ico'
              })
              localStorage.setItem(`reminder-${task.id}`, now.getTime().toString())
            }
          }
        }
      })
    }

    const interval = setInterval(checkReminders, 60000)
    checkReminders()

    return () => clearInterval(interval)
  }, [historyState.present.tasks, t])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const canUndo = historyState.past.length > 0
  const canRedo = historyState.future.length > 0

  return (
    <TaskManagerContext.Provider
      value={{
        state: historyState.present,
        dispatch,
        canUndo,
        canRedo,
      }}
    >
      {children}
    </TaskManagerContext.Provider>
  )
}

// Base hook
export function useTaskManager() {
  const context = useContext(TaskManagerContext)
  if (context === undefined) {
    throw new Error('useTaskManager must be used within TaskManagerProvider')
  }
  return context
}

// Convenience hooks using action creators
export function useTaskActions() {
  const { dispatch } = useTaskManager()
  const { success } = useToast()

  return {
    addTask: useCallback((task: Omit<Task, 'id'>) => {
      dispatch(taskActions.add(task))
      success('Task Added', `${task.title} has been created successfully`)
    }, [dispatch, success]),

    updateTask: useCallback((task: Task) => {
      dispatch(taskActions.update(task))
      success('Task Updated', `${task.title} has been updated`)
    }, [dispatch, success]),

    deleteTask: useCallback((taskId: string) => {
      // Note: We can't get the task title here without accessing state
      // This is a limitation of the current action structure
      dispatch(taskActions.delete(taskId))
      success('Task Deleted', 'Task has been removed')
    }, [dispatch, success]),

    toggleTask: useCallback((taskId: string) => {
      dispatch(taskActions.toggle(taskId))
      // Toast will be handled by the reducer since we need the task state
    }, [dispatch]),

    assignTask: useCallback((taskId: string, userId: string | null) => {
      dispatch(taskActions.assign(taskId, userId))
      success('Task Assigned', userId ? 'Task has been assigned' : 'Task assignment removed')
    }, [dispatch, success]),

    addComment: useCallback((taskId: string, comment: Comment) => {
      dispatch(taskActions.addComment(taskId, comment))
      success('Comment Added', 'Your comment has been posted')
    }, [dispatch, success]),

    moveToColumn: useCallback((taskId: string, newColumnId: string, listId: string) => {
      dispatch(taskActions.moveToColumn(taskId, newColumnId, listId))
    }, [dispatch]),
  }
}

export function useListActions() {
  const { dispatch } = useTaskManager()

  return {
    addList: useCallback((list: Omit<List, 'id'>) => {
      dispatch(listActions.add(list))
    }, [dispatch]),

    updateList: useCallback((list: List) => {
      dispatch(listActions.update(list))
    }, [dispatch]),

    deleteList: useCallback((listId: string) => {
      dispatch(listActions.delete(listId))
    }, [dispatch]),

    shareList: useCallback((listId: string, userId: string) => {
      dispatch(listActions.share(listId, userId))
    }, [dispatch]),

    unshareList: useCallback((listId: string, userId: string) => {
      dispatch(listActions.unshare(listId, userId))
    }, [dispatch]),
  }
}

export function useHabitActions() {
  const { dispatch } = useTaskManager()

  return {
    addHabit: useCallback((habit: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => {
      dispatch(habitActions.add(habit))
    }, [dispatch]),

    updateHabit: useCallback((habit: Habit) => {
      dispatch(habitActions.update(habit))
    }, [dispatch]),

    deleteHabit: useCallback((habitId: string) => {
      dispatch(habitActions.delete(habitId))
    }, [dispatch]),

    toggleHabitCompletion: useCallback((habitId: string, date: string) => {
      dispatch(habitActions.toggleCompletion(habitId, date))
    }, [dispatch]),
  }
}

export function usePomodoroActions() {
  const { dispatch } = useTaskManager()

  return {
    startTimer: useCallback(() => {
      dispatch(pomodoroActions.start())
    }, [dispatch]),

    pauseTimer: useCallback(() => {
      dispatch(pomodoroActions.pause())
    }, [dispatch]),

    resetTimer: useCallback(() => {
      dispatch(pomodoroActions.reset())
    }, [dispatch]),

    skipBreak: useCallback(() => {
      dispatch(pomodoroActions.skipBreak())
    }, [dispatch]),

    setFocusedTask: useCallback((taskId: string | null) => {
      dispatch(pomodoroActions.setFocusedTask(taskId))
    }, [dispatch]),

    setFocusedHabit: useCallback((habitId: string | null) => {
      dispatch(pomodoroActions.setFocusedHabit(habitId))
    }, [dispatch]),

    updateSettings: useCallback((settings: Partial<PomodoroState['settings']>) => {
      dispatch(pomodoroActions.updateSettings(settings))
    }, [dispatch]),
  }
}
