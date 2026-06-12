import { getNextOccurrence, parseRecurrence } from '../../src/lib/recurrence'

describe('parseRecurrence', () => {
  it('parses weekly pattern with daysOfWeek', () => {
    const pattern = parseRecurrence(
      JSON.stringify({ type: 'weekly', interval: 2, daysOfWeek: [1, 3] }),
    )
    expect(pattern).toEqual({
      type: 'weekly',
      interval: 2,
      daysOfWeek: [1, 3],
    })
  })

  it('returns null for invalid json', () => {
    expect(parseRecurrence(null)).toBeNull()
    expect(parseRecurrence('{}')).toBeNull()
  })
})

describe('getNextOccurrence', () => {
  it('advances daily by interval', () => {
    const from = new Date('2026-06-01T12:00:00.000Z')
    const next = getNextOccurrence(from, { type: 'daily', interval: 2 })
    expect(next?.toISOString().slice(0, 10)).toBe('2026-06-03')
  })

  it('advances weekly by 7 * interval days', () => {
    const from = new Date('2026-06-01T12:00:00.000Z')
    const next = getNextOccurrence(from, { type: 'weekly', interval: 1 })
    expect(next?.toISOString().slice(0, 10)).toBe('2026-06-08')
  })

  it('finds next allowed weekday', () => {
    // 2026-06-01 is Monday (1)
    const from = new Date('2026-06-01T12:00:00.000Z')
    const next = getNextOccurrence(from, {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [1, 3],
    })
    expect(next?.toISOString().slice(0, 10)).toBe('2026-06-03')
  })

  it('advances monthly preserving day of month', () => {
    const from = new Date('2026-06-15T12:00:00.000Z')
    const next = getNextOccurrence(from, { type: 'monthly', interval: 1 })
    expect(next?.toISOString().slice(0, 10)).toBe('2026-07-15')
  })

  it('returns null when past endDate', () => {
    const from = new Date('2026-06-01T12:00:00.000Z')
    const next = getNextOccurrence(from, {
      type: 'daily',
      interval: 1,
      endDate: '2026-06-01T00:00:00.000Z',
    })
    expect(next).toBeNull()
  })
})
