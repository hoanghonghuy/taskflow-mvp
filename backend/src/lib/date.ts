export const DEFAULT_TIME_ZONE = 'Asia/Ho_Chi_Minh'

const dateOnlyFormatter = (timeZone: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone })

/** Calendar date YYYY-MM-DD in the given IANA timezone (default Vietnam). */
export function todayDateString(timeZone: string = DEFAULT_TIME_ZONE): string {
  return dateOnlyFormatter(timeZone).format(new Date())
}

/** Calendar date YYYY-MM-DD in UTC — use for server defaults when the client omits a date. */
export function todayUtcDateString(): string {
  return todayDateString('UTC')
}

/** Format an instant as calendar date YYYY-MM-DD in the given timezone (default Vietnam). */
export function dateOnlyFromDate(date: Date, timeZone: string = DEFAULT_TIME_ZONE): string {
  return dateOnlyFormatter(timeZone).format(date)
}
