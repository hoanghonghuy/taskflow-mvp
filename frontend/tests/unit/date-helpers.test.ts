import { describe, expect, it } from 'vitest'
import {
  addDays,
  endOfDay,
  isFuture,
  isOverdue,
  isSameDay,
  isTomorrow,
  startOfDay,
  toYYYYMMDD,
} from '@/lib/utils/date-helpers'

describe('date-helpers', () => {
  const today = new Date()
  today.setHours(12, 0, 0, 0)

  it('detects today, tomorrow, future, overdue', () => {
    expect(isTomorrow(addDays(today, 1))).toBe(true)
    expect(isFuture(addDays(today, 5))).toBe(true)
    expect(isOverdue(addDays(today, -2))).toBe(true)
  })

  it('isSameDay compares dates', () => {
    expect(isSameDay(today, new Date(today))).toBe(true)
    expect(isSameDay(today, addDays(today, 1))).toBe(false)
    expect(isSameDay(null as unknown as Date, today)).toBe(false)
  })

  it('toYYYYMMDD and day boundaries', () => {
    expect(toYYYYMMDD(today)).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(startOfDay(today).getHours()).toBe(0)
    expect(endOfDay(today).getHours()).toBe(23)
  })
})
