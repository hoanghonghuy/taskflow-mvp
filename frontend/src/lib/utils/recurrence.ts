import type { RecurrencePattern } from '@/types'
import type { TranslationKey } from '@/lib/i18n/types'

/** Calendar day in UTC — matches API ISO date strings. */
function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function isPastEnd(date: Date, endDate?: string): boolean {
  if (!endDate) return false
  return startOfDay(date) > startOfDay(new Date(endDate))
}

/** Next occurrence strictly after `fromDate` (calendar day of `fromDate`). */
export function getNextOccurrence(fromDate: Date, pattern: RecurrencePattern): Date | null {
  const anchor = startOfDay(fromDate)
  const interval = Math.max(1, pattern.interval || 1)

  if (isPastEnd(anchor, pattern.endDate)) return null

  let next: Date

  switch (pattern.type) {
    case 'daily':
      next = new Date(anchor)
      next.setUTCDate(next.getUTCDate() + interval)
      break
    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const allowed = new Set(pattern.daysOfWeek)
        next = new Date(anchor)
        for (let i = 0; i < 366; i++) {
          next.setUTCDate(next.getUTCDate() + 1)
          if (allowed.has(next.getUTCDay())) break
        }
      } else {
        next = new Date(anchor)
        next.setUTCDate(next.getUTCDate() + 7 * interval)
      }
      break
    case 'monthly': {
      const dayOfMonth = anchor.getUTCDate()
      next = new Date(anchor)
      next.setUTCMonth(next.getUTCMonth() + interval)
      const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate()
      next.setUTCDate(Math.min(dayOfMonth, lastDay))
      break
    }
    default:
      return null
  }

  return isPastEnd(next, pattern.endDate) ? null : next
}

export function recurrenceTypeKey(type: RecurrencePattern['type']): TranslationKey {
  return `recurrence.${type}` as TranslationKey
}

export function buildRecurrencePattern(type: RecurrencePattern['type']): RecurrencePattern {
  return { type, interval: 1 }
}
