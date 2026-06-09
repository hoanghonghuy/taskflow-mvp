"use client"

import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { useI18n } from '@/lib/hooks/use-i18n'
import { taskActions, listActions, habitActions, pomodoroActions } from '@/lib/store/task-manager/actions'
import { historyReducer } from '@/lib/store/task-manager/history-reducer'
import { INITIAL_STATE } from '@/lib/store/task-manager/initial-state'
import { useToast } from '@/lib/hooks/use-toast'
import { useUser } from './user-provider'
import type { Task, List, Habit, Comment, PomodoroState, AppState, Priority, CountdownEvent, FocusSession, RecurrencePattern } from '@/types'
import type { TaskManagerContextType } from '@/lib/store/task-manager/types'
import type { TranslationKey } from '@/lib/i18n/types'
// Note: mock data has been disabled now that we have a real backend

interface HistoryState {
  past: AppState[]
  present: AppState
  future: AppState[]
}

function normalizePriority(value: unknown): Priority {
  if (typeof value !== 'string') {
    return 'none'
  }

  const lower = value.toLowerCase()
  if (lower === 'low' || lower === 'medium' || lower === 'high' || lower === 'urgent') {
    return lower
  }

  return 'none'
}

function mapTasksFromApi(items: unknown[]): Task[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = item as any

    const id = String(t.id ?? t.Id ?? '')
    const title = String(t.title ?? t.Title ?? '')
    const description = String(t.description ?? t.Description ?? '')
    const completed = Boolean(t.completed ?? t.Completed ?? false)
    const createdRaw = t.createdAt ?? t.CreatedAt
    const createdAt = createdRaw ? new Date(createdRaw).toISOString() : undefined
    const dueRaw = t.dueDate ?? t.DueDate
    const dueDate = dueRaw ? new Date(dueRaw).toISOString() : undefined
    const priority = normalizePriority(t.priority ?? t.Priority)
    const listId = String(t.listId ?? t.ListId ?? 'inbox')
    const tags = Array.isArray(t.tags ?? t.Tags) ? (t.tags ?? t.Tags) as string[] : []
    const columnRaw = t.columnId ?? t.ColumnId
    const columnId = columnRaw ? String(columnRaw) : undefined

    const recurrenceRaw = t.recurrence ?? t.Recurrence
    let recurrence: RecurrencePattern | undefined
    if (recurrenceRaw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = recurrenceRaw as any
      const typeRaw: string = (r.type ?? r.Type ?? 'daily').toString().toLowerCase()
      const type: RecurrencePattern['type'] =
        typeRaw === 'weekly' ? 'weekly' : typeRaw === 'monthly' ? 'monthly' : 'daily'

      const interval = typeof r.interval === 'number'
        ? r.interval
        : typeof r.Interval === 'number'
          ? r.Interval
          : 1

      const daysRaw = r.daysOfWeek ?? r.DaysOfWeek
      const daysOfWeek = Array.isArray(daysRaw)
        ? (daysRaw as Array<number | string>)
            .map((d) => Number(d))
            .filter((n) => !Number.isNaN(n))
        : undefined

      const endRaw = r.endDate ?? r.EndDate
      const endDate = endRaw ? new Date(endRaw).toISOString() : undefined

      recurrence = {
        type,
        interval: interval > 0 ? interval : 1,
        ...(daysOfWeek && daysOfWeek.length > 0 ? { daysOfWeek } : {}),
        ...(endDate ? { endDate } : {}),
      }
    }

    const reminderMinutes = typeof t.reminderMinutes === 'number'
      ? t.reminderMinutes
      : typeof t.ReminderMinutes === 'number'
        ? t.ReminderMinutes
        : undefined

    const assigneeRaw = t.assigneeId ?? t.AssigneeId
    const assigneeId = assigneeRaw != null && assigneeRaw !== '' ? String(assigneeRaw) : null

    const subtasksRaw = t.subtasks ?? t.Subtasks
    const subtasks = Array.isArray(subtasksRaw)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (subtasksRaw as any[])
          .map((s) => {
            const sid = String(s.id ?? s.Id ?? '')
            if (!sid) return null
            return {
              id: sid,
              title: String(s.title ?? s.Title ?? ''),
              completed: Boolean(s.completed ?? s.Completed ?? false),
            }
          })
          .filter((st): st is import('@/types').Subtask => st !== null)
      : []

    const commentsRaw = t.comments ?? t.Comments
    const comments = Array.isArray(commentsRaw)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (commentsRaw as any[]).map((c) => {
          const tsRaw = c.timestamp ?? c.Timestamp
          const ts = tsRaw ? new Date(tsRaw).toISOString() : new Date().toISOString()
          return {
            id: String(c.id ?? c.Id ?? ''),
            userId: String(c.userId ?? c.UserId ?? ''),
            content: String(c.content ?? c.Content ?? ''),
            timestamp: ts,
          }
        })
      : []

    return {
      id,
      title,
      description,
      completed,
      completedAt: undefined,
      dueDate,
      priority,
      listId,
      columnId,
      tags,
      subtasks,
      recurrence,
      reminderMinutes,
      assigneeId,
      comments,
      createdAt,
      totalFocusTime: undefined,
    }
  })
}

