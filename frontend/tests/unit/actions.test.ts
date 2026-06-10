import { describe, expect, it } from 'vitest'
import {
  taskActions,
  listActions,
  columnActions,
  habitActions,
  pomodoroActions,
  countdownActions,
  viewActions,
  historyActions,
} from '@/lib/store/task-manager/actions'
import type { Task, List, Habit, CountdownEvent, Comment, PomodoroState } from '@/types'

describe('task actions', () => {
  it('add creates ADD_TASK action with generated id', () => {
    const task: Omit<Task, 'id'> = {
      title: 'New task',
      completed: false,
      listId: 'inbox',
      createdAt: '2026-06-10T00:00:00Z',
    }
    const action = taskActions.add(task)
    expect(action.type).toBe('ADD_TASK')
    expect(action.payload).toHaveProperty('id')
    expect(action.payload.title).toBe('New task')
  })

  it('update creates UPDATE_TASK action', () => {
    const task: Task = {
      id: 't1',
      title: 'Updated',
      completed: true,
      listId: 'inbox',
      createdAt: '2026-06-10T00:00:00Z',
    }
    const action = taskActions.update(task)
    expect(action.type).toBe('UPDATE_TASK')
    expect(action.payload).toEqual(task)
  })

  it('delete creates DELETE_TASK action', () => {
    const action = taskActions.delete('t1')
    expect(action.type).toBe('DELETE_TASK')
    expect(action.payload).toBe('t1')
  })

  it('toggle creates TOGGLE_TASK_COMPLETION action', () => {
    const action = taskActions.toggle('t1')
    expect(action.type).toBe('TOGGLE_TASK_COMPLETION')
    expect(action.payload).toEqual({ taskId: 't1' })
  })

  it('assign creates ASSIGN_TASK action', () => {
    const action = taskActions.assign('t1', 'u1')
    expect(action.type).toBe('ASSIGN_TASK')
    expect(action.payload).toEqual({ taskId: 't1', userId: 'u1' })
  })

  it('assign creates ASSIGN_TASK action with null', () => {
    const action = taskActions.assign('t1', null)
    expect(action.type).toBe('ASSIGN_TASK')
    expect(action.payload).toEqual({ taskId: 't1', userId: null })
  })

  it('addComment creates ADD_COMMENT action', () => {
    const comment: Comment = {
      id: 'c1',
      userId: 'u1',
      content: 'Hello',
      timestamp: '2026-06-10T00:00:00Z',
    }
    const action = taskActions.addComment('t1', comment)
    expect(action.type).toBe('ADD_COMMENT')
    expect(action.payload).toEqual({ taskId: 't1', comment })
  })

  it('reorder creates REORDER_TASKS action', () => {
    const action = taskActions.reorder('t1', 't2')
    expect(action.type).toBe('REORDER_TASKS')
    expect(action.payload).toEqual({ draggedId: 't1', droppedOnId: 't2' })
  })

  it('moveToColumn creates MOVE_TASK_TO_COLUMN action', () => {
    const action = taskActions.moveToColumn('t1', 'col2', 'list1')
    expect(action.type).toBe('MOVE_TASK_TO_COLUMN')
    expect(action.payload).toEqual({ taskId: 't1', newColumnId: 'col2', listId: 'list1' })
  })
})

describe('list actions', () => {
  it('add creates ADD_LIST action', () => {
    const list: Omit<List, 'id'> = {
      name: 'Work',
      color: '#fff',
      members: [],
    }
    const action = listActions.add(list)
    expect(action.type).toBe('ADD_LIST')
    expect(action.payload).toEqual(list)
  })

  it('update creates UPDATE_LIST action', () => {
    const list: List = {
      id: 'l1',
      name: 'Updated',
      color: '#000',
      members: ['u1'],
    }
    const action = listActions.update(list)
    expect(action.type).toBe('UPDATE_LIST')
    expect(action.payload).toEqual(list)
  })

  it('delete creates DELETE_LIST action', () => {
    const action = listActions.delete('l1')
    expect(action.type).toBe('DELETE_LIST')
    expect(action.payload).toBe('l1')
  })

  it('share creates SHARE_LIST action', () => {
    const action = listActions.share('l1', 'u2')
    expect(action.type).toBe('SHARE_LIST')
    expect(action.payload).toEqual({ listId: 'l1', userId: 'u2' })
  })

  it('unshare creates UNSHARE_LIST action', () => {
    const action = listActions.unshare('l1', 'u2')
    expect(action.type).toBe('UNSHARE_LIST')
    expect(action.payload).toEqual({ listId: 'l1', userId: 'u2' })
  })
})

describe('column actions', () => {
  it('add creates ADD_COLUMN action', () => {
    const action = columnActions.add('l1', 'To Do')
    expect(action.type).toBe('ADD_COLUMN')
    expect(action.payload).toEqual({ listId: 'l1', name: 'To Do' })
  })

  it('update creates UPDATE_COLUMN action', () => {
    const action = columnActions.update('col1', 'In Progress')
    expect(action.type).toBe('UPDATE_COLUMN')
    expect(action.payload).toEqual({ columnId: 'col1', name: 'In Progress' })
  })

  it('delete creates DELETE_COLUMN action', () => {
    const action = columnActions.delete('col1', 'l1')
    expect(action.type).toBe('DELETE_COLUMN')
    expect(action.payload).toEqual({ columnId: 'col1', listId: 'l1' })
  })

  it('reorder creates REORDER_COLUMNS action', () => {
    const action = columnActions.reorder('l1', 'col1', 'col2')
    expect(action.type).toBe('REORDER_COLUMNS')
    expect(action.payload).toEqual({ listId: 'l1', draggedId: 'col1', droppedOnId: 'col2' })
  })
})

