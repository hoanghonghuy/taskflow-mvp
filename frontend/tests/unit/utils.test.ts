import { describe, expect, it } from 'vitest'
import { cn, formatDate, generateId, getDaysUntil, isPast, isToday } from '@/lib/utils'

describe('utils', () => {
  it('cn merges class names', () => {
    expect(cn('a', false && 'b', 'c')).toContain('a')
  })

  it('formatDate formats ISO string', () => {
    expect(formatDate('2026-06-01T00:00:00.000Z')).toMatch(/Jun/)
  })

  it('isToday detects today', () => {
    expect(isToday(new Date())).toBe(true)
    expect(isToday('2000-01-01')).toBe(false)
  })

  it('isPast detects past dates', () => {
    expect(isPast('2000-01-01')).toBe(true)
  })

  it('getDaysUntil returns day diff', () => {
    const future = new Date()
    future.setDate(future.getDate() + 3)
    expect(getDaysUntil(future)).toBeGreaterThanOrEqual(2)
  })

  it('generateId returns unique strings', () => {
    expect(generateId()).not.toBe(generateId())
  })
})
