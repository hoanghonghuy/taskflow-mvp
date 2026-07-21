"use client"

import { createContext, useContext, useReducer, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useI18n } from '@/lib/i18n/hooks'
import { taskActions, listActions, habitActions, pomodoroActions } from '@/lib/store/task-manager/actions'
import { historyReducer } from '@/lib/store/task-manager/history-reducer'
import { INITIAL_STATE } from '@/lib/store/task-manager/initial-state'
import { useToast } from '@/lib/hooks/use-toast'
import { useUser } from './user-provider'
import { useSettings } from './settings-provider'
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
import { moveItemById } from '@/lib/utils/array-move'
import {
  createKeyedMutationQueue,
  scopedMutationKey,
} from '@/lib/utils/keyed-mutation-queue'

interface HistoryState {
  past: AppState[]
  present: AppState
  future: AppState[]
}

const TaskManagerContext = createContext<TaskManagerContextType | undefined>(undefined)

export function TaskManagerProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const { isAuthenticated } = useUser()
  const { settings: userSettings } = useSettings()
  const hasLoadedFromBackend = useRef(false)
  const wasAuthenticatedRef = useRef(isAuthenticated)
  const [isHydrating, setIsHydrating] = useState(false)
  const [hydrationError, setHydrationError] = useState<string | null>(null)
  const [hydrationAttempt, setHydrationAttempt] = useState(0)
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
  /** Server pomodoroStateUpdatedAt for optimistic concurrency on PUT. */
  const pomodoroServerUpdatedAtRef = useRef<string | null>(null)

  const syncFromBackend = useCallback(async () => {
    if (!isAuthenticated) return

    setIsHydrating(true)
    setHydrationError(null)
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
      setHydrationError(null)
    } catch (error) {
      console.error('Failed to sync data from backend', error)
      setHydrationError(error instanceof Error ? error.message : 'Failed to load data')
    } finally {
      setIsHydrating(false)
    }
  }, [dispatch, historyState.present, isAuthenticated])

  // Save to localStorage whenever state changes (debounced)
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('taskflowState', JSON.stringify(historyState.present))
      } catch (error) {
        console.error(t('console.failedSaveState'), error)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [historyState.present, isAuthenticated, t])

  useEffect(() => {
    pomodoroRef.current = historyState.present.pomodoro
  }, [historyState.present.pomodoro])

  const presentRef = useRef(historyState.present)
  presentRef.current = historyState.present

  const retryHydration = useCallback(() => {
    hasLoadedFromBackend.current = false
    setHydrationError(null)
    setHydrationAttempt((attempt) => attempt + 1)
  }, [])

  useLayoutEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (hasLoadedFromBackend.current) {
      return
    }

    hasLoadedFromBackend.current = true
    setIsHydrating(true)
    setHydrationError(null)
    let cancelled = false
    let settled = false

    const loadFromBackend = async () => {
      const presentSnapshot = presentRef.current
      try {
        const [tasks, lists, habits, countdownEvents] = await Promise.all([
          tasksApi.fetchTasks(),
          listsApi.fetchLists(),
          habitsApi.fetchHabits(),
          countdownApi.fetchCountdowns(),
        ])

        if (cancelled) return

        // Derive available tags from tasks loaded from backend so sidebar tags
        // reflect real data instead of only local state.
        const tagSet = new Set<string>()
        for (const task of tasks) {
          for (const tag of task.tags ?? []) {
            if (tag) tagSet.add(tag)
          }
        }
        const tags = Array.from(tagSet).sort()

        let unlockedAchievements = presentSnapshot.unlockedAchievements ?? []
        let focusHistory = presentSnapshot.pomodoro.focusHistory ?? []
        let pomodoroState = presentSnapshot.pomodoro

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

        if (cancelled) return

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
          const stateResult = await pomodoroApi.fetchPomodoroState(pomodoroState)
          if (stateResult) {
            pomodoroState = { ...pomodoroState, ...stateResult.patch }
            pomodoroServerUpdatedAtRef.current = stateResult.updatedAt
          }
        } catch (error) {
          console.error('Failed to load pomodoro state from backend', error)
        }

        if (cancelled) return

        const inboxList = lists.find((l) => l.name === 'Inbox' || l.id === 'inbox')
        const inboxListId = inboxList?.id ?? lists[0]?.id ?? 'inbox'
        const previousActive = presentSnapshot.activeListId
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

        if (cancelled) return

        const columns = resolveBoardColumns(savedBoardColumns, lists, tasks)

        const nextState: AppState = {
          ...presentSnapshot,
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
        if (!cancelled) {
          setHydrationError(error instanceof Error ? error.message : 'Failed to load data')
        }
      } finally {
        settled = true
        if (!cancelled) {
          setIsHydrating(false)
        }
      }
    }

    void loadFromBackend()

    return () => {
      cancelled = true
      if (!settled) {
        hasLoadedFromBackend.current = false
      }
    }
  }, [dispatch, hydrationAttempt, isAuthenticated])

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

    const sessionCompleted =
      previous.isActive &&
      !current.isActive &&
      previous.currentSession !== current.currentSession

    if (sessionCompleted && userSettings.autoStartPomodoro) {
      dispatch({ type: 'START_TIMER' })
    }

    if (!structuralChanged) {
      // Ignore changes that only affect remainingTime (TICK_TIMER) to avoid spamming backend.
      return
    }

    void pomodoroApi
      .updatePomodoroState(current, {
        expectedUpdatedAt: pomodoroServerUpdatedAtRef.current,
      })
      .then((result) => {
        if (result.conflict) {
          void pomodoroApi.fetchPomodoroState(current).then((fresh) => {
            if (!fresh) return
            pomodoroServerUpdatedAtRef.current = fresh.updatedAt
            dispatch({
              type: 'LOAD_STATE',
              payload: {
                ...presentRef.current,
                pomodoro: {
                  ...presentRef.current.pomodoro,
                  ...fresh.patch,
                  focusHistory: presentRef.current.pomodoro.focusHistory,
                  settings: presentRef.current.pomodoro.settings,
                },
              },
            })
          })
          return
        }
        if (result.updatedAt) {
          pomodoroServerUpdatedAtRef.current = result.updatedAt
        }
      })
      .catch((error) => {
        console.error('Failed to sync pomodoro state to backend', error)
      })
  }, [historyState.present.pomodoro, isAuthenticated, userSettings.autoStartPomodoro, dispatch])

  // Ensure pomodoro state is saved when the user logs out
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      const current = historyState.present.pomodoro

      try {
        void pomodoroApi.updatePomodoroState(current, { keepalive: true })
      } catch (error) {
        console.error('Failed to sync pomodoro state on logout', error)
      }
      pomodoroServerUpdatedAtRef.current = null
    }

    wasAuthenticatedRef.current = isAuthenticated
  }, [isAuthenticated, historyState.present.pomodoro])

  // Reset in-memory task manager state when user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      hasLoadedFromBackend.current = false
      setIsHydrating(false)
      setHydrationError(null)
      dispatch({ type: 'LOAD_STATE', payload: INITIAL_STATE })
    }
  }, [isAuthenticated, dispatch])

  const canUndo = historyState.past.length > 0
  const canRedo = historyState.future.length > 0

  return (
    <TaskManagerContext.Provider
      value={{
        state: historyState.present,
        dispatch,
        canUndo,
        canRedo,
        isHydrating,
        hydrationError,
        syncFromBackend,
        retryHydration,
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

const habitToggleInFlight = new Set<string>()
const taskMutationQueue = createKeyedMutationQueue()

function queueTaskUpdate(
  userId: string | null | undefined,
  taskId: string,
  updates: Parameters<typeof tasksApi.updateTask>[1],
) {
  return taskMutationQueue.run(
    scopedMutationKey(userId, taskId),
    () => tasksApi.updateTask(taskId, updates),
  )
}

function queueTaskDelete(userId: string | null | undefined, taskId: string) {
  return taskMutationQueue.run(
    scopedMutationKey(userId, taskId),
    () => tasksApi.deleteTask(taskId),
  )
}

export function useTaskActions() {
  const { state, dispatch, syncFromBackend } = useTaskManager()
  const { success, error: showError } = useToast()
  const { t } = useI18n()
  const { user } = useUser()

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
          return true
        }
        return false
      } catch (err) {
        console.error('Failed to create task via API', err)
        showError(
          t('toast.api.taskCreateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return false
      }
    }, [dispatch, success, showError, t]),

    updateTask: useCallback(async (task: Task, options?: { silent?: boolean; rollback?: Task }) => {
      try {
        const updatedTask = (await queueTaskUpdate(user?.id, task.id, {
          title: task.title,
          description: task.description,
          completed: task.completed,
          dueDate: task.dueDate ?? null,
          priority: task.priority,
          listId: task.listId,
          columnId: task.columnId ?? null,
          tags: task.tags ?? [],
          recurrence: task.recurrence ?? null,
          reminderMinutes: task.reminderMinutes ?? null,
          assigneeId: task.assigneeId ?? null,
        })) ?? task

        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        if (!options?.silent) {
          success(
            t('toast.taskUpdatedTitle' as TranslationKey),
            t('toast.taskUpdatedBody' as TranslationKey, { title: updatedTask.title }),
          )
        }
      } catch (err) {
        console.error('Failed to update task via API', err)
        if (options?.rollback) {
          dispatch({ type: 'UPDATE_TASK', payload: options.rollback })
        }
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, success, showError, t, user]),

    deleteTask: useCallback(async (taskId: string) => {
      try {
        await queueTaskDelete(user?.id, taskId)
      } catch (err) {
        console.error('Failed to delete task via API', err)
        showError(
          t('toast.api.taskDeleteFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return
      }

      dispatch(taskActions.delete(taskId))
      void refreshUnlockedAchievements(dispatch)
      success(
        t('toast.taskDeletedTitle' as TranslationKey),
        t('toast.taskDeletedBody' as TranslationKey),
      )
    }, [dispatch, success, showError, t, user]),

    toggleTask: useCallback(async (taskId: string) => {
      const existing = state.tasks.find(t => t.id === taskId)
      if (!existing) {
        return
      }

      const newCompleted = !existing.completed

      try {
        const updatedTask = await queueTaskUpdate(user?.id, taskId, {
          completed: newCompleted,
        })

        if (updatedTask) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
          void refreshUnlockedAchievements(dispatch)
          return
        }
      } catch (err) {
        console.error('Failed to toggle task via API', err)
        showError(
          t('toast.api.taskStatusFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return
      }

      // If the API fails, keep local state unchanged.
    }, [dispatch, showError, state.tasks, t, user]),

    assignTask: useCallback(async (taskId: string, userId: string | null) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      try {
        const updatedTask = await queueTaskUpdate(user?.id, taskId, {
          assigneeId: userId,
        })
        if (updatedTask) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        }
        success(
          t('toast.taskAssignedTitle' as TranslationKey),
          userId
            ? t('toast.taskAssignedBody' as TranslationKey)
            : t('toast.taskAssignmentRemovedBody' as TranslationKey),
        )
      } catch (err) {
        console.error('Failed to assign task via API', err)
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, showError, state.tasks, success, t, user]),

    addComment: useCallback(async (taskId: string, comment: Comment) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return
      const comments = [...(existing.comments ?? []), comment]
      try {
        const updatedTask = (await queueTaskUpdate(user?.id, taskId, { comments })) ?? {
          ...existing,
          comments,
        }
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        success(
          t('toast.commentAddedTitle' as TranslationKey),
          t('toast.commentAddedBody' as TranslationKey),
        )
      } catch (err) {
        console.error('Failed to add comment via API', err)
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, showError, state.tasks, success, t, user]),

    reorderTasks: useCallback(async (draggedId: string, droppedOnId: string) => {
      const before = state.tasks
      const userId = user?.id
      const isOwnedTask = (task: Task) => {
        const list = state.lists.find((l) => l.id === task.listId)
        if (!list?.ownerUserId || !userId) return true
        return list.ownerUserId === userId
      }

      const dragged = before.find((t) => t.id === draggedId)
      if (!dragged || !isOwnedTask(dragged)) return

      dispatch(taskActions.reorder(draggedId, droppedOnId))

      const ownedBefore = before.filter(isOwnedTask)
      // Must match reducer / arrayMove: use original target index (no -1 on drag-down).
      // The old `droppedIndex - 1` when dragging down undid adjacent moves after API sync.
      const reorderedOwned = moveItemById(ownedBefore, draggedId, droppedOnId)
      if (reorderedOwned === ownedBefore) return

      try {
        const tasks = await tasksApi.reorderTasks(reorderedOwned.map((t) => t.id))
        if (tasks.length > 0) {
          const sharedTasks = before.filter((t) => !isOwnedTask(t))
          dispatch({ type: 'SET_TASKS', payload: [...tasks, ...sharedTasks] })
        }
      } catch (err) {
        console.error('Failed to reorder tasks via API', err)
        dispatch({ type: 'SET_TASKS', payload: before })
        showError(
          t('toast.api.taskReorderFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, showError, state.lists, state.tasks, t, user]),

    syncSubtasks: useCallback(async (taskId: string, subtasks: import('@/types').Subtask[]) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      try {
        const updatedTask = (await queueTaskUpdate(user?.id, taskId, { subtasks })) ?? {
          ...existing,
          subtasks,
        }

        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      } catch (err) {
        console.error('Failed to update subtasks via API', err)
        showError(
          t('toast.api.subtasksUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, showError, state.tasks, t, user]),

    syncComments: useCallback(async (taskId: string, comments: Comment[]) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      try {
        const updatedTask = (await queueTaskUpdate(user?.id, taskId, { comments })) ?? {
          ...existing,
          comments,
        }

        dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
      } catch (err) {
        console.error('Failed to update comments via API', err)
        showError(
          t('toast.api.commentsUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, showError, state.tasks, t, user]),

    moveToColumn: useCallback((taskId: string, newColumnId: string, listId: string) => {
      dispatch(taskActions.moveToColumn(taskId, newColumnId, listId))
    }, [dispatch]),

    moveTaskToColumn: useCallback(async (taskId: string, newColumnId: string, listId: string) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      const before = existing
      dispatch(taskActions.moveToColumn(taskId, newColumnId, listId))

      try {
        const updatedTask = await queueTaskUpdate(user?.id, taskId, {
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
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, showError, state.tasks, t, user]),

    deleteTag: useCallback(async (tagName: string) => {
      const tagToDelete = tagName.trim()
      if (!tagToDelete) return false

      const affectedTasks = state.tasks.filter((task) =>
        task.tags.some((tag) => tag === tagToDelete),
      )

      dispatch({ type: 'DELETE_TAG', payload: tagToDelete })

      if (affectedTasks.length === 0) return true

      try {
        const updates = await Promise.all(
          affectedTasks.map(async (task) => {
            const tags = task.tags.filter((tag) => tag !== tagToDelete)
            const updated =
              (await queueTaskUpdate(user?.id, task.id, { tags })) ?? { ...task, tags }
            return updated
          }),
        )

        for (const updatedTask of updates) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
        }
        return true
      } catch (err) {
        console.error('Failed to delete tag via API', err)
        await syncFromBackend()
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return false
      }
    }, [dispatch, showError, state.tasks, syncFromBackend, t, user]),
  }
}

async function persistBoardColumns(columns: Column[], touchedListId?: string): Promise<void> {
  // Merge by listId against remote so other tabs editing different lists are not clobbered.
  const remotePayload = await settingsApi.fetchSettings()
  const remoteColumns = Array.isArray(
    (remotePayload as { boardColumns?: Column[] } | null)?.boardColumns,
  )
    ? ((remotePayload as { boardColumns: Column[] }).boardColumns)
    : []

  const localByList = new Map<string, Column[]>()
  for (const column of columns) {
    const bucket = localByList.get(column.listId) ?? []
    bucket.push(column)
    localByList.set(column.listId, bucket)
  }

  const touched = touchedListId
    ? new Set([touchedListId])
    : new Set(localByList.keys())

  const merged: Column[] = []
  const seenLists = new Set<string>()

  for (const listId of touched) {
    const localCols = localByList.get(listId) ?? []
    merged.push(...localCols)
    seenLists.add(listId)
  }

  for (const column of remoteColumns) {
    if (seenLists.has(column.listId)) continue
    merged.push(column)
  }

  // Include any other local lists not already written (first hydrate)
  for (const [listId, cols] of localByList) {
    if (seenLists.has(listId)) continue
    merged.push(...cols)
  }

  await settingsApi.updateBoardColumns(merged)
}

export function useColumnActions() {
  const { state, dispatch, syncFromBackend } = useTaskManager()
  const { error: showError } = useToast()
  const { t } = useI18n()
  const { user } = useUser()

  const applyColumnChange = useCallback(
    async (action: Action, touchedListId?: string) => {
      const nextColumns = columnReducer(state, action).columns
      dispatch(action)

      try {
        await persistBoardColumns(nextColumns, touchedListId)
      } catch (err) {
        console.error('Failed to persist board columns via API', err)
        await syncFromBackend()
        showError(
          t('toast.api.taskUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
      }
    },
    [dispatch, showError, state, syncFromBackend, t],
  )

  return {
    addColumn: useCallback(
      (listId: string, name: string) =>
        applyColumnChange({ type: 'ADD_COLUMN', payload: { listId, name } }, listId),
      [applyColumnChange],
    ),
    updateColumn: useCallback(
      (columnId: string, name: string) => {
        const column = state.columns.find((c) => c.id === columnId)
        return applyColumnChange(
          { type: 'UPDATE_COLUMN', payload: { columnId, name } },
          column?.listId,
        )
      },
      [applyColumnChange, state.columns],
    ),
    deleteColumn: useCallback(
      async (columnId: string, listId: string) => {
        const action = { type: 'DELETE_COLUMN', payload: { columnId, listId } } as const
        const nextState = columnReducer(state, action)
        const affectedTasks = state.tasks.filter((task) => task.columnId === columnId)

        dispatch(action)

        try {
          await persistBoardColumns(nextState.columns, listId)
          await Promise.all(
            affectedTasks.map(async (task) => {
              const updatedTask = nextState.tasks.find((t) => t.id === task.id)
              if (!updatedTask) return
              const saved = await queueTaskUpdate(user?.id, task.id, {
                columnId: updatedTask.columnId ?? null,
              })
              if (saved) {
                dispatch({ type: 'UPDATE_TASK', payload: saved })
              }
            }),
          )
        } catch (err) {
          console.error('Failed to delete column via API', err)
          await syncFromBackend()
          showError(
            t('toast.api.taskUpdateFailedTitle' as TranslationKey),
            t('common.errorBody' as TranslationKey),
          )
        }
      },
      [dispatch, showError, state, syncFromBackend, t, user],
    ),
    reorderColumns: useCallback(
      (listId: string, draggedId: string, droppedOnId: string) =>
        applyColumnChange(
          {
            type: 'REORDER_COLUMNS',
            payload: { listId, draggedId, droppedOnId },
          },
          listId,
        ),
      [applyColumnChange],
    ),
  }
}

export function useListActions() {
  const { dispatch } = useTaskManager()
  const { error: showError } = useToast()
  const { t } = useI18n()

  return {
    addList: useCallback(async (list: Omit<List, 'id'>) => {
      try {
        const createdList = await listsApi.createList(list)

        if (createdList) {
          dispatch({ type: 'ADD_LIST', payload: createdList })
          return true
        }
        return false
      } catch (err) {
        console.error('Failed to create list via API', err)
        showError(
          t('toast.api.listCreateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return false
      }
    }, [dispatch, showError, t]),

    updateList: useCallback(async (list: Pick<List, 'id'> & Partial<Pick<List, 'name' | 'color'>>) => {
      try {
        // Do not send members here — rename must not clobber concurrent share changes.
        const updatedList =
          (await listsApi.updateList({
            id: list.id,
            name: list.name,
            color: list.color,
          })) ?? null

        if (updatedList) {
          dispatch({ type: 'UPDATE_LIST', payload: updatedList })
          return true
        }
        return false
      } catch (err) {
        console.error('Failed to update list via API', err)
        showError(
          t('toast.api.listUpdateFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return false
      }
    }, [dispatch, showError, t]),

    deleteList: useCallback(async (listId: string) => {
      try {
        await listsApi.deleteList(listId)
      } catch (err) {
        console.error('Failed to delete list via API', err)
        showError(
          t('toast.api.listDeleteFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return false
      }

      dispatch(listActions.delete(listId))
      return true
    }, [dispatch, showError, t]),

    shareList: useCallback(async (listId: string, userId: string): Promise<boolean> => {
      try {
        const updatedList = await listsApi.addListMember(listId, userId)
        if (!updatedList) return false

        dispatch({ type: 'UPDATE_LIST', payload: updatedList })
        return true
      } catch (err) {
        console.error('Failed to share list via API', err)
        showError(
          t('toast.api.listShareFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return false
      }
    }, [dispatch, showError, t]),

    unshareList: useCallback(async (listId: string, userId: string): Promise<boolean> => {
      try {
        const updatedList = await listsApi.removeListMember(listId, userId)
        if (!updatedList) return false

        dispatch({ type: 'UPDATE_LIST', payload: updatedList })
        return true
      } catch (err) {
        console.error('Failed to unshare list via API', err)
        showError(
          t('toast.api.listUnshareFailedTitle' as TranslationKey),
          t('common.errorBody' as TranslationKey),
        )
        return false
      }
    }, [dispatch, showError, t]),
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
          t('common.errorBody' as TranslationKey),
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
          t('common.errorBody' as TranslationKey),
        )
      }
    }, [dispatch, showError, t]),

    toggleHabitCompletion: useCallback(async (habitId: string, date: string) => {
      const existing = state.habits.find((h) => h.id === habitId)
      if (!existing) return

      const lockKey = `${habitId}:${date}`
      if (habitToggleInFlight.has(lockKey)) return
      habitToggleInFlight.add(lockKey)

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
          t('common.errorBody' as TranslationKey),
        )
        return
      } finally {
        habitToggleInFlight.delete(lockKey)
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
          t('common.errorBody' as TranslationKey),
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
