'use client'

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react'
import { INITIAL_STATE, historyReducer } from '@/lib/store/task-manager'
import type { TaskManagerContextType, HistoryState } from '@/lib/store/task-manager'
import type { Task, List, Habit, Comment, PomodoroState } from '@/types'
import { taskActions, listActions, habitActions, pomodoroActions } from '@/lib/store/task-manager/actions'

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(undefined)

export function TaskManagerProvider({ children }: { children: React.ReactNode }) {
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
            console.error('Failed to parse saved state:', error)
          }
        }
        // Load mock data if no saved state or saved state has no tasks
        try {
          const { generateMockData } = require('@/lib/mock-data')
          const mockData = generateMockData()
          console.log('📦 Loading mock data:', {
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
          console.error('❌ Failed to load mock data:', error)
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
        console.error('Failed to save state to localStorage:', error)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [historyState.present])

  // Pomodoro timer tick
  useEffect(() => {
    if (!historyState.present.pomodoro.isActive || historyState.present.pomodoro.isPaused) {
      return
    }

    const interval = setInterval(() => {
      dispatch({ type: 'TICK_TIMER' })
    }, 1000)

    return () => clearInterval(interval)
  }, [historyState.present.pomodoro.isActive, historyState.present.pomodoro.isPaused])

  // Check for task reminders
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()
      historyState.present.tasks.forEach(task => {
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
  }, [historyState.present.tasks])

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

  return {
    addTask: useCallback((task: Omit<Task, 'id'>) => {
      dispatch(taskActions.add(task))
    }, [dispatch]),

    updateTask: useCallback((task: Task) => {
      dispatch(taskActions.update(task))
    }, [dispatch]),

    deleteTask: useCallback((taskId: string) => {
      dispatch(taskActions.delete(taskId))
    }, [dispatch]),

    toggleTask: useCallback((taskId: string) => {
      dispatch(taskActions.toggle(taskId))
    }, [dispatch]),

    assignTask: useCallback((taskId: string, userId: string | null) => {
      dispatch(taskActions.assign(taskId, userId))
    }, [dispatch]),

    addComment: useCallback((taskId: string, comment: Comment) => {
      dispatch(taskActions.addComment(taskId, comment))
    }, [dispatch]),

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

    setFocusedTask: useCallback((taskId: string | null) => {
      dispatch(pomodoroActions.setFocusedTask(taskId))
    }, [dispatch]),

    updateSettings: useCallback((settings: Partial<PomodoroState['settings']>) => {
      dispatch(pomodoroActions.updateSettings(settings))
    }, [dispatch]),
  }
}
