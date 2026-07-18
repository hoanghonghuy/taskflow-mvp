/**
 * Date helper functions for task filtering and grouping
 */

export const isToday = (date: Date): boolean => {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date.getDate() === tomorrow.getDate() &&
         date.getMonth() === tomorrow.getMonth() &&
         date.getFullYear() === tomorrow.getFullYear()
}

export const isFuture = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const otherDate = new Date(date)
  otherDate.setHours(0, 0, 0, 0)
  return otherDate.getTime() > today.getTime()
}

export const isOverdue = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkDate = new Date(date)
  checkDate.setHours(0, 0, 0, 0)
  return checkDate.getTime() < today.getTime()
}

export const isPast = (date: Date): boolean => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() < today.getTime()
}

export const isSameDay = (date1: Date, date2: Date): boolean => {
  if (!date1 || !date2) return false
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

export const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const addDays = (date: Date, amount: number): Date => {
  const newDate = new Date(date)
  newDate.setDate(newDate.getDate() + amount)
  return newDate
}

export const startOfDay = (date: Date): Date => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  return start
}

export const endOfDay = (date: Date): Date => {
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  return end
}

/**
 * Convert an HTML date input value (YYYY-MM-DD) to ISO using local calendar day.
 * Avoids `new Date('YYYY-MM-DD')` (UTC midnight) shifting the day west of UTC.
 */
export const dateOnlyInputToIso = (dateOnly: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly.trim())
  if (!match) {
    return new Date(dateOnly).toISOString()
  }
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  // Noon local reduces DST edge cases while keeping the calendar day stable.
  return new Date(year, month - 1, day, 12, 0, 0, 0).toISOString()
}

