import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api/client'
import {
  mapCountdownsFromApi,
  mapFocusSessionsFromApi,
  mapHabitsFromApi,
  mapListsFromApi,
  mapPomodoroStateFromApi,
  mapTasksFromApi,
  pomodoroStateToApiPayload,
} from '@/lib/api/mappers'
import { mapSettingsFromApi } from '@/lib/api/settings'
import type { PomodoroState, Settings } from '@/types'

const mockFetch = vi.fn()

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response
}

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch)
  mockFetch.mockReset()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('api client', () => {
  it('apiFetch includes credentials and sets JSON content-type', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}))
    const { apiFetch } = await import('@/lib/api/client')

    await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify({ title: 'A' }) })

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tasks',
      expect.objectContaining({
        credentials: 'include',
        method: 'POST',
        headers: expect.any(Headers),
      }),
    )
    const init = mockFetch.mock.calls[0][1] as RequestInit
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json')
  })

  it('apiFetchJson throws ApiError when response is not ok', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'bad' }, 400))
    const { apiFetchJson } = await import('@/lib/api/client')

    await expect(apiFetchJson('/api/tasks')).rejects.toBeInstanceOf(ApiError)
  })

  it('apiFetchJson returns undefined for 204', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: async () => null } as Response)
    const { apiFetchJson } = await import('@/lib/api/client')

    await expect(apiFetchJson('/api/tasks/1', { method: 'DELETE' })).resolves.toBeUndefined()
  })
})

describe('mappers', () => {
  it('mapTasksFromApi normalizes PascalCase API fields', () => {
    const [task] = mapTasksFromApi([
      {
        Id: 't1',
        Title: 'Task',
        Description: 'Desc',
        Completed: true,
        ListId: 'inbox',
        Priority: 'HIGH',
        Tags: ['a'],
        Subtasks: [{ Id: 's1', Title: 'Sub', Completed: false }],
        Comments: [{ Id: 'c1', UserId: 'u1', Content: 'Hi', Timestamp: '2026-01-01T00:00:00Z' }],
        Recurrence: { Type: 'weekly', Interval: 2, DaysOfWeek: [1, 3] },
        ReminderMinutes: 15,
        AssigneeId: 'u2',
        CreatedAt: '2026-01-01T00:00:00Z',
        DueDate: '2026-01-02T00:00:00Z',
      },
    ])

    expect(task.id).toBe('t1')
    expect(task.title).toBe('Task')
    expect(task.priority).toBe('high')
    expect(task.subtasks).toHaveLength(1)
    expect(task.recurrence?.type).toBe('weekly')
    expect(task.assigneeId).toBe('u2')
  })

  it('mapListsFromApi and mapHabitsFromApi map arrays', () => {
    const [list] = mapListsFromApi([{ Id: 'l1', Name: 'Work', Color: '#fff', Members: ['u1'] }])
    expect(list.id).toBe('l1')
    expect(list.members).toEqual(['u1'])

    const [habit] = mapHabitsFromApi([
      { Id: 'h1', Name: 'Read', Completions: ['2026-01-01'], CreatedAt: '2026-01-01T00:00:00Z' },
    ])
    expect(habit.name).toBe('Read')
    expect(habit.completions).toEqual(['2026-01-01'])
  })

  it('mapCountdownsFromApi maps target and created dates', () => {
    const [event] = mapCountdownsFromApi([
      { Id: 'c1', Title: 'Launch', TargetDate: '2026-12-01T00:00:00Z', Color: 'sky' },
    ])
    expect(event.title).toBe('Launch')
    expect(event.color).toBe('sky')
  })

  it('mapFocusSessionsFromApi keeps only focus sessions', () => {
    const sessions = mapFocusSessionsFromApi([
      { Type: 'focus', StartTime: '2026-01-01T00:00:00Z', DurationSeconds: 1500, TaskId: 't1' },
      { Type: 'break', StartTime: '2026-01-01T00:30:00Z', DurationSeconds: 300 },
    ])
    expect(sessions).toHaveLength(1)
    expect(sessions[0].taskId).toBe('t1')
  })

  it('mapPomodoroStateFromApi and pomodoroStateToApiPayload round-trip core fields', () => {
    const fallback: PomodoroState = {
      isActive: false,
      isPaused: false,
      remainingTime: 1500,
      currentSession: 'focus',
      focusedTaskId: null,
      focusedHabitId: null,
      sessionsCompleted: 0,
      settings: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, sessionsUntilLongBreak: 4 },
    }

    const mapped = mapPomodoroStateFromApi(
      {
        IsActive: true,
        IsPaused: false,
        RemainingSeconds: 1200,
        CurrentSession: 'shortBreak',
        FocusedTaskId: 't1',
        SessionsCompleted: 2,
      },
      fallback,
    )

    expect(mapped?.isActive).toBe(true)
    expect(mapped?.currentSession).toBe('shortBreak')
    expect(mapped?.remainingTime).toBe(1200)

    const payload = pomodoroStateToApiPayload({ ...fallback, ...mapped!, remainingTime: 900 })
    expect(payload.remainingSeconds).toBe(900)
    expect(payload.currentSession).toBe('shortBreak')
  })
})