function mapListsFromApi(items: unknown[]): List[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l = item as any

    const id = String(l.id ?? l.Id ?? '')
    const name = String(l.name ?? l.Name ?? '')
    const color = String(l.color ?? l.Color ?? '#3b82f6')
    const members = Array.isArray(l.members ?? l.Members) ? (l.members ?? l.Members) as string[] : []

    return {
      id,
      name,
      color,
      members,
    }
  })
}

function mapHabitsFromApi(items: unknown[]): Habit[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = item as any

    const id = String(h.id ?? h.Id ?? '')
    const name = String(h.name ?? h.Name ?? '')
    const completions = Array.isArray(h.completions ?? h.Completions)
      ? (h.completions ?? h.Completions) as string[]
      : []
    const createdRaw = h.createdAt ?? h.CreatedAt
    const createdAt = createdRaw ? new Date(createdRaw).toISOString() : new Date().toISOString()

    return {
      id,
      name,
      completions,
      createdAt,
    }
  })
}

function mapCountdownsFromApi(items: unknown[]): CountdownEvent[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = item as any

    const id = String(c.id ?? c.Id ?? '')
    const title = String(c.title ?? c.Title ?? '')
    const targetRaw = c.targetDate ?? c.TargetDate
    const targetDate = targetRaw ? new Date(targetRaw).toISOString() : new Date().toISOString()
    const color = String(c.color ?? c.Color ?? '#3b82f6')
    const createdRaw = c.createdAt ?? c.CreatedAt
    const createdAt = createdRaw ? new Date(createdRaw).toISOString() : new Date().toISOString()

    return {
      id,
      title,
      targetDate,
      color,
      createdAt,
    }
  })
}

