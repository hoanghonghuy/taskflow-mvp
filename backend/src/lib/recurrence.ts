import { dateOnlyFromDate, DEFAULT_TIME_ZONE } from './date'
import { parseJsonObject, toJsonString } from './json'

export type RecurrenceType = 'daily' | 'weekly' | 'monthly'

export interface RecurrenceInput {
  type: RecurrenceType
  interval: number
  daysOfWeek?: number[]
  endDate?: string
}

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

export function parseRecurrence(raw: string | null | undefined): RecurrenceInput | null {
  const obj = parseJsonObject<{
    type?: string
    interval?: number
    daysOfWeek?: number[]
    endDate?: string
  }>(raw)

  if (!obj?.type) return null

  const typeRaw = String(obj.type).toLowerCase()
  const type: RecurrenceType =
    typeRaw === 'weekly' ? 'weekly' : typeRaw === 'monthly' ? 'monthly' : 'daily'

  const daysOfWeek = Array.isArray(obj.daysOfWeek)
    ? obj.daysOfWeek.map((d) => Number(d)).filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6)
    : undefined

  return {
    type,
    interval: typeof obj.interval === 'number' && obj.interval > 0 ? obj.interval : 1,
    ...(daysOfWeek && daysOfWeek.length > 0 ? { daysOfWeek } : {}),
    ...(obj.endDate ? { endDate: String(obj.endDate) } : {}),
  }
}

/** Next occurrence strictly after `fromDate` (calendar day of `fromDate`). */
export function getNextOccurrence(fromDate: Date, pattern: RecurrenceInput): Date | null {
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

/** YYYY-MM-DD completion log stored inside recurrence JSON (for open recurring tasks). */
export function getCompletionDatesFromRecurrence(raw: string | null | undefined): string[] {
  const obj = parseJsonObject<{ completedDates?: unknown }>(raw)
  if (!Array.isArray(obj?.completedDates)) return []
  return obj.completedDates
    .map((d) => String(d))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
}

export function appendCompletionDate(
  raw: string | null | undefined,
  at: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): string {
  const obj = parseJsonObject<Record<string, unknown>>(raw) ?? {}
  const dateStr = dateOnlyFromDate(at, timeZone)
  const existing = getCompletionDatesFromRecurrence(raw)
  const merged = existing.includes(dateStr) ? existing : [...existing, dateStr]
  return toJsonString({ ...obj, completedDates: merged })
}
