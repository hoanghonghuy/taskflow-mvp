/**
 * In-memory mock backend.
 *
 * Enabled when the env var MOCK_MODE=true. When active, the frontend's
 * /api/* proxy routes (via backend-client) are served from this in-memory
 * store instead of calling the real backend. Intended for running the
 * frontend standalone (no backend) for development / preview.
 *
 * NOTE: Data lives only in the server process memory and resets on restart.
 */

export function isMockMode(): boolean {
  return process.env.MOCK_MODE === 'true'
}

// ---- Types (loose, matching the JSON shape the frontend mappers expect) ----
interface MockList {
  id: string
  name: string
  color: string
  members: string[]
}

interface MockTask {
  id: string
  title: string
  description: string
  completed: boolean
  dueDate?: string | null
  priority: string
  listId: string
  columnId?: string | null
  tags: string[]
  subtasks?: Array<{ id?: string; title?: string; text?: string; completed?: boolean }>
  comments?: Array<{ id?: string; text?: string; content?: string }>
  recurrence?: Record<string, unknown> | null
  reminderMinutes?: number | null
  createdAt: string
}

interface MockHabit {
  id: string
  name: string
  completions: string[]
  createdAt: string
}

interface MockCountdown {
  id: string
  title: string
  targetDate: string
  color: string
  createdAt: string
}

// ---- Demo user returned by the mock auth flow ----
export const MOCK_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Demo User',
  email: 'demo@taskflow.app',
  avatarUrl: 'https://api.dicebear.com/8.x/initials/svg?seed=Demo%20User',
  role: 'USER' as const,
}

/** E2E admin accounts use this domain in mock mode (see e2e/helpers/test-data.ts). */
export function isE2eAdminEmail(email: string): boolean {
  return email.endsWith('@taskflow.admin')
}

export function buildMockAuthUser(input: { name?: string; email?: string }) {
  const email = input.email?.trim() || MOCK_USER.email
  const name = input.name?.trim() || MOCK_USER.name
  const role = isE2eAdminEmail(email) ? ('ADMIN' as const) : ('USER' as const)
  return {
    ...MOCK_USER,
    name,
    email,
    role,
  }
}

// ---- Seed helpers ----
function nowIso(): string {
  return new Date().toISOString()
}