function mapFocusSessionsFromApi(items: unknown[]): FocusSession[] {
  return items
    .map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = item as any

      const typeRaw = s.type ?? s.Type
      const type = typeof typeRaw === 'string' ? typeRaw.toLowerCase() : ''
      if (type !== 'focus') {
        return null
      }

      const startRaw = s.startTime ?? s.StartTime
      const startTime = startRaw ? new Date(startRaw).toISOString() : new Date().toISOString()
      const duration = typeof s.durationSeconds === 'number'
        ? s.durationSeconds
        : typeof s.DurationSeconds === 'number'
          ? s.DurationSeconds
          : 0

      const taskIdRaw = s.taskId ?? s.TaskId
      const habitIdRaw = s.habitId ?? s.HabitId

      const session: FocusSession = {
        startTime,
        duration,
      }

      if (taskIdRaw) {
        session.taskId = String(taskIdRaw)
      }

      if (habitIdRaw) {
        session.habitId = String(habitIdRaw)
      }

      return session
    })
    .filter((s): s is FocusSession => s !== null)
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
        const [tasksRes, listsRes, habitsRes, countdownRes] = await Promise.all([
          fetch('/api/tasks'),
          fetch('/api/lists'),
          fetch('/api/habits'),
          fetch('/api/countdown'),
        ])

        if (!tasksRes.ok || !listsRes.ok || !habitsRes.ok || !countdownRes.ok) {
          return
        }

        const [tasksJson, listsJson, habitsJson, countdownJson] = await Promise.all([
          tasksRes.json(),
          listsRes.json(),
          habitsRes.json(),
          countdownRes.json(),
        ])

        const tasks = Array.isArray(tasksJson) ? mapTasksFromApi(tasksJson) : []
        const lists = Array.isArray(listsJson) ? mapListsFromApi(listsJson) : []
        const habits = Array.isArray(habitsJson) ? mapHabitsFromApi(habitsJson) : []
        const countdownEvents = Array.isArray(countdownJson) ? mapCountdownsFromApi(countdownJson) : []

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
          const achievementsRes = await fetch('/api/profile/achievements')
          if (achievementsRes.ok) {
            const achievementsJson = await achievementsRes.json().catch(() => null)
            if (Array.isArray(achievementsJson)) {
              unlockedAchievements = achievementsJson.filter((id): id is string => typeof id === 'string')
            }
          }
        } catch (error) {
          console.error('Failed to load achievements from backend', error)
        }

        try {
          const sessionsRes = await fetch('/api/pomodoro/sessions')
          if (sessionsRes.ok) {
            const sessionsJson = await sessionsRes.json().catch(() => null)
            if (Array.isArray(sessionsJson)) {
              focusHistory = mapFocusSessionsFromApi(sessionsJson)
            }
          }
        } catch (error) {
          console.error('Failed to load pomodoro sessions from backend', error)
        }

        try {
          const stateRes = await fetch('/api/pomodoro/state')
          if (stateRes.ok && stateRes.status !== 204) {
            const stateJson = await stateRes.json().catch(() => null)
            if (stateJson && typeof stateJson === 'object') {
              const rawSession = String((stateJson.currentSession ?? stateJson.CurrentSession ?? 'focus')).toLowerCase()
              const currentSession: PomodoroState['currentSession'] =
                rawSession === 'shortbreak'
                  ? 'shortBreak'
                  : rawSession === 'longbreak'
                    ? 'longBreak'
                    : 'focus'

              const remainingSeconds = typeof stateJson.remainingSeconds === 'number'
                ? stateJson.remainingSeconds
                : typeof stateJson.RemainingSeconds === 'number'
                  ? stateJson.RemainingSeconds
                  : pomodoroState.remainingTime

              const sessionsCompleted = typeof stateJson.sessionsCompleted === 'number'
                ? stateJson.sessionsCompleted
                : typeof stateJson.SessionsCompleted === 'number'
                  ? stateJson.SessionsCompleted
                  : pomodoroState.sessionsCompleted

              pomodoroState = {
                ...pomodoroState,
                isActive: Boolean(stateJson.isActive ?? stateJson.IsActive ?? pomodoroState.isActive),
                isPaused: Boolean(stateJson.isPaused ?? stateJson.IsPaused ?? pomodoroState.isPaused),
                remainingTime: remainingSeconds >= 0 ? remainingSeconds : pomodoroState.remainingTime,
                currentSession,
                focusedTaskId: (stateJson.focusedTaskId ?? stateJson.FocusedTaskId ?? pomodoroState.focusedTaskId) || null,
                focusedHabitId: (stateJson.focusedHabitId ?? stateJson.FocusedHabitId ?? pomodoroState.focusedHabitId) || null,
                sessionsCompleted,
              }
            }
          }
        } catch (error) {
          console.error('Failed to load pomodoro state from backend', error)
        }

        const activeListId =
          lists.find((l) => l.id === 'inbox')?.id ??
          lists[0]?.id ??
          historyState.present.activeListId

        const nextState: AppState = {
          ...historyState.present,
          tasks,
          lists,
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
        void fetch('/api/pomodoro/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: current.isActive,
            isPaused: current.isPaused,
            remainingSeconds: current.remainingTime,
            currentSession: current.currentSession,
            focusedTaskId: current.focusedTaskId,
            focusedHabitId: current.focusedHabitId,
            sessionsCompleted: current.sessionsCompleted,
          }),
          // Hint to the browser that this request should be allowed to complete
          // even if the page is unloading.
          keepalive: true,
        })
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

    void (async () => {
      try {
        await fetch('/api/pomodoro/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: current.isActive,
            isPaused: current.isPaused,
            remainingSeconds: current.remainingTime,
            currentSession: current.currentSession,
            focusedTaskId: current.focusedTaskId,
            focusedHabitId: current.focusedHabitId,
            sessionsCompleted: current.sessionsCompleted,
          }),
        })
      } catch (error) {
        console.error('Failed to sync pomodoro state to backend', error)
      }
    })()
  }, [historyState.present.pomodoro, isAuthenticated])

  // Ensure pomodoro state is saved when the user logs out
  useEffect(() => {
    if (wasAuthenticatedRef.current && !isAuthenticated) {
      const current = historyState.present.pomodoro

      try {
        void fetch('/api/pomodoro/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isActive: current.isActive,
            isPaused: current.isPaused,
            remainingSeconds: current.remainingTime,
            currentSession: current.currentSession,
            focusedTaskId: current.focusedTaskId,
            focusedHabitId: current.focusedHabitId,
            sessionsCompleted: current.sessionsCompleted,
          }),
          keepalive: true,
        })
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
  const { state, dispatch } = useTaskManager()
  const { success, error: showError } = useToast()
  const { t } = useI18n()

  return {
    addTask: useCallback(async (task: Omit<Task, 'id'>) => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ?? null,
            priority: task.priority,
            listId: task.listId,
            columnId: null,
            tags: task.tags ?? [],
            recurrence: task.recurrence ?? null,
            reminderMinutes: typeof task.reminderMinutes === 'number' ? task.reminderMinutes : null,
            assigneeId: task.assigneeId ?? null,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create task: ${response.status}`)
        }

        const createdJson = await response.json()
        const mapped = mapTasksFromApi([createdJson])
        const createdTask = mapped[0] ?? null

        if (createdTask) {
          dispatch({ type: 'ADD_TASK', payload: createdTask })
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
        const response = await fetch(`/api/tasks/${encodeURIComponent(task.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            completed: task.completed,
            dueDate: task.dueDate ?? null,
            priority: task.priority,
            listId: task.listId,
            columnId: null,
            tags: task.tags ?? [],
            subtasks: task.subtasks ?? [],
            comments: task.comments ?? [],
            recurrence: task.recurrence ?? null,
            reminderMinutes: task.reminderMinutes ?? null,
            assigneeId: task.assigneeId ?? null,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update task: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapTasksFromApi([updatedJson])
        const updatedTask = mapped[0] ?? task

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
      // Note: We can't get the task title here without accessing state
      // This is a limitation of the current action structure
      try {
        const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: 'DELETE',
        })

        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to delete task: ${response.status}`)
        }
      } catch (err) {
        console.error('Failed to delete task via API', err)
        showError(
          t('toast.api.taskDeleteFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      dispatch(taskActions.delete(taskId))
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
        const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: newCompleted }),
        })

        if (!response.ok) {
          throw new Error(`Failed to toggle task completion: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapTasksFromApi([updatedJson])
        const updatedTask = mapped[0]

        if (updatedTask) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
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

    syncSubtasks: useCallback(async (taskId: string, subtasks: import('@/types').Subtask[]) => {
      const existing = state.tasks.find((t) => t.id === taskId)
      if (!existing) return

      try {
        const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subtasks }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update subtasks: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapTasksFromApi([updatedJson])
        const updatedTask = mapped[0] ?? { ...existing, subtasks }

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
        const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comments }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update comments: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapTasksFromApi([updatedJson])
        const updatedTask = mapped[0] ?? { ...existing, comments }

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

      try {
        const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            columnId: null,
            listId,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to move task to column: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapTasksFromApi([updatedJson])
        const updatedTask = mapped[0]

        if (updatedTask) {
          dispatch({ type: 'UPDATE_TASK', payload: updatedTask })
          return
        }
      } catch (err) {
        console.error('Failed to move task to column via API', err)
        showError(
          t('toast.api.taskMoveFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      // If the API fails, keep local state unchanged.
    }, [dispatch, showError, state.tasks, t]),
  }
}

export function useListActions() {
  const { state, dispatch } = useTaskManager()
  const { error: showError } = useToast()
  const { t } = useI18n()

  return {
    addList: useCallback(async (list: Omit<List, 'id'>) => {
      try {
        const response = await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: list.name,
            color: list.color,
            members: list.members ?? [],
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create list: ${response.status}`)
        }

        const createdJson = await response.json()
        const mapped = mapListsFromApi([createdJson])
        const createdList = mapped[0]

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
        const response = await fetch(`/api/lists/${encodeURIComponent(list.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: list.name,
            color: list.color,
            members: list.members ?? [],
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update list: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapListsFromApi([updatedJson])
        const updatedList = mapped[0] ?? list

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
        const response = await fetch(`/api/lists/${encodeURIComponent(listId)}`, {
          method: 'DELETE',
        })

        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to delete list: ${response.status}`)
        }
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

    shareList: useCallback(async (listId: string, userId: string) => {
      const existing = state.lists.find((l) => l.id === listId)
      if (!existing) return

      const nextMembers = existing.members.includes(userId)
        ? existing.members
        : [...existing.members, userId]

      try {
        const response = await fetch(`/api/lists/${encodeURIComponent(listId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: existing.name,
            color: existing.color,
            members: nextMembers,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to share list: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapListsFromApi([updatedJson])
        const updatedList = mapped[0] ?? { ...existing, members: nextMembers }

        dispatch({ type: 'UPDATE_LIST', payload: updatedList })
      } catch (err) {
        console.error('Failed to share list via API', err)
        showError(
          t('toast.api.listShareFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
      }
    }, [dispatch, showError, state.lists, t]),

    unshareList: useCallback(async (listId: string, userId: string) => {
      const existing = state.lists.find((l) => l.id === listId)
      if (!existing) return

      const nextMembers = existing.members.filter((id) => id !== userId)

      try {
        const response = await fetch(`/api/lists/${encodeURIComponent(listId)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: existing.name,
            color: existing.color,
            members: nextMembers,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to unshare list: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapListsFromApi([updatedJson])
        const updatedList = mapped[0] ?? { ...existing, members: nextMembers }

        dispatch({ type: 'UPDATE_LIST', payload: updatedList })
      } catch (err) {
        console.error('Failed to unshare list via API', err)
        showError(
          t('toast.api.listUnshareFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
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
        const response = await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: habit.name,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to create habit: ${response.status}`)
        }

        const createdJson = await response.json()
        const mapped = mapHabitsFromApi([createdJson])
        const createdHabit = mapped[0]

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
        const response = await fetch(`/api/habits/${encodeURIComponent(habit.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: habit.name,
          }),
        })

        if (!response.ok) {
          throw new Error(`Failed to update habit: ${response.status}`)
        }

        const updatedJson = await response.json()
        const mapped = mapHabitsFromApi([updatedJson])
        const updatedHabit = mapped[0] ?? habit

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
          const response = await fetch(`/api/habits/${encodeURIComponent(habitId)}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ date }),
          })

          if (!response.ok) {
            throw new Error(`Failed to complete habit for date: ${response.status}`)
          }
        } else {
          const response = await fetch(`/api/habits/${encodeURIComponent(habitId)}/complete?date=${encodeURIComponent(date)}`, {
            method: 'DELETE',
          })

          if (!response.ok && response.status !== 404) {
            throw new Error(`Failed to uncomplete habit for date: ${response.status}`)
          }
        }
      } catch (err) {
        console.error('Failed to toggle habit completion via API', err)
        showError(
          t('toast.api.habitCompletionFailedTitle' as TranslationKey),
          err instanceof Error ? err.message : undefined,
        )
        return
      }

      // Only toggle locally if backend call succeeded
      dispatch(habitActions.toggleCompletion(habitId, date))
    }, [dispatch, showError, state.habits, t]),

    deleteHabit: useCallback(async (habitId: string) => {
      try {
        const response = await fetch(`/api/habits/${encodeURIComponent(habitId)}`, {
          method: 'DELETE',
        })

        if (!response.ok && response.status !== 404) {
          throw new Error(`Failed to delete habit: ${response.status}`)
        }
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
