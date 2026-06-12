import { dateOnlyFromDate, todayDateString } from '../../src/lib/date'

describe('date helpers', () => {
  it('returns YYYY-MM-DD for Asia/Ho_Chi_Minh', () => {
    const value = todayDateString('Asia/Ho_Chi_Minh')
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('dateOnlyFromDate uses timezone calendar day, not UTC slice', () => {
    // 2026-06-12 20:00 UTC = 2026-06-13 03:00 in Vietnam
    const instant = new Date('2026-06-12T20:00:00.000Z')
    expect(instant.toISOString().slice(0, 10)).toBe('2026-06-12')
    expect(dateOnlyFromDate(instant, 'Asia/Ho_Chi_Minh')).toBe('2026-06-13')
    expect(dateOnlyFromDate(instant, 'UTC')).toBe('2026-06-12')
  })
})
