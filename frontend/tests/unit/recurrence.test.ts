import { describe, expect, it } from 'vitest'
import { buildRecurrencePattern, expandRecurringTask, getNextOccurrence } from '@/lib/utils/recurrence'

describe('recurrence utils', () => {
  it('buildRecurrencePattern defaults interval to 1', () => {
    expect(buildRecurrencePattern('daily')).toEqual({ type: 'daily', interval: 1 })
  })

  it('buildRecurrencePattern stores seriesStart', () => {
    expect(buildRecurrencePattern('weekly', '2026-06-01')).toEqual({
      type: 'weekly',
      interval: 1,
      seriesStart: '2026-06-01',
    })
  })

  it('getNextOccurrence advances daily', () => {
    const from = new Date('2026-06-10T08:00:00.000Z')
    const next = getNextOccurrence(from, { type: 'daily', interval: 1 })
    expect(next?.toISOString().slice(0, 10)).toBe('2026-06-11')
  })

  it('expandRecurringTask generates instances in range', () => {
    const task = {
      id: 'task-123',
      dueDate: '2026-06-01T09:00:00.000Z',
      recurrence: { type: 'daily' as const, interval: 1 },
    }
    const instances = expandRecurringTask(
      task,
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-05T23:59:59.999Z'),
    )
    expect(instances.length).toBe(5)
    expect(instances[0].id).toBe('task-123_2026-06-01')
    expect(instances[4].id).toBe('task-123_2026-06-05')
  })

  it('expandRecurringTask respects endDate', () => {
    const task = {
      id: 'task-456',
      dueDate: '2026-06-01T09:00:00.000Z',
      recurrence: {
        type: 'daily' as const,
        interval: 1,
        endDate: '2026-06-03T00:00:00.000Z',
      },
    }
    const instances = expandRecurringTask(
      task,
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-10T23:59:59.999Z'),
    )
    expect(instances.length).toBeLessThanOrEqual(3)
  })

  it('expandRecurringTask returns empty when no recurrence', () => {
    const task = {
      id: 'task-789',
      dueDate: '2026-06-01T09:00:00.000Z',
    }
    const instances = expandRecurringTask(
      task,
      new Date('2026-06-01T00:00:00.000Z'),
      new Date('2026-06-10T23:59:59.999Z'),
    )
    expect(instances).toEqual([])
  })

  it('weekly with daysOfWeek respects interval between weeks', () => {
    // Anchor Monday 2026-06-01; interval 2 → Mon/Wed only on even week offsets
    const seriesStart = new Date('2026-06-01T08:00:00.000Z') // Monday
    const pattern = {
      type: 'weekly' as const,
      interval: 2,
      daysOfWeek: [1, 3], // Mon, Wed
    }

    const wedSameWeek = getNextOccurrence(seriesStart, pattern, seriesStart)
    expect(wedSameWeek?.toISOString().slice(0, 10)).toBe('2026-06-03')

    const nextAfterWed = getNextOccurrence(wedSameWeek!, pattern, seriesStart)
    // Skip week of Jun 8–14; next Mon is Jun 15
    expect(nextAfterWed?.toISOString().slice(0, 10)).toBe('2026-06-15')
  })
})