describe('habit actions', () => {
  it('add creates ADD_HABIT action', () => {
    const habit: Omit<Habit, 'id' | 'completions' | 'createdAt'> = {
      name: 'Exercise',
    }
    const action = habitActions.add(habit)
    expect(action.type).toBe('ADD_HABIT')
    expect(action.payload).toEqual(habit)
  })

  it('update creates UPDATE_HABIT action', () => {
    const habit: Habit = {
      id: 'h1',
      name: 'Read',
      completions: ['2026-06-10'],
      createdAt: '2026-06-01T00:00:00Z',
    }
    const action = habitActions.update(habit)
    expect(action.type).toBe('UPDATE_HABIT')
    expect(action.payload).toEqual(habit)
  })

  it('delete creates DELETE_HABIT action', () => {
    const action = habitActions.delete('h1')
    expect(action.type).toBe('DELETE_HABIT')
    expect(action.payload).toBe('h1')
  })

  it('toggleCompletion creates TOGGLE_HABIT_COMPLETION action', () => {
    const action = habitActions.toggleCompletion('h1', '2026-06-10')
    expect(action.type).toBe('TOGGLE_HABIT_COMPLETION')
    expect(action.payload).toEqual({ habitId: 'h1', date: '2026-06-10' })
  })
})

describe('pomodoro actions', () => {
  it('start creates START_TIMER action', () => {
    const action = pomodoroActions.start()
    expect(action.type).toBe('START_TIMER')
  })

  it('pause creates PAUSE_TIMER action', () => {
    const action = pomodoroActions.pause()
    expect(action.type).toBe('PAUSE_TIMER')
  })

  it('reset creates RESET_TIMER action', () => {
    const action = pomodoroActions.reset()
    expect(action.type).toBe('RESET_TIMER')
  })

  it('skipBreak creates COMPLETE_POMODORO_SESSION action', () => {
    const action = pomodoroActions.skipBreak()
    expect(action.type).toBe('COMPLETE_POMODORO_SESSION')
  })

  it('setFocusedTask creates SET_FOCUSED_TASK action', () => {
    const action = pomodoroActions.setFocusedTask('t1')
    expect(action.type).toBe('SET_FOCUSED_TASK')
    expect(action.payload).toBe('t1')
  })

  it('setFocusedTask creates SET_FOCUSED_TASK action with null', () => {
    const action = pomodoroActions.setFocusedTask(null)
    expect(action.type).toBe('SET_FOCUSED_TASK')
    expect(action.payload).toBeNull()
  })

  it('setFocusedHabit creates SET_FOCUSED_HABIT action', () => {
    const action = pomodoroActions.setFocusedHabit('h1')
    expect(action.type).toBe('SET_FOCUSED_HABIT')
    expect(action.payload).toBe('h1')
  })

  it('setFocusedHabit creates SET_FOCUSED_HABIT action with null', () => {
    const action = pomodoroActions.setFocusedHabit(null)
    expect(action.type).toBe('SET_FOCUSED_HABIT')
    expect(action.payload).toBeNull()
  })

  it('updateSettings creates UPDATE_POMODORO_SETTINGS action', () => {
    const settings: Partial<PomodoroState['settings']> = {
      focusDuration: 30,
      shortBreakDuration: 7,
    }
    const action = pomodoroActions.updateSettings(settings)
    expect(action.type).toBe('UPDATE_POMODORO_SETTINGS')
    expect(action.payload).toEqual(settings)
  })
})

describe('countdown actions', () => {
  it('add creates ADD_COUNTDOWN action', () => {
    const event: Omit<CountdownEvent, 'id'> = {
      title: 'Launch',
      targetDate: '2026-12-01T00:00:00Z',
      color: 'blue',
    }
    const action = countdownActions.add(event)
    expect(action.type).toBe('ADD_COUNTDOWN')
    expect(action.payload).toEqual(event)
  })

  it('update creates UPDATE_COUNTDOWN action', () => {
    const event: CountdownEvent = {
      id: 'c1',
      title: 'Updated',
      targetDate: '2027-01-01T00:00:00Z',
      color: 'red',
    }
    const action = countdownActions.update(event)
    expect(action.type).toBe('UPDATE_COUNTDOWN')
    expect(action.payload).toEqual(event)
  })

  it('delete creates DELETE_COUNTDOWN action', () => {
    const action = countdownActions.delete('c1')
    expect(action.type).toBe('DELETE_COUNTDOWN')
    expect(action.payload).toBe('c1')
  })
})

describe('view actions', () => {
  it('setView creates SET_VIEW action', () => {
    const action = viewActions.setView('kanban')
    expect(action.type).toBe('SET_VIEW')
    expect(action.payload).toBe('kanban')
  })

  it('setSelectedTask creates SET_SELECTED_TASK action', () => {
    const action = viewActions.setSelectedTask('t1')
    expect(action.type).toBe('SET_SELECTED_TASK')
    expect(action.payload).toBe('t1')
  })

  it('setSelectedTask creates SET_SELECTED_TASK action with null', () => {
    const action = viewActions.setSelectedTask(null)
    expect(action.type).toBe('SET_SELECTED_TASK')
    expect(action.payload).toBeNull()
  })
})

describe('history actions', () => {
  it('undo creates UNDO action', () => {
    const action = historyActions.undo()
    expect(action.type).toBe('UNDO')
  })

  it('redo creates REDO action', () => {
    const action = historyActions.redo()
    expect(action.type).toBe('REDO')
  })
})
