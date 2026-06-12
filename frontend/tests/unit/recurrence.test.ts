import { describe, expect, it } from 'vitest'
import { buildRecurrencePattern, getNextOccurrence } from '@/lib/utils/recurrence'

describe('recurrence utils', () => {
  it('buildRecurrencePattern defaults interval to 1', () => {
    expect(buildRecurrencePattern('daily')).toEqual({ type: 'daily', interval: 1 })
  })

  it('getNextOccurrence advances daily', () => {
    const from = new Date('2026-06-10T08:00:00.000Z')
    const next = getNextOccurrence(from, { type: 'daily', interval: 1 })
    expect(next?.toISOString().slice(0, 10)).toBe('2026-06-11')
  })
})
