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

/** Week offset from series start (Sunday-based UTC weeks). */
function weekIndexFromSeries(date: Date, seriesAnchor: Date): number {
  const dayMs = 24 * 60 * 60 * 1000
  const anchorWeekStart = new Date(seriesAnchor)
  anchorWeekStart.setUTCDate(anchorWeekStart.getUTCDate() - anchorWeekStart.getUTCDay())
  anchorWeekStart.setUTCHours(0, 0, 0, 0)
  const dateWeekStart = new Date(date)
  dateWeekStart.setUTCDate(dateWeekStart.getUTCDate() - dateWeekStart.getUTCDay())
  dateWeekStart.setUTCHours(0, 0, 0, 0)
  return Math.round((dateWeekStart.getTime() - anchorWeekStart.getTime()) / (7 * dayMs))
}

/** Next occurrence strictly after `fromDate` (calendar day of `fromDate`). */
export function getNextOccurrence(
  fromDate: Date,
  pattern: RecurrencePattern,
  seriesStart?: Date,
): Date | null {
  const anchor = startOfDay(fromDate)
  const seriesAnchor = startOfDay(seriesStart ?? fromDate)
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
        for (let i = 0; i < 366 * interval; i++) {
          next.setUTCDate(next.getUTCDate() + 1)
          if (!allowed.has(next.getUTCDay())) continue
          const weekIndex = weekIndexFromSeries(startOfDay(next), seriesAnchor)
          if (weekIndex % interval === 0) break
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

export function buildRecurrencePattern(
  type: RecurrencePattern['type'],
  seriesStart?: string,
): RecurrencePattern {
  const start =
    seriesStart?.slice(0, 10) ||
    undefined
  return {
    type,
    interval: 1,
    ...(start ? { seriesStart: start } : {}),
  }
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
  const seriesAnchor = startOfDay(new Date(task.recurrence.seriesStart ?? task.dueDate))
  const anchor = startOfDay(new Date(task.dueDate))

  let current = anchor < start ? start : anchor

  // Find first occurrence >= rangeStart (walk with stable seriesAnchor for interval)
  if (anchor < start) {
    let candidate = anchor
    for (let i = 0; i < 1000; i++) {
      const nextCandidate = getNextOccurrence(candidate, task.recurrence, seriesAnchor)
      if (!nextCandidate || nextCandidate >= start) {
        current = nextCandidate || candidate
        break
      }
      candidate = nextCandidate
    }
  }

  // Generate instances in range from current dueDate forward
  for (let i = 0; i < maxInstances; i++) {
    if (current > end) break
    if (current >= start) {
      const isoDate = current.toISOString().slice(0, 10)
      const [year, month, day] = isoDate.split('-').map(Number)
      const localInstance = new Date(year, month - 1, day)
      instances.push({ id: `${task.id}_${isoDate}`, instanceDate: localInstance })
    }
    const next = getNextOccurrence(current, task.recurrence, seriesAnchor)
    if (!next) break
    current = next
  }

  return instances
}
