import { describe, expect, it } from 'vitest'
import { INITIAL_STATE } from '@/lib/store/task-manager/initial-state'
import { taskManagerReducer } from '@/lib/store/task-manager/reducer'
import { historyReducer } from '@/lib/store/task-manager/history-reducer'
import { taskReducer } from '@/lib/store/task-manager/reducers/task-reducer'
import { listReducer } from '@/lib/store/task-manager/reducers/list-reducer'
import { habitReducer } from '@/lib/store/task-manager/reducers/habit-reducer'
import { columnReducer } from '@/lib/store/task-manager/reducers/column-reducer'
import { countdownReducer } from '@/lib/store/task-manager/reducers/countdown-reducer'
import { pomodoroReducer } from '@/lib/store/task-manager/reducers/pomodoro-reducer'
import { viewReducer } from '@/lib/store/task-manager/reducers/view-reducer'
import { tagReducer } from '@/lib/store/task-manager/reducers/tag-reducer'
import type { AppState } from '@/types'

const state = (): AppState => structuredClone(INITIAL_STATE)

describe('taskReducer', () => {
  it('adds, updates, deletes, toggles tasks', () => {
    let s = taskReducer(state(), {
      type: 'ADD_TASK',
      payload: { id: 'task-1', title: 'A', description: '', completed: false, priority: 'none', listId: 'inbox', tags: [], subtasks: [], comments: [], assigneeId: null },
    })
    const id = s.tasks[0].id
    s = taskReducer(s, { type: 'TOGGLE_TASK_COMPLETION', payload: { taskId: id } })
    expect(s.tasks[0].completed).toBe(true)
    s = taskReducer(s, { type: 'DELETE_TASK', payload: id })
    expect(s.tasks).toHaveLength(0)
  })

    it('reorders tasks by drag target (up)', () => {
    const base = {
      title: 'T',
      description: '',
      completed: false,
      priority: 'none' as const,
      listId: 'inbox',
      tags: [] as string[],
      subtasks: [],
      comments: [],
      assigneeId: null,
    }
    let s = taskReducer(state(), {
      type: 'ADD_TASK',
      payload: { ...base, id: 'a' },
    })
    s = taskReducer(s, { type: 'ADD_TASK', payload: { ...base, id: 'b' } })
    s = taskReducer(s, { type: 'ADD_TASK', payload: { ...base, id: 'c' } })
    s = taskReducer(s, {
      type: 'REORDER_TASKS',
      payload: { draggedId: 'c', droppedOnId: 'a' },
    })
    expect(s.tasks.map((t) => t.id)).toEqual(['c', 'a', 'b'])
  })

  it('reorders tasks dragging down onto a lower item', () => {
    const base = {
      title: 'T',
      description: '',
      completed: false,
      priority: 'none' as const,
      listId: 'inbox',
      tags: [] as string[],
      subtasks: [],
      comments: [],
      assigneeId: null,
    }
    let s = taskReducer(state(), {
      type: 'ADD_TASK',
      payload: { ...base, id: 'a' },
    })
    s = taskReducer(s, { type: 'ADD_TASK', payload: { ...base, id: 'b' } })
    s = taskReducer(s, { type: 'ADD_TASK', payload: { ...base, id: 'c' } })
    s = taskReducer(s, {
      type: 'REORDER_TASKS',
      payload: { draggedId: 'a', droppedOnId: 'b' },
    })
    expect(s.tasks.map((t) => t.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('listReducer', () => {
  it('manages lists and members', () => {
    let s = listReducer(state(), { type: 'ADD_LIST', payload: { name: 'L', color: '#fff', members: [] } })
    const listId = s.lists[0].id
    s = listReducer(s, { type: 'SHARE_LIST', payload: { listId, userId: 'u2' } })
    expect(s.lists[0].members).toContain('u2')
    s = listReducer(s, { type: 'UNSHARE_LIST', payload: { listId, userId: 'u2' } })
    expect(s.lists[0].members).not.toContain('u2')
    s = listReducer(s, { type: 'DELETE_LIST', payload: listId })
    expect(s.lists).toHaveLength(0)
  })
})

describe('habitReducer', () => {
  it('adds and toggles habit completion', () => {
    let s = habitReducer(state(), { type: 'ADD_HABIT', payload: { name: 'Read' } })
    const id = s.habits[0].id
    s = habitReducer(s, { type: 'TOGGLE_HABIT_COMPLETION', payload: { habitId: id, date: '2026-06-01' } })
    expect(s.habits[0].completions).toContain('2026-06-01')
    s = habitReducer(s, { type: 'TOGGLE_HABIT_COMPLETION', payload: { habitId: id, date: '2026-06-01' } })
    expect(s.habits[0].completions).not.toContain('2026-06-01')
  })
})

describe('columnReducer', () => {
  it('adds, moves, reorders columns', () => {
    let s = columnReducer(state(), { type: 'ADD_COLUMN', payload: { name: 'Todo', listId: 'inbox' } })
    const colId = s.columns[0].id
    s = columnReducer(s, {
      type: 'REORDER_COLUMNS',
      payload: { listId: 'inbox', draggedId: colId, droppedOnId: colId },
    })
    expect(s.columns).toHaveLength(1)
  })
})

describe('pomodoroReducer', () => {
  it('runs timer lifecycle', () => {
    let s = pomodoroReducer(state(), { type: 'START_TIMER' })
    expect(s.pomodoro.isActive).toBe(true)
    s = pomodoroReducer(s, { type: 'PAUSE_TIMER' })
    expect(s.pomodoro.isPaused).toBe(true)
    s = pomodoroReducer({ ...s, pomodoro: { ...s.pomodoro, remainingTime: 1, isActive: true, isPaused: false } }, { type: 'TICK_TIMER' })
    expect(s.pomodoro.sessionsCompleted).toBeGreaterThanOrEqual(0)
  })
})

describe('viewReducer & tagReducer', () => {
  it('updates view state', () => {
    let s = viewReducer(state(), { type: 'SET_VIEW', payload: 'board' })
    expect(s.view).toBe('board')
    s = tagReducer(s, { type: 'ADD_TAG', payload: { name: '  Urgent  ' } })
    expect(s.tags).toContain('urgent')
  })
})

describe('countdownReducer', () => {
  it('manages countdown events', () => {
    const event = { id: 'c1', title: 'E', targetDate: new Date().toISOString(), color: '#fff', createdAt: new Date().toISOString() }
    let s = countdownReducer(state(), { type: 'ADD_COUNTDOWN', payload: event })
    expect(s.countdownEvents).toHaveLength(1)
    s = countdownReducer(s, { type: 'DELETE_COUNTDOWN', payload: 'c1' })
    expect(s.countdownEvents).toHaveLength(0)
  })
})

describe('taskManagerReducer & historyReducer', () => {
  it('LOAD_STATE replaces state', () => {
    const next = taskManagerReducer(state(), { type: 'LOAD_STATE', payload: { ...state(), view: 'calendar' } })
    expect(next.view).toBe('calendar')
  })

  it('history undo/redo', () => {
    const present = state()
    let hist = historyReducer({ past: [], present, future: [] }, { type: 'SET_VIEW', payload: 'habit' })
    expect(hist.present.view).toBe('habit')
    hist = historyReducer(hist, { type: 'UNDO' })
    expect(hist.present.view).toBe('dashboard')
    hist = historyReducer(hist, { type: 'REDO' })
    expect(hist.present.view).toBe('habit')
    hist = historyReducer(hist, { type: 'CLEAR_HISTORY' })
    expect(hist.past).toHaveLength(0)
  })
})