function daysFromNow(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function todayYmd(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function newId(): string {
  // crypto.randomUUID is available in the Node 18+ / Next.js server runtime
  try {
    return crypto.randomUUID()
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

// ---- In-memory store (module-level, persists for the server process) ----
interface Store {
  lists: MockList[]
  tasks: MockTask[]
  habits: MockHabit[]
  countdowns: MockCountdown[]
  settings: Record<string, unknown>
}

let store: Store | null = null

function getStore(): Store {
  if (store) return store

  store = {
    lists: [
      { id: 'inbox', name: 'Inbox', color: '#3b82f6', members: [] },
      { id: 'work', name: 'Work', color: '#8b5cf6', members: [] },
      { id: 'personal', name: 'Personal', color: '#10b981', members: [] },
    ],
    tasks: [
      {
        id: newId(),
        title: 'Welcome to Taskflow 👋',
        description: 'This is sample data served by the mock backend. Edit or delete it freely.',
        completed: false,
        dueDate: daysFromNow(1),
        priority: 'high',
        listId: 'inbox',
        columnId: null,
        tags: ['getting-started'],
        createdAt: nowIso(),
      },
      {
        id: newId(),
        title: 'Plan the week',
        description: 'Outline goals and priorities.',
        completed: false,
        dueDate: daysFromNow(3),
        priority: 'medium',
        listId: 'work',
        columnId: null,
        tags: ['planning'],
        createdAt: nowIso(),
      },
      {
        id: newId(),
        title: 'Buy groceries',
        description: '',
        completed: true,
        dueDate: daysFromNow(-1),
        priority: 'low',
        listId: 'personal',
        columnId: null,
        tags: [],
        createdAt: nowIso(),
      },
    ],
    habits: [
      { id: newId(), name: 'Drink water', completions: [todayYmd(-1), todayYmd(0)], createdAt: nowIso() },
      { id: newId(), name: 'Read 20 minutes', completions: [todayYmd(-2)], createdAt: nowIso() },
    ],
    countdowns: [
      { id: newId(), title: 'Project deadline', targetDate: daysFromNow(14), color: '#ef4444', createdAt: nowIso() },
    ],
    settings: {},
  }

  return store
}

// ---- Response helpers ----
function json(data: unknown, status = 200): Response {
  const payload =
    status >= 400
      ? {
          success: false,
          error:
            data && typeof data === 'object' && 'error' in data
              ? String((data as { error?: string }).error)
              : 'error',
          message:
            data && typeof data === 'object' && 'message' in data
              ? String((data as { message?: string }).message)
              : data && typeof data === 'object' && 'error' in data
                ? String((data as { error?: string }).error)
                : 'Request failed',
        }
      : { success: true, data }

  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function noContent(): Response {
  return new Response(null, { status: 204 })
}

function parseBody(init: RequestInit): Record<string, unknown> {
  if (!init.body || typeof init.body !== 'string') return {}
  try {
    return JSON.parse(init.body) as Record<string, unknown>
  } catch {
    return {}
  }
}

// ---- Router ----
export async function mockBackendFetch(rawPath: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase()
  const [path, queryString] = rawPath.split('?')
  const query = new URLSearchParams(queryString || '')
  const s = getStore()
  const body = parseBody(init)

  // ---------------- Lists ----------------
  if (path === '/api/lists') {
    if (method === 'GET') return json(s.lists)
    if (method === 'POST') {
      const created: MockList = {
        id: newId(),
        name: String(body.name ?? 'Untitled'),
        color: String(body.color ?? '#3b82f6'),
        members: Array.isArray(body.members) ? (body.members as string[]) : [],
      }
      s.lists.push(created)
      return json(created, 201)
    }
  }
  if (path.startsWith('/api/lists/')) {
    const id = decodeURIComponent(path.slice('/api/lists/'.length))
    const idx = s.lists.findIndex((l) => l.id === id)
    if (method === 'GET') return idx >= 0 ? json(s.lists[idx]) : json({ error: 'not found' }, 404)
    if (method === 'PUT') {
      if (idx < 0) return json({ error: 'not found' }, 404)
      s.lists[idx] = {
        ...s.lists[idx],
        ...(body.name != null ? { name: String(body.name) } : {}),
        ...(body.color != null ? { color: String(body.color) } : {}),
        ...(Array.isArray(body.members) ? { members: body.members as string[] } : {}),
      }
      return json(s.lists[idx])
    }
    if (method === 'DELETE') {
      if (idx >= 0) s.lists.splice(idx, 1)
      s.tasks = s.tasks.filter((t) => t.listId !== id)
      return noContent()
    }
  }

  // ---------------- Tasks ----------------
  if (path === '/api/tasks/reorder') {
    if (method === 'POST') {
      const taskIds = Array.isArray(body.taskIds) ? (body.taskIds as string[]) : []
      if (taskIds.length !== s.tasks.length) {
        return json({ success: false, error: 'invalid_request', message: 'taskIds must include every task' }, 400)
      }
      const byId = new Map(s.tasks.map((t) => [t.id, t]))
      const reordered = taskIds
        .map((id) => byId.get(id))
        .filter((t): t is MockTask => Boolean(t))
      if (reordered.length !== s.tasks.length) {
        return json({ success: false, error: 'invalid_request', message: 'Invalid task id' }, 400)
      }
      s.tasks = reordered
      return json(reordered)
    }
  }

  if (path === '/api/tasks/search') {
    if (method === 'GET') {
      const q = (query.get('q') ?? '').trim().toLowerCase()
      if (!q) return json([], 200)
      const limitRaw = Number(query.get('limit') ?? 50)
      const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 100) : 50
      const matches = s.tasks.filter((task) => {
        const subtaskText = (task.subtasks ?? [])
          .map((item) => String(item.title ?? item.text ?? ''))
          .join(' ')
        const commentText = (task.comments ?? [])
          .map((item) => String(item.text ?? item.content ?? ''))
          .join(' ')
        const haystack = [
          task.title,
          task.description ?? '',
          ...(task.tags ?? []),
          subtaskText,
          commentText,
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(q)
      })
      return json(matches.slice(0, limit))
    }
  }

  if (path === '/api/tasks') {
    if (method === 'GET') return json(s.tasks)
    if (method === 'POST') {
      const created: MockTask = {
        id: newId(),
        title: String(body.title ?? 'Untitled task'),
        description: String(body.description ?? ''),
        completed: Boolean(body.completed ?? false),
        dueDate: (body.dueDate as string) ?? null,
        priority: String(body.priority ?? 'medium'),
        listId: String(body.listId ?? 'inbox'),
        columnId: (body.columnId as string) ?? null,
        tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
        subtasks: Array.isArray(body.subtasks)
          ? (body.subtasks as MockTask['subtasks'])
          : [],
        comments: Array.isArray(body.comments)
          ? (body.comments as MockTask['comments'])
          : [],
        recurrence:
          body.recurrence && typeof body.recurrence === 'object'
            ? (body.recurrence as Record<string, unknown>)
            : null,
        reminderMinutes:
          body.reminderMinutes == null ? null : Number(body.reminderMinutes),
        createdAt: nowIso(),
      }
      s.tasks.push(created)
      return json(created, 201)
    }
  }
  if (path.startsWith('/api/tasks/')) {
    const id = decodeURIComponent(path.slice('/api/tasks/'.length))
    const idx = s.tasks.findIndex((t) => t.id === id)
    if (method === 'GET') return idx >= 0 ? json(s.tasks[idx]) : json({ error: 'not found' }, 404)
    if (method === 'PUT') {
      if (idx < 0) return json({ error: 'not found' }, 404)
      const cur = s.tasks[idx]
      s.tasks[idx] = {
        ...cur,
        ...(body.title != null ? { title: String(body.title) } : {}),
        ...(body.description != null ? { description: String(body.description) } : {}),
        ...(body.completed != null ? { completed: Boolean(body.completed) } : {}),
        ...('dueDate' in body ? { dueDate: (body.dueDate as string) ?? null } : {}),
        ...(body.priority != null ? { priority: String(body.priority) } : {}),
        ...(body.listId != null ? { listId: String(body.listId) } : {}),
        ...('columnId' in body ? { columnId: (body.columnId as string) ?? null } : {}),
        ...(Array.isArray(body.tags) ? { tags: body.tags as string[] } : {}),
        ...(Array.isArray(body.subtasks) ? { subtasks: body.subtasks as MockTask['subtasks'] } : {}),
        ...(Array.isArray(body.comments) ? { comments: body.comments as MockTask['comments'] } : {}),
        ...('recurrence' in body
          ? {
              recurrence:
                body.recurrence && typeof body.recurrence === 'object'
                  ? (body.recurrence as Record<string, unknown>)
                  : null,
            }
          : {}),
        ...('reminderMinutes' in body
          ? {
              reminderMinutes:
                body.reminderMinutes == null ? null : Number(body.reminderMinutes),
            }
          : {}),
      }
      return json(s.tasks[idx])
    }
    if (method === 'DELETE') {
      if (idx >= 0) s.tasks.splice(idx, 1)
      return noContent()
    }
  }

  // ---------------- Habits ----------------
  if (path === '/api/habits') {
    if (method === 'GET') return json(s.habits)
    if (method === 'POST') {
      const created: MockHabit = {
        id: newId(),
        name: String(body.name ?? 'New habit'),
        completions: [],
        createdAt: nowIso(),
      }
      s.habits.push(created)
      return json(created, 201)
    }
  }
  if (path.startsWith('/api/habits/')) {
    const rest = path.slice('/api/habits/'.length)
    // /api/habits/{id}/complete
    if (rest.endsWith('/complete')) {
      const id = decodeURIComponent(rest.slice(0, -'/complete'.length))
      const habit = s.habits.find((h) => h.id === id)
      if (!habit) return json({ error: 'not found' }, 404)
      if (method === 'POST') {
        const date = String(body.date ?? todayYmd(0))
        if (!habit.completions.includes(date)) habit.completions.push(date)
        return json(habit)
      }
      if (method === 'DELETE') {
        const date = query.get('date') ?? todayYmd(0)
        habit.completions = habit.completions.filter((d) => d !== date)
        return json(habit)
      }
    } else {
      const id = decodeURIComponent(rest)
      const idx = s.habits.findIndex((h) => h.id === id)
      if (method === 'GET') return idx >= 0 ? json(s.habits[idx]) : json({ error: 'not found' }, 404)
      if (method === 'PUT') {
        if (idx < 0) return json({ error: 'not found' }, 404)
        s.habits[idx] = {
          ...s.habits[idx],
          ...(body.name != null ? { name: String(body.name) } : {}),
          ...(Array.isArray(body.completions) ? { completions: body.completions as string[] } : {}),
        }
        return json(s.habits[idx])
      }
      if (method === 'DELETE') {
        if (idx >= 0) s.habits.splice(idx, 1)
        return noContent()
      }
    }
  }

  // ---------------- Countdown ----------------
  if (path === '/api/countdown') {
    if (method === 'GET') return json(s.countdowns)
    if (method === 'POST') {
      const created: MockCountdown = {
        id: newId(),
        title: String(body.title ?? 'Event'),
        targetDate: String(body.targetDate ?? daysFromNow(7)),
        color: String(body.color ?? '#3b82f6'),
        createdAt: nowIso(),
      }
      s.countdowns.push(created)
      return json(created, 201)
    }
  }
  if (path.startsWith('/api/countdown/')) {
    const id = decodeURIComponent(path.slice('/api/countdown/'.length))
    const idx = s.countdowns.findIndex((c) => c.id === id)
    if (method === 'GET') return idx >= 0 ? json(s.countdowns[idx]) : json({ error: 'not found' }, 404)
    if (method === 'PUT') {
      if (idx < 0) return json({ error: 'not found' }, 404)
      s.countdowns[idx] = {
        ...s.countdowns[idx],
        ...(body.title != null ? { title: String(body.title) } : {}),
        ...(body.targetDate != null ? { targetDate: String(body.targetDate) } : {}),
        ...(body.color != null ? { color: String(body.color) } : {}),
      }
      return json(s.countdowns[idx])
    }
    if (method === 'DELETE') {
      if (idx >= 0) s.countdowns.splice(idx, 1)
      return noContent()
    }
  }

  // ---------------- Settings ----------------
  if (path === '/api/settings') {
    if (method === 'GET') return json(s.settings)
    if (method === 'PUT') {
      s.settings = { ...s.settings, ...body }
      return json(s.settings)
    }
  }

  // ---------------- Profile ----------------
  if (path === '/api/profile/summary' && method === 'GET') {
    const completed = s.tasks.filter((t) => t.completed).length
    return json({
      totalTasks: s.tasks.length,
      completedTasks: completed,
      activeHabits: s.habits.length,
      longestStreak: 0,
    })
  }
  if (path === '/api/profile/achievements' && method === 'GET') {
    return json([])
  }

  // ---------------- Pomodoro ----------------
  if (path === '/api/pomodoro/sessions') {
    if (method === 'GET') return json([])
    if (method === 'POST') return json(body, 201)
  }
  if (path === '/api/pomodoro/state') {
    // No persisted state in mock mode
    return noContent()
  }

  // ---------------- Admin (mock mode) ----------------
  if (path === '/api/admin/stats' && method === 'GET') {
    return json({
      totalUsers: 3,
      regularUsers: 2,
      totalTasks: s.tasks.length,
      totalHabits: s.habits.length,
      totalLists: s.lists.length,
      totalPomodoroSessions: 0,
      totalCountdowns: s.countdowns.length,
      newUsersLast7Days: 1,
      recentUsers: [
        {
          id: MOCK_USER.id,
          name: MOCK_USER.name,
          email: MOCK_USER.email,
          role: 'USER',
          createdAt: nowIso(),
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'E2E Admin',
          email: 'admin@taskflow.admin',
          role: 'ADMIN',
          createdAt: nowIso(),
        },
      ],
    })
  }

  if (path === '/api/admin/users' && method === 'GET') {
    return json({
      items: [
        {
          id: MOCK_USER.id,
          name: MOCK_USER.name,
          email: MOCK_USER.email,
          role: 'USER',
          createdAt: nowIso(),
        },
        {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'E2E Admin',
          email: 'admin@taskflow.admin',
          role: 'ADMIN',
          createdAt: nowIso(),
        },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
    })
  }

  if (path.startsWith('/api/admin/users/') && method === 'GET') {
    const id = decodeURIComponent(path.slice('/api/admin/users/'.length))
    return json({
      id,
      name: id === MOCK_USER.id ? MOCK_USER.name : 'E2E Admin',
      email: id === MOCK_USER.id ? MOCK_USER.email : 'admin@taskflow.admin',
      role: id === MOCK_USER.id ? 'USER' : 'ADMIN',
      createdAt: nowIso(),
      taskCount: s.tasks.length,
      habitCount: s.habits.length,
      listCount: s.lists.length,
      pomodoroSessionCount: 0,
      countdownCount: s.countdowns.length,
    })
  }

  // ---------------- AI (disabled in mock mode) ----------------
  if (path.startsWith('/api/ai/')) {
    return noContent()
  }

  // ---------------- Fallback ----------------
  return json({ error: `Mock backend: unhandled ${method} ${path}` }, 404)
}
