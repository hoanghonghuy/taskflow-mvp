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

function basePomodoroState(overrides: Partial<PomodoroState> = {}): PomodoroState {
  return {
    isActive: false,
    isPaused: false,
    remainingTime: 1500,
    currentSession: 'focus',
    focusedTaskId: null,
    focusedHabitId: null,
    sessionsCompleted: 0,
    focusHistory: [],
    settings: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      sessionsUntilLongBreak: 4,
    },
    ...overrides,
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  const payload =
    status >= 400
      ? {
          success: false,
          error: 'error',
          message:
            body && typeof body === 'object' && 'message' in body
              ? String((body as { message?: string }).message)
              : 'Request failed',
        }
      : { success: true, data: body }

  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
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

describe('admin API client', () => {
  it('fetchAdminStats retrieves stats', async () => {
    const stats = {
      totalUsers: 10,
      regularUsers: 8,
      totalTasks: 50,
      totalHabits: 20,
      totalLists: 5,
      totalPomodoroSessions: 30,
      totalCountdowns: 3,
      newUsersLast7Days: 2,
      recentUsers: [],
    }
    mockFetch.mockResolvedValue(jsonResponse(stats))
    const { fetchAdminStats } = await import('@/lib/api/admin')

    const result = await fetchAdminStats()
    expect(result.totalUsers).toBe(10)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/stats',
      expect.objectContaining({ credentials: 'include' })
    )
  })

  it('fetchAdminUsers with query params', async () => {
    const userList = { items: [], total: 0, page: 1, pageSize: 20 }
    mockFetch.mockResolvedValue(jsonResponse(userList))
    const { fetchAdminUsers } = await import('@/lib/api/admin')

    await fetchAdminUsers({ page: 2, pageSize: 10, search: 'test', role: 'ADMIN' })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/users?page=2&pageSize=10&search=test&role=ADMIN',
      expect.anything()
    )
  })

  it('fetchAdminUsers without params', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ items: [], total: 0, page: 1, pageSize: 20 }))
    const { fetchAdminUsers } = await import('@/lib/api/admin')

    await fetchAdminUsers()
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users', expect.anything())
  })

  it('fetchAdminUser by id', async () => {
    const user = { id: 'u1', name: 'User', email: 'user@example.com', role: 'user' as const, createdAt: '2026-01-01', taskCount: 5, habitCount: 2, listCount: 1, pomodoroSessionCount: 10, countdownCount: 1 }
    mockFetch.mockResolvedValue(jsonResponse(user))
    const { fetchAdminUser } = await import('@/lib/api/admin')

    const result = await fetchAdminUser('u1')
    expect(result.id).toBe('u1')
    expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/u1', expect.anything())
  })

  it('updateAdminUser patches user', async () => {
    const updated = { id: 'u1', name: 'Updated', email: 'new@example.com', role: 'user' as const, createdAt: '2026-01-01' }
    mockFetch.mockResolvedValue(jsonResponse(updated))
    const { updateAdminUser } = await import('@/lib/api/admin')

    const result = await updateAdminUser('u1', { name: 'Updated', email: 'new@example.com' })
    expect(result.name).toBe('Updated')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/users/u1',
      expect.objectContaining({ method: 'PATCH' })
    )
  })

  it('deleteAdminUser calls DELETE', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, json: async () => null } as Response)
    const { deleteAdminUser } = await import('@/lib/api/admin')

    await deleteAdminUser('u1')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/admin/users/u1',
      expect.objectContaining({ method: 'DELETE' })
    )
  })
})

describe('tasks API client', () => {
  it('reorderTasks calls reorder endpoint', async () => {
    const tasks = [{ Id: 't1', Title: 'Task 1', Completed: false, ListId: 'inbox' }]
    mockFetch.mockResolvedValue(jsonResponse(tasks))
    const { reorderTasks } = await import('@/lib/api/tasks')

    const result = await reorderTasks(['t1', 't2', 't3'])
    expect(result).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/tasks/reorder',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('reorderTasks handles empty response', async () => {
    mockFetch.mockResolvedValue(jsonResponse(null))
    const { reorderTasks } = await import('@/lib/api/tasks')

    const result = await reorderTasks(['a', 'b'])
    expect(result).toEqual([])
  })

  it('deleteTask handles 404 gracefully', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({ error: 'not found' }) } as Response)
    const { deleteTask } = await import('@/lib/api/tasks')

    await expect(deleteTask('missing')).resolves.toBeUndefined()
  })

  it('deleteTask throws on other errors', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'server error' }) } as Response)
    const { deleteTask } = await import('@/lib/api/tasks')

    await expect(deleteTask('t1')).rejects.toThrow('Failed to delete task: 500')
  })
})

