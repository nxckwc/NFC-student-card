// Calendar helpers on YYYY-MM-DD strings. All math is done in UTC, so the browser's
// timezone can never shift a day. Callers pass days that already passed `parseDay`.

const PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 86_400_000

const pad = (value: number, width: number): string => String(value).padStart(width, '0')

const fromDate = (date: Date): string =>
  `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}`

const toDate = (day: string): Date => new Date(`${day}T00:00:00Z`)

// Null unless `value` is a real calendar date (rejects 2026-02-30, 11/01/2026, …).
export const parseDay = (value: string): { year: number; month: number; day: number } | null => {
  const match = PATTERN.exec(value)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const probe = new Date(Date.UTC(year, month - 1, day))
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
    ? { year, month, day }
    : null
}

// The browser's own calendar day. Only for defaults; school dates come from the backend.
export const localDay = (date: Date): string =>
  `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`

export const addDays = (day: string, count: number): string => fromDate(new Date(toDate(day).getTime() + count * DAY_MS))

// Moves by whole months, clamping the day to the target month (Jan 31 + 1 month = Feb 28/29).
export const addMonths = (day: string, count: number): string => {
  const date = toDate(day)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + count, 1))
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  return fromDate(new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(date.getUTCDate(), lastDay))))
}

export const startOfMonth = (day: string): string => `${day.slice(0, 7)}-01`

export const endOfMonth = (day: string): string => addDays(addMonths(startOfMonth(day), 1), -1)

// 0 = Sunday … 6 = Saturday.
export const weekday = (day: string): number => toDate(day).getUTCDay()

export const startOfWeek = (day: string, weekStart: 0 | 1): string => addDays(day, -((weekday(day) - weekStart + 7) % 7))

// Six full weeks (42 days) covering the month of `day`, beginning on `weekStart`.
export const monthGrid = (day: string, weekStart: 0 | 1 = 0): string[] => {
  const first = startOfWeek(startOfMonth(day), weekStart)
  return Array.from({ length: 42 }, (_, index) => addDays(first, index))
}

// Pulls `day` into [min, max]; either bound may be absent.
export const clampDay = (day: string, min?: string, max?: string): string =>
  min && day < min ? min : max && day > max ? max : day
