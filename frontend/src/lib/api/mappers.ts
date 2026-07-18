import type {
  CountdownEvent,
  FocusSession,
  Habit,
  List,
  PomodoroState,
  Priority,
  RecurrencePattern,
  Subtask,
  Task,
} from '@/types'

function normalizePriority(value: unknown): Priority {
  if (typeof value !== 'string') return 'none'
  const lower = value.toLowerCase()
  if (lower === 'low' || lower === 'medium' || lower === 'high' || lower === 'urgent') {
    return lower
  }
  return 'none'
}

export function mapTasksFromApi(items: unknown[]): Task[] {
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
    const tags = Array.isArray(t.tags ?? t.Tags) ? ((t.tags ?? t.Tags) as string[]) : []
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

      const interval =
        typeof r.interval === 'number'
          ? r.interval
          : typeof r.Interval === 'number'
            ? r.Interval
            : 1

      const daysRaw = r.daysOfWeek ?? r.DaysOfWeek
      const daysOfWeek = Array.isArray(daysRaw)
        ? (daysRaw as Array<number | string>).map((d) => Number(d)).filter((n) => !Number.isNaN(n))
        : undefined

      const endRaw = r.endDate ?? r.EndDate
      const endDate = endRaw ? new Date(endRaw).toISOString() : undefined

      const completedDatesRaw = r.completedDates ?? r.CompletedDates
      const completedDates = Array.isArray(completedDatesRaw)
        ? (completedDatesRaw as unknown[])
            .map((d) => String(d))
            .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        : undefined

      const seriesStartRaw = r.seriesStart ?? r.SeriesStart
      const seriesStart = seriesStartRaw
        ? String(seriesStartRaw).slice(0, 10)
        : undefined

      recurrence = {
        type,
        interval: interval > 0 ? interval : 1,
        ...(daysOfWeek && daysOfWeek.length > 0 ? { daysOfWeek } : {}),
        ...(endDate ? { endDate } : {}),
        ...(seriesStart ? { seriesStart } : {}),
        ...(completedDates && completedDates.length > 0 ? { completedDates } : {}),
      }
    }

    const reminderMinutes =
      typeof t.reminderMinutes === 'number'
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
          .filter((st): st is Subtask => st !== null)
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
      completedAt: (() => {
        const raw = t.completedAt ?? t.CompletedAt
        return raw ? new Date(String(raw)).toISOString() : undefined
      })(),
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
      totalFocusTime:
        typeof t.totalFocusTime === 'number'
          ? t.totalFocusTime
          : typeof t.TotalFocusTime === 'number'
            ? t.TotalFocusTime
            : 0,
      sortOrder:
        typeof t.sortOrder === 'number'
          ? t.sortOrder
          : typeof t.SortOrder === 'number'
            ? t.SortOrder
            : undefined,
    }
  })
}

export function mapListsFromApi(items: unknown[]): List[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const l = item as any
    return {
      id: String(l.id ?? l.Id ?? ''),
      name: String(l.name ?? l.Name ?? ''),
      color: String(l.color ?? l.Color ?? '#3b82f6'),
      members: Array.isArray(l.members ?? l.Members) ? ((l.members ?? l.Members) as string[]) : [],
      ownerUserId:
        l.ownerUserId != null
          ? String(l.ownerUserId)
          : l.OwnerUserId != null
            ? String(l.OwnerUserId)
            : l.userId != null
              ? String(l.userId)
              : l.UserId != null
                ? String(l.UserId)
                : undefined,
    }
  })
}

export function mapHabitsFromApi(items: unknown[]): Habit[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const h = item as any
    const createdRaw = h.createdAt ?? h.CreatedAt
    return {
      id: String(h.id ?? h.Id ?? ''),
      name: String(h.name ?? h.Name ?? ''),
      completions: Array.isArray(h.completions ?? h.Completions)
        ? ((h.completions ?? h.Completions) as string[])
        : [],
      createdAt: createdRaw ? new Date(createdRaw).toISOString() : new Date().toISOString(),
    }
  })
}