describe('AI API client', () => {
  it('analyzeTaskText returns parsed result', async () => {
    const analysis = { title: 'Buy milk', priority: 'high', tags: ['shopping'] }
    mockFetch.mockResolvedValue(jsonResponse(analysis))
    const { analyzeTaskText } = await import('@/lib/api/ai')

    const result = await analyzeTaskText('buy milk tomorrow', 'en')
    expect(result?.title).toBe('Buy milk')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/tasks/analyze',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('analyzeTaskText throws on error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { analyzeTaskText } = await import('@/lib/api/ai')

    await expect(analyzeTaskText('text', 'en')).rejects.toThrow('Failed to analyze task text: 500')
  })

  it('fetchBriefing returns content string', async () => {
    const briefing = { content: 'Today you have 3 tasks' }
    mockFetch.mockResolvedValue(jsonResponse(briefing))
    const { fetchBriefing } = await import('@/lib/api/ai')

    const result = await fetchBriefing('en')
    expect(result).toBe('Today you have 3 tasks')
  })

  it('fetchBriefing throws on empty content', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ content: '' }))
    const { fetchBriefing } = await import('@/lib/api/ai')

    await expect(fetchBriefing('en')).rejects.toThrow('Empty briefing content')
  })

  it('fetchBriefing throws on error response', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) } as Response)
    const { fetchBriefing } = await import('@/lib/api/ai')

    await expect(fetchBriefing('en')).rejects.toThrow('Failed to load briefing: 503')
  })

  it('generateSubtasks returns subtask array', async () => {
    const subtasks = { subtasks: [{ title: 'Step 1' }, { title: 'Step 2' }] }
    mockFetch.mockResolvedValue(jsonResponse(subtasks))
    const { generateSubtasks } = await import('@/lib/api/ai')

    const result = await generateSubtasks('Complex task', 'Details here', 'en')
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Step 1')
  })

  it('generateSubtasks returns empty array on invalid response', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ subtasks: null }))
    const { generateSubtasks } = await import('@/lib/api/ai')

    const result = await generateSubtasks('Task', undefined, 'en')
    expect(result).toEqual([])
  })

  it('generateSubtasks throws on error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) } as Response)
    const { generateSubtasks } = await import('@/lib/api/ai')

    await expect(generateSubtasks('Task', 'desc', 'en')).rejects.toThrow('Failed to generate subtasks: 429')
  })

  it('sendChatMessage returns reply content', async () => {
    const reply = { content: 'AI response here' }
    mockFetch.mockResolvedValue(jsonResponse(reply))
    const { sendChatMessage } = await import('@/lib/api/ai')

    const result = await sendChatMessage({
      messages: [{ role: 'user', text: 'Hello' }],
      language: 'en',
      thinkingMode: true,
      searchGrounding: false,
    })
    expect(result).toBe('AI response here')
  })

  it('sendChatMessage throws on empty reply', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ content: '   ' }))
    const { sendChatMessage } = await import('@/lib/api/ai')

    await expect(sendChatMessage({ messages: [], language: 'en' })).rejects.toThrow('Empty chat response')
  })

  it('sendChatMessage throws on error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { sendChatMessage } = await import('@/lib/api/ai')

    await expect(sendChatMessage({ messages: [], language: 'en' })).rejects.toThrow('Failed to send chat message: 500')
  })
})

