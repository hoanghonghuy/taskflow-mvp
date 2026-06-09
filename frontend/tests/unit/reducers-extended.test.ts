import { describe, expect, it } from 'vitest'
import { INITIAL_STATE } from '@/lib/store/task-manager/initial-state'
import { taskReducer } from '@/lib/store/task-manager/reducers/task-reducer'
import { listReducer } from '@/lib/store/task-manager/reducers/list-reducer'
import { columnReducer } from '@/lib/store/task-manager/reducers/column-reducer'
import { pomodoroReducer } from '@/lib/store/task-manager/reducers/pomodoro-reducer'
import { viewReducer } from '@/lib/store/task-manager/reducers/view-reducer'
import { tagReducer } from '@/lib/store/task-manager/reducers/tag-reducer'
import { countdownReducer } from '@/lib/store/task-manager/reducers/countdown-reducer'
import { taskActions, listActions, habitActions } from '@/lib/store/task-manager/actions'
import { taskManagerReducer } from '@/lib/store/task-manager/reducer'
import type { AppState, Task } from '@/types'

const state = (): AppState => structuredClone(INITIAL_STATE)

const sampleTask = (): Task => ({
  id: 't1',
  title: 'T',
  description: '',
  completed: false,
  priority: 'none',
  listId: 'inbox',
  tags: ['a'],
  subtasks: [],
  comments: [],
  assigneeId: null,
})

describe('extended reducers', () => {
  it('taskReducer handles update, assign, comment', () => {
    let s = { ...state(), tasks: [sampleTask()] }
    const updated = { ...sampleTask(), title: 'New' }
    s = taskReducer(s, { type: 'UPDATE_TASK', payload: updated })
    expect(s.tasks[0].title).toBe('New')
    s = taskReducer(s, { type: 'ASSIGN_TASK', payload: { taskId: 't1', userId: 'u2' } })
    expect(s.tasks[0].assigneeId).toBe('u2')
    s = taskReducer(s, {
      type: 'ADD_COMMENT',
      payload: { taskId: 't1', comment: { id: 'c1', userId: 'u1', content: 'hi', timestamp: new Date().toISOString() } },
    })
    expect(s.tasks[0].comments).toHaveLength(1)
  })

  it('listReducer update members and delete', () => {
    let s = listReducer(state(), { type: 'ADD_LIST', payload: { id: 'l1', name: 'L', color: '#fff', members: [] } })
    s = listReducer(s, { type: 'UPDATE_LIST', payload: { id: 'l1', name: 'L2', color: '#000', members: ['u1'] } })
    expect(s.lists[0].name).toBe('L2')
    s = listReducer(s, { type: 'UPDATE_LIST_MEMBERS', payload: { listId: 'l1', memberIds: ['u2'] } })
    expect(s.lists[0].members).toEqual(['u2'])
  })

  it('columnReducer update, delete, move task', () => {
    let s = columnReducer(state(), { type: 'ADD_COLUMN', payload: { name: 'C1', listId: 'inbox' } })
    const col1 = s.columns[0].id
    s = columnReducer(s, { type: 'ADD_COLUMN', payload: { name: 'C2', listId: 'inbox' } })
    const col2 = s.columns[1].id
    s = columnReducer(s, { type: 'UPDATE_COLUMN', payload: { columnId: col1, name: 'Renamed' } })
    s = {
      ...s,
      tasks: [{ ...sampleTask(), columnId: col2, listId: 'inbox' }],
    }
    s = columnReducer(s, { type: 'DELETE_COLUMN', payload: { columnId: col2, listId: 'inbox' } })
    s = columnReducer(s, {
      type: 'MOVE_TASK_TO_COLUMN',
      payload: { taskId: 't1', newColumnId: col1, listId: 'inbox' },
    })
    expect(s.tasks[0].columnId).toBe(col1)
  })

  it('pomodoroReducer focus session with task and settings', () => {
    let s = pomodoroReducer(state(), { type: 'SET_FOCUSED_TASK', payload: 't1' })
    expect(s.pomodoro.focusedTaskId).toBe('t1')
    s = pomodoroReducer(s, { type: 'SET_FOCUSED_HABIT', payload: 'h1' })
    expect(s.pomodoro.focusedHabitId).toBe('h1')
    s = pomodoroReducer(s, { type: 'RESET_TIMER' })
    s = pomodoroReducer(
      { ...s, pomodoro: { ...s.pomodoro, currentSession: 'shortBreak', isActive: true } },
      { type: 'RESET_TIMER' },
    )
    s = pomodoroReducer(s, { type: 'UPDATE_POMODORO_SETTINGS', payload: { focusDuration: 30 } })
    expect(s.pomodoro.settings.focusDuration).toBe(30)
    s = pomodoroReducer(
      {
        ...s,
        pomodoro: {
          ...s.pomodoro,
          isActive: true,
          isPaused: false,
          remainingTime: 1,
          currentSession: 'focus',
          focusedTaskId: 't1',
          sessionsCompleted: 0,
          settings: { ...s.pomodoro.settings, sessionsUntilLongBreak: 4 },
        },
      },
      { type: 'TICK_TIMER' },
    )
    expect(s.pomodoro.sessionsCompleted).toBeGreaterThanOrEqual(1)
  })

  it('viewReducer active list/tag and sort', () => {
    let s = viewReducer(state(), { type: 'SET_ACTIVE_LIST', payload: 'work' })
    expect(s.activeListId).toBe('work')
    s = viewReducer(s, { type: 'SET_ACTIVE_TAG', payload: 'urgent' })
    expect(s.activeTag).toBe('urgent')
    s = viewReducer(s, { type: 'SET_SORT_ORDER', payload: 'dueDateAsc' })
    expect(s.sortOrder).toBe('dueDateAsc')
  })

  it('tagReducer delete tag', () => {
    let s = { ...state(), tags: ['old'], tasks: [{ ...sampleTask(), tags: ['old', 'new'] }] }
    s = tagReducer(s, { type: 'DELETE_TAG', payload: 'old' })
    expect(s.tags).not.toContain('old')
    expect(s.tasks[0].tags).toEqual(['new'])
  })

  it('countdownReducer update', () => {
    const event = { id: 'c1', title: 'E', targetDate: new Date().toISOString(), color: '#fff', createdAt: new Date().toISOString() }
    let s = countdownReducer(state(), { type: 'ADD_COUNTDOWN', payload: event })
    s = countdownReducer(s, { type: 'UPDATE_COUNTDOWN', payload: { ...event, title: 'E2' } })
    expect(s.countdownEvents[0].title).toBe('E2')
  })

  it('action creators and composite reducer', () => {
    let s = taskManagerReducer(state(), taskActions.add({ ...sampleTask(), id: undefined as unknown as string }))
    s = taskManagerReducer(s, listActions.add({ id: 'l1', name: 'L', color: '#fff', members: [] }))
    s = taskManagerReducer(s, habitActions.add({ name: 'H' }))
    expect(s.tasks.length + s.lists.length + s.habits.length).toBeGreaterThan(0)
  })
})
