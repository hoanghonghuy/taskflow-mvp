"use client"

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n/hooks'
import { taskActions, listActions, habitActions, pomodoroActions } from '@/lib/store/task-manager/actions'
import { historyReducer } from '@/lib/store/task-manager/history-reducer'
import { INITIAL_STATE } from '@/lib/store/task-manager/initial-state'
import { useToast } from '@/lib/hooks/use-toast'
import { useUser } from './user-provider'
import * as countdownApi from '@/lib/api/countdown'
import * as habitsApi from '@/lib/api/habits'
import * as listsApi from '@/lib/api/lists'
import * as pomodoroApi from '@/lib/api/pomodoro'
import * as profileApi from '@/lib/api/profile'
import * as settingsApi from '@/lib/api/settings'
import * as tasksApi from '@/lib/api/tasks'
import type { Task, List, Habit, Comment, PomodoroState, AppState, Column } from '@/types'
import type { Action, TaskManagerContextType } from '@/lib/store/task-manager/types'
import type { TranslationKey } from '@/lib/i18n/types'
import { columnReducer } from '@/lib/store/task-manager/reducers/column-reducer'
import { resolveBoardColumns } from '@/lib/utils/task-helpers'

interface HistoryState {
  past: AppState[]
  present: AppState
  future: AppState[]
}

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(undefined)