describe('habits API client', () => {
  it('completeHabit throws on error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { completeHabit } = await import('@/lib/api/habits')

    await expect(completeHabit('h1', '2026-06-10')).rejects.toThrow('Failed to complete habit: 500')
  })

  it('uncompleteHabit handles 404 gracefully', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as Response)
    const { uncompleteHabit } = await import('@/lib/api/habits')

    await expect(uncompleteHabit('h1', '2026-06-10')).resolves.toBeUndefined()
  })

  it('uncompleteHabit throws on other errors', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { uncompleteHabit } = await import('@/lib/api/habits')

    await expect(uncompleteHabit('h1', '2026-06-10')).rejects.toThrow('Failed to uncomplete habit: 500')
  })

  it('deleteHabit handles 404 gracefully', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as Response)
    const { deleteHabit } = await import('@/lib/api/habits')

    await expect(deleteHabit('h1')).resolves.toBeUndefined()
  })

  it('deleteHabit throws on other errors', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { deleteHabit } = await import('@/lib/api/habits')

    await expect(deleteHabit('h1')).rejects.toThrow('Failed to delete habit: 500')
  })
})

describe('countdown API client', () => {
  it('updateCountdown sends partial payload', async () => {
    const updated = { Id: 'c1', Title: 'Updated', TargetDate: '2027-01-01T00:00:00Z', Color: 'blue' }
    mockFetch.mockResolvedValue(jsonResponse(updated))
    const { updateCountdown } = await import('@/lib/api/countdown')

    const result = await updateCountdown('c1', { title: 'Updated', color: 'blue' })
    expect(result?.title).toBe('Updated')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/countdown/c1',
      expect.objectContaining({ method: 'PUT' })
    )
  })
})

describe('settings API client', () => {
  it('fetchPomodoroSettings extracts pomodoroSettings', async () => {
    const settings = { pomodoroSettings: { focusDuration: 25, shortBreakDuration: 5, longBreakDuration: 15, sessionsUntilLongBreak: 4 } }
    mockFetch.mockResolvedValue(jsonResponse(settings))
    const { fetchPomodoroSettings } = await import('@/lib/api/settings')

    const result = await fetchPomodoroSettings()
    expect(result?.focusDuration).toBe(25)
  })

  it('fetchPomodoroSettings returns null on missing data', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}))
    const { fetchPomodoroSettings } = await import('@/lib/api/settings')

    const result = await fetchPomodoroSettings()
    expect(result).toBeNull()
  })

  it('updatePomodoroSettings wraps payload', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}))
    const { updatePomodoroSettings } = await import('@/lib/api/settings')

    await updatePomodoroSettings({ focusDuration: 30, shortBreakDuration: 5, longBreakDuration: 20, sessionsUntilLongBreak: 3 })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/settings',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('pomodoroSettings'),
      })
    )
  })
})

describe('pomodoro API client', () => {
  it('fetchPomodoroState handles empty state payload', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => null,
    } as Response)
    const { fetchPomodoroState } = await import('@/lib/api/pomodoro')
    
    const fallback = basePomodoroState()

    const result = await fetchPomodoroState(fallback)
    expect(result).toBeNull()
  })

  it('fetchPomodoroState returns null on error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response)
    const { fetchPomodoroState } = await import('@/lib/api/pomodoro')
    
    const fallback = basePomodoroState()

    const result = await fetchPomodoroState(fallback)
    expect(result).toBeNull()
  })

  it('updatePomodoroState with keepalive option', async () => {
    mockFetch.mockResolvedValue(jsonResponse({}))
    const { updatePomodoroState } = await import('@/lib/api/pomodoro')
    
    const state = basePomodoroState({
      isActive: true,
      remainingTime: 1200,
      focusedTaskId: 't1',
      sessionsCompleted: 2,
    })

    await updatePomodoroState(state, { keepalive: true })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/pomodoro/state',
      expect.objectContaining({ method: 'PUT', keepalive: true })
    )
  })

  it('createPomodoroSession throws on error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: async () => ({}) } as Response)
    const { createPomodoroSession } = await import('@/lib/api/pomodoro')

    await expect(
      createPomodoroSession({
        startTime: '2026-06-10T12:00:00Z',
        durationSeconds: 1500,
        type: 'focus',
        taskId: 't1',
      })
    ).rejects.toThrow('Failed to create pomodoro session: 400')
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
    const fallback = basePomodoroState()

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
    expect('geminiApiKey' in mapped).toBe(false)
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
      .mockResolvedValueOnce(jsonResponse({ available: true, provider: 'openai' }))
      .mockResolvedValueOnce(jsonResponse({ title: 'Buy milk' }))
    const aiApi = await import('@/lib/api/ai')

    await expect(aiApi.fetchAiStatus()).resolves.toEqual({ available: true, provider: 'openai' })
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
    const fallback = basePomodoroState()

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
