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

/**
 * Expand recurring task instances within calendar range.
 * Returns virtual tasks with ID suffix `_YYYY-MM-DD` for each occurrence.
 */
export function expandRecurringTask(
  task: { id: string; dueDate?: string; recurrence?: RecurrencePattern },
  rangeStart: Date,
  rangeEnd: Date,
  maxInstances: number = 100,
): Array<{ id: string; instanceDate: Date }> {
  if (!task.recurrence || !task.dueDate) return []

  const instances: Array<{ id: string; instanceDate: Date }> = []
  const start = startOfDay(rangeStart)
  const end = startOfDay(rangeEnd)
  const anchor = startOfDay(new Date(task.dueDate))

  let current = anchor < start ? start : anchor

  // Find first occurrence >= rangeStart
  if (anchor < start) {
    let candidate = anchor
    for (let i = 0; i < 1000; i++) {
      const nextCandidate = getNextOccurrence(candidate, task.recurrence)
      if (!nextCandidate || nextCandidate >= start) {
        current = nextCandidate || candidate
        break
      }
      candidate = nextCandidate
    }
  }

  // Generate instances in range
  for (let i = 0; i < maxInstances; i++) {
    if (current > end) break
    if (current >= start) {
      const isoDate = current.toISOString().slice(0, 10)
      instances.push({ id: `${task.id}_${isoDate}`, instanceDate: new Date(current) })
    }
    const next = getNextOccurrence(current, task.recurrence)
    if (!next) break
    current = next
  }

  return instances
}
