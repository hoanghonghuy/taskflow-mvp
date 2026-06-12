export const DEFAULT_TIME_ZONE = 'Asia/Ho_Chi_Minh'

const dateOnlyFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone })

/** Calendar date YYYY-MM-DD in the given IANA timezone (default Vietnam). */
export function todayDateString(timeZone: string = DEFAULT_TIME_ZONE): string {
  return dateOnlyFormatter(timeZone).format(new Date())
}

/** Format an instant as calendar date YYYY-MM-DD in the given timezone (default Vietnam). */
export function dateOnlyFromDate(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  return dateOnlyFormatter(timeZone).format(date)
}