export function mapCountdownsFromApi(items: unknown[]): CountdownEvent[] {
  return items.map((item) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = item as any
    const targetRaw = c.targetDate ?? c.TargetDate
    const createdRaw = c.createdAt ?? c.CreatedAt
    return {
      id: String(c.id ?? c.Id ?? ''),
      title: String(c.title ?? c.Title ?? ''),
      targetDate: targetRaw ? new Date(targetRaw).toISOString() : new Date().toISOString(),
      color: String(c.color ?? c.Color ?? '#3b82f6'),
      createdAt: createdRaw ? new Date(createdRaw).toISOString() : new Date().toISOString(),
    }
  })
}

export function mapFocusSessionsFromApi(items: unknown[]): FocusSession[] {
  return items
    .map((item) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = item as any
      const typeRaw = s.type ?? s.Type
      const type = typeof typeRaw === 'string' ? typeRaw.toLowerCase() : ''
      if (type !== 'focus') return null

      const startRaw = s.startTime ?? s.StartTime
      const duration =
        typeof s.durationSeconds === 'number'
          ? s.durationSeconds
          : typeof s.DurationSeconds === 'number'
            ? s.DurationSeconds
            : 0

      const session: FocusSession = {
        startTime: startRaw ? new Date(startRaw).toISOString() : new Date().toISOString(),
        duration,
      }

      const taskIdRaw = s.taskId ?? s.TaskId
      const habitIdRaw = s.habitId ?? s.HabitId
      if (taskIdRaw) session.taskId = String(taskIdRaw)
      if (habitIdRaw) session.habitId = String(habitIdRaw)

      return session
    })
    .filter((s): s is FocusSession => s !== null)
}

export function mapPomodoroStateFromApi(
  stateJson: unknown,
  fallback: PomodoroState,
): Partial<PomodoroState> | null {
  if (!stateJson || typeof stateJson !== 'object') return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = stateJson as any
  const rawSession = String(raw.currentSession ?? raw.CurrentSession ?? 'focus').toLowerCase()
  const currentSession: PomodoroState['currentSession'] =
    rawSession === 'shortbreak'
      ? 'shortBreak'
      : rawSession === 'longbreak'
        ? 'longBreak'
        : 'focus'

  const remainingSeconds =
    typeof raw.remainingSeconds === 'number'
      ? raw.remainingSeconds
      : typeof raw.RemainingSeconds === 'number'
        ? raw.RemainingSeconds
        : fallback.remainingTime

  const sessionsCompleted =
    typeof raw.sessionsCompleted === 'number'
      ? raw.sessionsCompleted
      : typeof raw.SessionsCompleted === 'number'
        ? raw.SessionsCompleted
        : fallback.sessionsCompleted

  return {
    isActive: Boolean(raw.isActive ?? raw.IsActive ?? fallback.isActive),
    isPaused: Boolean(raw.isPaused ?? raw.IsPaused ?? fallback.isPaused),
    remainingTime: remainingSeconds >= 0 ? remainingSeconds : fallback.remainingTime,
    currentSession,
    focusedTaskId: (raw.focusedTaskId ?? raw.FocusedTaskId ?? fallback.focusedTaskId) || null,
    focusedHabitId: (raw.focusedHabitId ?? raw.FocusedHabitId ?? fallback.focusedHabitId) || null,
    sessionsCompleted,
  }
}

export function readPomodoroUpdatedAt(stateJson: unknown): string | null {
  if (!stateJson || typeof stateJson !== 'object') return null
  const raw = stateJson as { updatedAt?: unknown }
  return typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : null
}

export function pomodoroStateToApiPayload(
  state: PomodoroState,
  expectedUpdatedAt?: string | null,
) {
  const payload: Record<string, unknown> = {
    isActive: state.isActive,
    isPaused: state.isPaused,
    remainingSeconds: state.remainingTime,
    currentSession: state.currentSession,
    focusedTaskId: state.focusedTaskId,
    focusedHabitId: state.focusedHabitId,
    sessionsCompleted: state.sessionsCompleted,
  }
  if (expectedUpdatedAt !== undefined) {
    payload.expectedUpdatedAt = expectedUpdatedAt
  }
  return payload
}
