import type {
  CountdownEvent,
  Habit,
  PomodoroSession,
  TodoList,
  TodoTask,
  UserSettings,
} from '@prisma/client'
import { mapTaskToDto } from '../../src/mappers/task.mapper'
import { mapListToDto } from '../../src/mappers/list.mapper'
import { mapHabitToDto } from '../../src/mappers/habit.mapper'
import { mapCountdownToDto } from '../../src/mappers/countdown.mapper'
import { mapSessionToDto } from '../../src/mappers/pomodoro.mapper'
import { mapSettingsToDto, defaultSettingsData } from '../../src/mappers/settings.mapper'

const now = new Date('2026-06-01T12:00:00.000Z')

describe('mappers', () => {
  it('mapTaskToDto parses JSON fields', () => {
    const task = {
      id: 't1',
      title: 'Task',
      description: 'desc',
      completed: false,
      createdAt: now,
      dueDate: now,
      priority: 'high',
      listId: 'inbox',
      tags: '["a","b"]',
      subtasks: '[{"id":"s1","title":"Sub","completed":true}]',
      comments: '[{"id":"c1","userId":"u1","content":"hi","timestamp":"2026-06-01T00:00:00.000Z"}]',
      recurrence: '{"type":"daily","interval":1}',
      reminderMinutes: 15,
      assigneeId: 'u2',
      columnId: 'col1',
      sortOrder: 2,
      userId: 'u1',
    } as TodoTask

    const dto = mapTaskToDto(task)
    expect(dto.tags).toEqual(['a', 'b'])
    expect(dto.subtasks).toHaveLength(1)
    expect(dto.comments).toHaveLength(1)
    expect(dto.recurrence?.type).toBe('daily')
    expect(dto.dueDate).toBe(now.toISOString())
    expect(dto.sortOrder).toBe(2)
  })

  it('mapTaskToDto handles invalid JSON gracefully', () => {
    const task = {
      id: 't2',
      title: 'X',
      description: null,
      completed: true,
      createdAt: now,
      dueDate: null,
      priority: 'none',
      listId: 'inbox',
      tags: 'not-json',
      subtasks: '',
      comments: '',
      recurrence: null,
      reminderMinutes: null,
      assigneeId: null,
      columnId: null,
      sortOrder: 0,
      userId: 'u1',
    } as TodoTask

    const dto = mapTaskToDto(task)
    expect(dto.sortOrder).toBe(0)
    expect(dto.tags).toEqual([])
    expect(dto.subtasks).toEqual([])
    expect(dto.recurrence).toBeNull()
  })

  it('mapListToDto parses members', () => {
    const list = {
      id: 'l1',
      name: 'Work',
      color: '#fff',
      members: '["u1","u2"]',
      userId: 'u1',
      createdAt: now,
    } as TodoList
    expect(mapListToDto(list).members).toEqual(['u1', 'u2'])
  })

  it('mapHabitToDto parses completions', () => {
    const habit = {
      id: 'h1',
      name: 'Read',
      completions: '["2026-06-01"]',
      createdAt: now,
      userId: 'u1',
    } as Habit
    expect(mapHabitToDto(habit).completions).toEqual(['2026-06-01'])
  })

  it('mapCountdownToDto', () => {
    const event = {
      id: 'c1',
      title: 'Launch',
      targetDate: now,
      color: '#3b82f6',
      createdAt: now,
      userId: 'u1',
    } as CountdownEvent
    expect(mapCountdownToDto(event).title).toBe('Launch')
  })

  it('mapSessionToDto', () => {
    const session = {
      id: 'p1',
      startTime: now,
      durationSeconds: 1500,
      type: 'focus',
      taskId: 't1',
      habitId: null,
      userId: 'u1',
      createdAt: now,
    } as PomodoroSession
    expect(mapSessionToDto(session).type).toBe('focus')
  })

  it('mapSettingsToDto and defaultSettingsData', () => {
    const settings = {
      id: 's1',
      userId: 'u1',
      language: 'vi',
      theme: 'dark',
      notifications: false,
      soundEnabled: true,
      autoStartPomodoro: true,
      defaultPriority: 'low',
      defaultListId: 'work',
      bottomNavActions: '["dashboard"]',
      geminiApiKey: 'key',
      pomodoroStateJson: null,
      pomodoroStateUpdatedAt: null,
    } as UserSettings

    expect(mapSettingsToDto(settings).language).toBe('vi')
    expect(defaultSettingsData('u1').userId).toBe('u1')
  })
})