describe('settings api', () => {
  const fallback: Settings = {
    language: 'en',
    theme: 'light',
    notifications: true,
    soundEnabled: false,
    autoStartPomodoro: false,
    defaultPriority: 'medium',
    defaultListId: 'inbox',
    bottomNavActions: ['dashboard', 'list'],
  }

  it('mapSettingsFromApi strips geminiApiKey and validates language/theme', () => {
    const mapped = mapSettingsFromApi(
      { language: 'vi', theme: 'dark', geminiApiKey: 'secret', bottomNavActions: ['dashboard'] },
      fallback,
    )
    expect(mapped.language).toBe('vi')
    expect(mapped.theme).toBe('dark')
    expect((mapped as Record<string, unknown>).geminiApiKey).toBeUndefined()
  })

  it('fetchSettings and updateSettings call API', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ language: 'vi' }))
      .mockResolvedValueOnce(jsonResponse({}))
    const settingsApi = await import('@/lib/api/settings')

    await expect(settingsApi.fetchSettings()).resolves.toEqual({ language: 'vi' })
    await settingsApi.updateSettings({ language: 'vi' })
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/settings',
      expect.objectContaining({ method: 'PUT' }),
    )
  })
})

describe('domain api modules', () => {
  it('tasks api fetches and maps tasks', async () => {
    mockFetch.mockResolvedValue(jsonResponse([{ id: 't1', title: 'A', listId: 'inbox' }]))
    const tasksApi = await import('@/lib/api/tasks')

    const tasks = await tasksApi.fetchTasks()
    expect(tasks[0].id).toBe('t1')
  })

  it('lists api create/update/delete', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ id: 'l1', name: 'Work', color: '#fff', members: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'l1', name: 'Updated', color: '#000', members: [] }))
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null } as Response)
    const listsApi = await import('@/lib/api/lists')

    const created = await listsApi.createList({ name: 'Work', color: '#fff', members: [] })
    expect(created?.name).toBe('Work')

    const updated = await listsApi.updateList({ id: 'l1', name: 'Updated', color: '#000', members: [] })
    expect(updated?.name).toBe('Updated')

    await listsApi.deleteList('l1')
    expect(mockFetch).toHaveBeenLastCalledWith('/api/lists/l1', expect.objectContaining({ method: 'DELETE' }))
  })

  it('auth api login and session', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ authenticated: true }))
      .mockResolvedValueOnce(jsonResponse({ user: { id: 'u1', name: 'A', email: 'a@test.com' } }))
    const authApi = await import('@/lib/api/auth')

    const session = await authApi.fetchSession()
    expect(session.ok).toBe(true)
    expect(session.data?.authenticated).toBe(true)

    const user = await authApi.login('a@test.com', 'password')
    expect(user.email).toBe('a@test.com')
  })

  it('ai api status and analyze', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ available: true }))
      .mockResolvedValueOnce(jsonResponse({ title: 'Buy milk' }))
    const aiApi = await import('@/lib/api/ai')

    await expect(aiApi.fetchAiStatus()).resolves.toBe(true)
    await expect(aiApi.analyzeTaskText('buy milk tomorrow', 'en')).resolves.toMatchObject({ title: 'Buy milk' })
  })

  it('profile api fetchProfileSummary returns null on failure', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ error: 'nope' }, 500))
    const profileApi = await import('@/lib/api/profile')

    await expect(profileApi.fetchProfileSummary()).resolves.toBeNull()
  })

  it('habits and countdown api modules', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse([{ id: 'h1', name: 'Read', completions: [] }]))
      .mockResolvedValueOnce(jsonResponse({ id: 'h2', name: 'Run', completions: [] }))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse([{ id: 'c1', title: 'Launch', targetDate: '2026-12-01' }]))
    const habitsApi = await import('@/lib/api/habits')
    const countdownApi = await import('@/lib/api/countdown')

    const habits = await habitsApi.fetchHabits()
    expect(habits[0].name).toBe('Read')

    const created = await habitsApi.createHabit('Run')
    expect(created?.id).toBe('h2')

    await habitsApi.completeHabit('h2', '2026-06-09')

    const events = await countdownApi.fetchCountdowns()
    expect(events[0].title).toBe('Launch')
  })

  it('pomodoro api fetches sessions and state', async () => {
    const fallback: PomodoroState = {
      isActive: false,
      isPaused: false,
      remainingTime: 1500,
      currentSession: 'focus',
      focusedTaskId: null,
      focusedHabitId: null,
      sessionsCompleted: 0,
      settings: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, sessionsUntilLongBreak: 4 },
    }

    mockFetch
      .mockResolvedValueOnce(
        jsonResponse([{ type: 'focus', startTime: '2026-01-01T00:00:00Z', durationSeconds: 1500 }]),
      )
      .mockResolvedValueOnce(jsonResponse({ isActive: true, remainingSeconds: 1200, currentSession: 'focus' }))
      .mockResolvedValueOnce(jsonResponse({}))
    const pomodoroApi = await import('@/lib/api/pomodoro')

    const sessions = await pomodoroApi.fetchPomodoroSessions()
    expect(sessions).toHaveLength(1)

    const state = await pomodoroApi.fetchPomodoroState(fallback)
    expect(state?.isActive).toBe(true)

    await pomodoroApi.updatePomodoroState({ ...fallback, isActive: true })
    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/pomodoro/state',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('auth logout and tasks create/update', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({}))
      .mockResolvedValueOnce(jsonResponse({ id: 't2', title: 'New', listId: 'inbox' }))
      .mockResolvedValueOnce(jsonResponse({ id: 't2', title: 'Updated', listId: 'inbox' }))
      .mockResolvedValueOnce({ ok: true, status: 204, json: async () => null } as Response)
    const authApi = await import('@/lib/api/auth')
    const tasksApi = await import('@/lib/api/tasks')

    await authApi.logout()
    await expect(authApi.refreshSession()).resolves.toBe(true)

    const created = await tasksApi.createTask({ title: 'New', listId: 'inbox' })
    expect(created?.title).toBe('New')

    const updated = await tasksApi.updateTask('t2', { title: 'Updated' })
    expect(updated?.title).toBe('Updated')

    await tasksApi.deleteTask('t2')
  })

  it('ai briefing/chat and profile achievements', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ content: 'Good morning' }))
      .mockResolvedValueOnce(jsonResponse({ content: 'Hello there' }))
      .mockResolvedValueOnce(jsonResponse(['first-task']))
    const aiApi = await import('@/lib/api/ai')
    const profileApi = await import('@/lib/api/profile')

    await expect(aiApi.fetchBriefing('en')).resolves.toBe('Good morning')
    await expect(
      aiApi.sendChatMessage({ messages: [{ role: 'user', text: 'Hi' }], language: 'en' }),
    ).resolves.toBe('Hello there')
    await expect(profileApi.fetchAchievements()).resolves.toEqual(['first-task'])
  })

  it('settings fetchPomodoroSettings extracts nested object', async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ pomodoroSettings: { focusDuration: 30, shortBreakDuration: 5, longBreakDuration: 15, sessionsUntilLongBreak: 4 } }),
    )
    const settingsApi = await import('@/lib/api/settings')

    const ps = await settingsApi.fetchPomodoroSettings()
    expect(ps?.focusDuration).toBe(30)
  })
})