export function TaskManagerProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const { isAuthenticated } = useUser()
  const hasLoadedFromBackend = useRef(false)
  const wasAuthenticatedRef = useRef(isAuthenticated)
  // Initialize with history state
  const [historyState, dispatch] = useReducer(
    historyReducer,
    {
      past: [],
      present: INITIAL_STATE,
      future: [],
    },
    // Start from INITIAL_STATE; backend will hydrate real data. We no longer
    // restore legacy taskflowState from localStorage to avoid loading mock data.
    (initial): HistoryState => initial
  )

  const pomodoroRef = useRef<PomodoroState>(historyState.present.pomodoro)

  const syncFromBackend = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const [tasks, lists, habits, countdownEvents] = await Promise.all([
        tasksApi.fetchTasks(),
        listsApi.fetchLists(),
        habitsApi.fetchHabits(),
        countdownApi.fetchCountdowns(),
      ])

      const tagSet = new Set<string>()
      for (const task of tasks) {
        for (const tag of task.tags ?? []) {
          if (tag) tagSet.add(tag)
        }
      }

      let savedBoardColumns: Column[] = []
      try {
        const settingsPayload = await settingsApi.fetchSettings()
        const boardColumns = (settingsPayload as { boardColumns?: Column[] } | null)?.boardColumns
        if (Array.isArray(boardColumns)) {
          savedBoardColumns = boardColumns
        }
      } catch (error) {
        console.error('Failed to load board columns from settings', error)
      }

      const columns = resolveBoardColumns(savedBoardColumns, lists, tasks)

      dispatch({
        type: 'LOAD_STATE',
        payload: {
          ...historyState.present,
          tasks,
          lists,
          columns,
          habits,
          countdownEvents,
          tags: Array.from(tagSet).sort(),
        },
      })
    } catch (error) {
      console.error('Failed to sync data from backend', error)
    }
  }, [dispatch, historyState.present, isAuthenticated])

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

  useEffect(() => {
    pomodoroRef.current = historyState.present.pomodoro
  }, [historyState.present.pomodoro])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (hasLoadedFromBackend.current) {
      return
    }

    hasLoadedFromBackend.current = true

    const loadFromBackend = async () => {
      try {
        const [tasks, lists, habits, countdownEvents] = await Promise.all([
          tasksApi.fetchTasks(),
          listsApi.fetchLists(),
          habitsApi.fetchHabits(),
          countdownApi.fetchCountdowns(),
        ])

        // Derive available tags from tasks loaded from backend so sidebar tags
        // reflect real data instead of only local state.
        const tagSet = new Set<string>()
        for (const task of tasks) {
          for (const tag of task.tags ?? []) {
            if (tag) tagSet.add(tag)
          }
        }
        const tags = Array.from(tagSet).sort()

        let unlockedAchievements = historyState.present.unlockedAchievements ?? []
        let focusHistory = historyState.present.pomodoro.focusHistory ?? []
        let pomodoroState = historyState.present.pomodoro

        try {
          const ps = await settingsApi.fetchPomodoroSettings()
          if (ps) {
            pomodoroState = {
              ...pomodoroState,
              settings: {
                ...pomodoroState.settings,
                focusDuration: Number(ps.focusDuration) || pomodoroState.settings.focusDuration,
                shortBreakDuration:
                  Number(ps.shortBreakDuration) || pomodoroState.settings.shortBreakDuration,
                longBreakDuration:
                  Number(ps.longBreakDuration) || pomodoroState.settings.longBreakDuration,
                sessionsUntilLongBreak:
                  Number(ps.sessionsUntilLongBreak) ||
                  pomodoroState.settings.sessionsUntilLongBreak,
              },
            }
          }
        } catch (error) {
          console.error('Failed to load settings from backend', error)
        }

        try {
          unlockedAchievements = await profileApi.fetchAchievements()
        } catch (error) {
          console.error('Failed to load achievements from backend', error)
        }

        try {
          focusHistory = await pomodoroApi.fetchPomodoroSessions()
        } catch (error) {
          console.error('Failed to load pomodoro sessions from backend', error)
        }

        try {
          const statePatch = await pomodoroApi.fetchPomodoroState(pomodoroState)
          if (statePatch) {
            pomodoroState = { ...pomodoroState, ...statePatch }
          }
        } catch (error) {
          console.error('Failed to load pomodoro state from backend', error)
        }

        const inboxList = lists.find((l) => l.name === 'Inbox' || l.id === 'inbox')
        const inboxListId = inboxList?.id ?? lists[0]?.id ?? 'inbox'
        const previousActive = historyState.present.activeListId
        const activeListId =
          previousActive === 'inbox'
            ? inboxListId
            : lists.find((l) => l.id === previousActive)?.id ?? inboxListId

        let savedBoardColumns: Column[] = []
        try {
          const settingsPayload = await settingsApi.fetchSettings()
          const boardColumns = (settingsPayload as { boardColumns?: Column[] } | null)?.boardColumns
          if (Array.isArray(boardColumns)) {
            savedBoardColumns = boardColumns
          }
        } catch (error) {
          console.error('Failed to load board columns from settings', error)
        }

        const columns = resolveBoardColumns(savedBoardColumns, lists, tasks)

        const nextState: AppState = {
          ...historyState.present,
          tasks,
          lists,
          columns,
          habits,
          countdownEvents,
          tags,
          pomodoro: {
            ...pomodoroState,
            focusHistory,
          },
          unlockedAchievements,
          activeListId,
        }

        dispatch({ type: 'LOAD_STATE', payload: nextState })
      } catch (error) {
        console.error('Failed to load data from backend', error)
      }
    }

    loadFromBackend()
  }, [historyState.present, dispatch, hasLoadedFromBackend, isAuthenticated])

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

  // Persist pomodoro snapshot when the user closes or reloads the page
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleBeforeUnload = () => {
      if (!isAuthenticated) {
        return
      }

      const current = pomodoroRef.current

      try {
        void pomodoroApi.updatePomodoroState(current, { keepalive: true })
      } catch (error) {
        console.error('Failed to sync pomodoro state before unload', error)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAuthenticated])

  // Sync pomodoro state to backend on significant changes (but not every tick)
  const previousPomodoroRef = useRef<PomodoroState | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      previousPomodoroRef.current = historyState.present.pomodoro
      return
    }

    const current = historyState.present.pomodoro
    const previous = previousPomodoroRef.current

    previousPomodoroRef.current = current

    if (!previous) {
      // Skip initial sync; backend will already have either no state or last saved snapshot.
      return
    }

    const structuralChanged =
      previous.isActive !== current.isActive ||
      previous.isPaused !== current.isPaused ||
      previous.currentSession !== current.currentSession ||
      previous.sessionsCompleted !== current.sessionsCompleted ||
      previous.focusedTaskId !== current.focusedTaskId ||
      previous.focusedHabitId !== current.focusedHabitId

    if (!structuralChanged) {
      // Ignore changes that only affect remainingTime (TICK_TIMER) to avoid spamming backend.
      return
    }

    void pomodoroApi.updatePomodoroState(current).catch((error) => {
      console.error('Failed to sync pomodoro state to backend', error)
    })
  }, [historyState.present.pomodoro, isAuthenticated])

  // Ensure pomodoro state is saved when the user logs out
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      const current = historyState.present.pomodoro

      try {
        void pomodoroApi.updatePomodoroState(current, { keepalive: true })
      } catch (error) {
        console.error('Failed to sync pomodoro state on logout', error)
      }
    }

    wasAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated, historyState.present.pomodoro])

  // Reset in-memory task manager state when user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedFromBackend.current = false
      dispatch({ type: 'LOAD_STATE', payload: INITIAL_STATE })
    }
  }, [isAuthenticated, dispatch])

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
              new Notification(t('reminder.notificationTitle' as TranslationKey), {
                body: t('reminder.notificationBody' as TranslationKey, { title: task.title }),
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
        syncFromBackend,
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
async function refreshUnlockedAchievements(dispatch: (action: import('@/lib/store/task-manager/types').Action) => void) {
  try {
    const ids = await profileApi.fetchAchievements()
    dispatch({ type: 'SET_UNLOCKED_ACHIEVEMENTS', payload: ids })
  } catch {
    // achievements refresh is best-effort
  }
}

export function useTaskActions() {
  const { state, dispatch } = useTaskManager()
  const { success, error: showError } = useToast()
  const { t } = useI18n()

  return {
    addTask: useCallback(async (task: Omit<Task, 'id'>) => {
      try {
        const createdTask = await tasksApi.createTask({
          title: task.title,
          description: task.description,
          dueDate: task.dueDate ?? null,
          priority: task.priority,
          listId: task.listId,
          columnId: task.columnId ?? null,
          tags: task.tags ?? [],
          recurrence: task.recurrence ?? null,
          reminderMinutes: typeof task.reminderMinutes === 'number' ? task.reminderMinutes : null,
          assigneeId: task.assigneeId ?? null,
        })

        if (createdTask) {
          dispatch({ type: 'ADD_TASK', payload: createdTask })
          void refreshUnlockedAchievements(dispatch)
          success(
            t('toast.taskAddedTitle' as TranslationKey),
            t('toast.taskAddedBody' as TranslationKey, { title: createdTask.title }),
          )
        }
      } catch (err) {
        console.error('Failed to create task via API', err)
        showError(
          t('toast.api.taskCreateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, success, showError, t]),

    updateTask: useCallback(async (task: Task) => {
      try {
        const updatedTask = (await tasksApi.updateTask(task.id, {
          title: task.title,
          description: task.description,
          completed: task.completed,
          dueDate: task.dueDate ?? null,
          priority: task.priority,
          listId: task.listId,
          columnId: task.columnId ?? null,
          tags: task.tags ?? [],
          subtasks: task.subtasks ?? [],
          comments: task.comments ?? [],
          recurrence: task.recurrence ?? null,
          reminderMinutes: task.reminderMinutes ?? null,
          assigneeId: task.assigneeId ?? null,
        })) ?? task

        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        success(
          t('toast.taskUpdatedTitle' as TranslationKey),
          t('toast.taskUpdatedBody' as TranslationKey, { title: updatedTask.title }),
        )
      } catch (err) {
        console.error('Failed to update task via API', err)
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, success, showError, t]),

    deleteTask: useCallback(async (taskId: string) => {
      try {
        await tasksApi.deleteTask(taskId)
      } catch (err) {
        console.error('Failed to delete task via API', err)
        showError(
          t('toast.api.taskDeleteFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      dispatch(taskActions.delete(taskId))
      void refreshUnlockedAchievements(dispatch)
      success(
        t('toast.taskDeletedTitle' as TranslationKey),
        t('toast.taskDeletedBody' as TranslationKey),
      )
    }, [dispatch, success, showError, t]),

    toggleTask: useCallback(async (taskId: string) => {
      const existing = state.tasks.find(t => t.id === taskId)
      if (!existing) {
        return
      }

      const newCompleted = !existing.completed

      try {
        const updatedTask = await tasksApi.updateTask(taskId, { completed: newCompleted })

        if (updatedTask) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
          void refreshUnlockedAchievements(dispatch)
          return
        }
      } catch (err) {
        console.error('Failed to toggle task via API', err)
        showError(
          t('toast.api.taskStatusFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      // If the API fails, keep local state unchanged.
    }, [dispatch, showError, state.tasks, t]),

    assignTask: useCallback((taskId: string, userId: string | null) => {
      dispatch(taskActions.assign(taskId, userId))
      success(
        t('toast.taskAssignedTitle' as TranslationKey),
        userId
          ? t('toast.taskAssignedBody' as TranslationKey)
          : t('toast.taskAssignmentRemovedBody' as TranslationKey),
      )
    }, [dispatch, success, t]),

    addComment: useCallback((taskId: string, comment: Comment) => {
      dispatch(taskActions.addComment(taskId, comment))
      success(
        t('toast.commentAddedTitle' as TranslationKey),
        t('toast.commentAddedBody' as TranslationKey),
      )
    }, [dispatch, success, t]),

    reorderTasks: useCallback(async (draggedId: string, droppedOnId: string) => {
      const before = state.tasks
      dispatch(taskActions.reorder(draggedId, droppedOnId))

      const reordered = [...before]
      const draggedIndex = reordered.findIndex((t) => t.id === draggedId)
      const droppedIndex = reordered.findIndex((t) => t.id === droppedOnId)
      if (draggedIndex === -1 || droppedIndex === -1) return

      const [draggedTask] = reordered.splice(draggedIndex, 1)
      reordered.splice(droppedIndex, 0, draggedTask)

      try {
        const tasks = await tasksApi.reorderTasks(reordered.map((t) => t.id))
        if (tasks.length > 0) {
          dispatch({ type: 'SET_TASKS', payload: tasks })
        }
      } catch (err) {
        console.error('Failed to reorder tasks via API', err)
        dispatch({ type: 'SET_TASKS', payload: before })
        showError(
          t('toast.api.taskReorderFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, state.tasks, t]),

    syncSubtasks: useCallback(async (taskId: string, subtasks: import('@/types').Subtask[]) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      try {
        const updatedTask = (await tasksApi.updateTask(taskId, { subtasks })) ?? {
          ...existing,
          subtasks,
        }

        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      } catch (err) {
        console.error('Failed to update subtasks via API', err)
        showError(
          t('toast.api.subtasksUpdateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, state.tasks, t]),

    syncComments: useCallback(async (taskId: string, comments: Comment[]) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      try {
        const updatedTask = (await tasksApi.updateTask(taskId, { comments })) ?? {
          ...existing,
          comments,
        }

        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      } catch (err) {
        console.error('Failed to update comments via API', err)
        showError(
          t('toast.api.commentsUpdateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, state.tasks, t]),

    moveToColumn: useCallback((taskId: string, newColumnId: string, listId: string) => {
      dispatch(taskActions.moveToColumn(taskId, newColumnId, listId))
    }, [dispatch]),

    moveTaskToColumn: useCallback(async (taskId: string, newColumnId: string, listId: string) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      const before = existing
      dispatch(taskActions.moveToColumn(taskId, newColumnId, listId))

      try {
        const updatedTask = await tasksApi.updateTask(taskId, {
          columnId: newColumnId,
          listId,
        })

        if (updatedTask) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        }
      } catch (err) {
        console.error('Failed to move task to column via API', err)
        dispatch({ type: 'UPDATE_TASK', payload: before })
        showError(
          t('toast.api.taskMoveFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, state.tasks, t]),

    deleteTag: useCallback(async (tagName: string) => {
      const tagToDelete = tagName.trim()
      if (!tagToDelete) return

      const affectedTasks = state.tasks.filter((task) =>
        task.tags.some((tag) => tag === tagToDelete),
      )

      const beforeTasks = state.tasks
      const beforeActiveTag = state.activeTag

      dispatch({ type: 'DELETE_TAG', payload: tagToDelete })

      if (affectedTasks.length === 0) return

      try {
        const updates = await Promise.all(
          affectedTasks.map(async (task) => {
            const tags = task.tags.filter((tag) => tag !== tagToDelete)
            const updated =
              (await tasksApi.updateTask(task.id, { tags })) ?? { ...task, tags }
            return updated
          }),
        )

        for (const updatedTask of updates) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        }
      } catch (err) {
        console.error('Failed to delete tag via API', err)
        dispatch({ type: 'SET_TASKS', payload: beforeTasks })
        dispatch({ type: 'ADD_TAG', payload: { name: tagToDelete } })
        dispatch({ type: 'SET_ACTIVE_TAG', payload: beforeActiveTag })
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, state.activeTag, state.tasks, t]),
  }
}

async function persistBoardColumns(columns: Column[]): Promise<void> {
  await settingsApi.updateBoardColumns(columns)
}

export function useColumnActions() {
  const { state, dispatch } = useTaskManager()
  const { error: showError } = useToast()
  const { t } = useI18n()

  const applyColumnChange = useCallback(
    async (action: Action) => {
      const nextColumns = columnReducer(state, action).columns
      dispatch(action)

      try {
        await persistBoardColumns(nextColumns)
      } catch (err) {
        console.error('Failed to persist board columns via API', err)
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    },
    [dispatch, showError, state, t],
  )

  return {
    addColumn: useCallback(
      (listId: string, name: string) =>
        applyColumnChange({ type: 'ADD_COLUMN', payload: { listId, name } }),
      [applyColumnChange],
    ),
    updateColumn: useCallback(
      (columnId: string, name: string) =>
        applyColumnChange({ type: 'UPDATE_COLUMN', payload: { columnId, name } }),
      [applyColumnChange],
    ),
    deleteColumn: useCallback(
      async (columnId: string, listId: string) => {
        const action = { type: 'DELETE_COLUMN', payload: { columnId, listId } } as const
        const nextState = columnReducer(state, action)
        const affectedTasks = state.tasks.filter((task) => task.columnId === columnId)

        dispatch(action)

        try {
          await persistBoardColumns(nextState.columns)
          await Promise.all(
            affectedTasks.map(async (task) => {
              const updatedTask = nextState.tasks.find((t) => t.id === task.id)
              if (!updatedTask) return
              const saved = await tasksApi.updateTask(task.id, {
                columnId: updatedTask.columnId ?? null,
              })
              if (saved) {
                dispatch({ type: 'UPDATE_TASK', payload: saved })
              }
            }),
          )
        } catch (err) {
          console.error('Failed to delete column via API', err)
          showError(
            t('toast.api.taskUpdateFailedTitle' as TranslationKey),
            err instanceof Error ? err.message : undefined,
          )
        }
      },
      [dispatch, showError, state, t],
    ),
    reorderColumns: useCallback(
      (listId: string, draggedId: string, droppedOnId: string) =>
        applyColumnChange({
          type: 'REORDER_COLUMNS',
          payload: { listId, draggedId, droppedOnId },
        }),
      [applyColumnChange],
    ),
  }
}

export function useListActions() {
  const { state, dispatch } = useTaskManager()
  const { error: showError } = useToast()
  const { t } = useI18n()

  return {
    addList: useCallback(async (list: Omit<List, 'id'>) => {
      try {
        const createdList = await listsApi.createList(list)

        if (createdList) {
          dispatch({ type: 'ADD_LIST', payload: createdList })
          return
        }
      } catch (err) {
        console.error('Failed to create list via API', err)
        showError(
          t('toast.api.listCreateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, t]),

    updateList: useCallback(async (list: List) => {
      try {
        const updatedList = (await listsApi.updateList(list)) ?? list

        dispatch({ type: 'UPDATE_LIST', payload: updatedList })
      } catch (err) {
        console.error('Failed to update list via API', err)
        showError(
          t('toast.api.listUpdateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, t]),

    deleteList: useCallback(async (listId: string) => {
      try {
        await listsApi.deleteList(listId)
      } catch (err) {
        console.error('Failed to delete list via API', err)
        showError(
          t('toast.api.listDeleteFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      dispatch(listActions.delete(listId))
    }, [dispatch, showError, t]),

    shareList: useCallback(async (listId: string, userId: string): Promise<boolean> => {
      const existing = state.lists.find((l) => l.id === listId)
      if (!existing) return false

      const nextMembers = existing.members.includes(userId)
        ? existing.members
        : [...existing.members, userId]

      try {
        const updatedList =
          (await listsApi.updateList({ ...existing, members: nextMembers })) ?? {
            ...existing,
            members: nextMembers,
          }

        dispatch({ type: 'UPDATE_LIST', payload: updatedList })
        return true
      } catch (err) {
        console.error('Failed to share list via API', err)
        showError(
          t('toast.api.listShareFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return false
      }
    }, [dispatch, showError, state.lists, t]),

    unshareList: useCallback(async (listId: string, userId: string): Promise<boolean> => {
      const existing = state.lists.find((l) => l.id === listId)
      if (!existing) return false

      const nextMembers = existing.members.filter((id) => id !== userId)

      try {
        const updatedList =
          (await listsApi.updateList({ ...existing, members: nextMembers })) ?? {
            ...existing,
            members: nextMembers,
          }

        dispatch({ type: 'UPDATE_LIST', payload: updatedList })
        return true
      } catch (err) {
        console.error('Failed to unshare list via API', err)
        showError(
          t('toast.api.listUnshareFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return false
      }
    }, [dispatch, showError, state.lists, t]),
  }
}

export function useHabitActions() {
  const { state, dispatch } = useTaskManager()
  const { error: showError } = useToast()
  const { t } = useI18n()

  return {
    addHabit: useCallback(async (habit: Omit<Habit, 'id' | 'completions' | 'createdAt'>) => {
      try {
        const createdHabit = await habitsApi.createHabit(habit.name)

        if (createdHabit) {
          dispatch({ type: 'ADD_HABIT', payload: createdHabit })
        }
      } catch (err) {
        console.error('Failed to create habit via API', err)
        showError(
          t('toast.api.habitCreateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, t]),

    updateHabit: useCallback(async (habit: Habit) => {
      try {
        const updatedHabit = (await habitsApi.updateHabit(habit)) ?? habit

        dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit })
      } catch (err) {
        console.error('Failed to update habit via API', err)
        showError(
          t('toast.api.habitUpdateFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, t]),

    toggleHabitCompletion: useCallback(async (habitId: string, date: string) => {
      const existing = state.habits.find((h) => h.id === habitId)
      if (!existing) return

      const isCompleted = existing.completions.includes(date)

      try {
        if (!isCompleted) {
          await habitsApi.completeHabit(habitId, date)
        } else {
          await habitsApi.uncompleteHabit(habitId, date)
        }
      } catch (err) {
        console.error('Failed to toggle habit completion via API', err)
        showError(
          t('toast.api.habitCompletionFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      dispatch(habitActions.toggleCompletion(habitId, date))
      void refreshUnlockedAchievements(dispatch)
    }, [dispatch, showError, state.habits, t]),

    deleteHabit: useCallback(async (habitId: string) => {
      try {
        await habitsApi.deleteHabit(habitId)
      } catch (err) {
        console.error('Failed to delete habit via API', err)
        showError(
          t('toast.api.habitDeleteFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      dispatch(habitActions.delete(habitId))
    }, [dispatch, showError, t]),
  }
}

export function usePomodoroActions() {
  const { state, dispatch } = useTaskManager()

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

    updateSettings: useCallback(async (settings: Partial<PomodoroState['settings']>) => {
      const merged = { ...state.pomodoro.settings, ...settings }
      dispatch(pomodoroActions.updateSettings(settings))
      try {
        await settingsApi.updatePomodoroSettings(merged)
      } catch (error) {
        console.error('Failed to persist pomodoro settings', error)
      }
    }, [dispatch, state.pomodoro.settings]),
  }
}
