// Pure rules for the shared report cache. Nothing here touches the database.
import { createHash } from 'node:crypto'

export type ReportStatus = 'FINALIZED' | 'PROVISIONAL'
export type ReportType = 'student' | 'class' | 'subject' | 'arrival'
export type StudentReportKind = 'all' | 'gate' | 'room'

// YYYY-MM-DD for `now` in the school's timezone (en-CA formats dates as ISO).
export const schoolDate = (now: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)

// A report is finalized when its whole range lies before the current school date.
export const reportStatus = (endDate: string, today: string): ReportStatus =>
  endDate < today ? 'FINALIZED' : 'PROVISIONAL'

// A range must span fewer than this many days (matches the analytics service).
export const MAX_RANGE_DAYS = 366

const missing = (value: unknown): boolean => value === undefined || value === null || value === ''

// Whole days since the epoch for a real YYYY-MM-DD date, otherwise null.
const dayNumber = (value: unknown): number | null => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const ms = Date.parse(`${value}T00:00:00Z`)
  return Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== value ? null : ms / 86_400_000
}

// Fills defaults (end = today, start = first of end's month) and validates the span.
// Future end dates are allowed; the result is null when the range is unusable.
export const resolveRange = (start: unknown, end: unknown, today: string): { start: string; end: string } | null => {
  const endValue = missing(end) ? today : end
  const endDay = dayNumber(endValue)
  if (endDay === null) return null
  const startValue = missing(start) ? `${(endValue as string).slice(0, 7)}-01` : start
  const startDay = dayNumber(startValue)
  if (startDay === null || startDay > endDay || endDay - startDay >= MAX_RANGE_DAYS) return null
  return { start: startValue as string, end: endValue as string }
}

export interface ReportInput {
  type: ReportType
  start: string
  end: string
  studentId?: string
  kind?: StudentReportKind
  className?: string
  subject?: string
  // Arrival scope after authorization: the classes covered, or null for the whole school.
  classes?: string[] | null
}

export type CanonicalReport =
  | { type: 'student'; start: string; end: string; studentId: string; kind: StudentReportKind }
  | { type: 'class'; start: string; end: string; className: string }
  | { type: 'subject'; start: string; end: string; className: string; subject: string }
  | { type: 'arrival'; start: string; end: string; classes: string[] | null }

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

// Keeps only the parameters that belong to the report type, normalized, so
// equivalent requests share one key and unrelated fields cannot fragment the cache.
export const canonicalReport = (input: ReportInput): CanonicalReport => {
  const { type, start, end } = input
  switch (type) {
    case 'student': return { type, start, end, studentId: text(input.studentId), kind: input.kind ?? 'all' }
    case 'class': return { type, start, end, className: text(input.className) }
    case 'subject': return { type, start, end, className: text(input.className), subject: text(input.subject) }
    case 'arrival': return { type, start, end, classes: input.classes ? [...new Set(input.classes.map(text))].sort() : null }
  }
}

// Object keys are inserted in a fixed order above, so the JSON form is canonical.
export const cacheKey = (report: CanonicalReport): string =>
  createHash('sha256').update(JSON.stringify(report)).digest('hex')

// Monotonic counters kept by the database. `attendance` moves on every attendance
// write; `corrections` moves on historical corrections (student edits/deletes,
// school settings) and invalidates finalized snapshots too.
export interface DataVersion {
  attendance: number
  corrections: number
}

export interface SnapshotMeta {
  status: ReportStatus
  end: string
  attendanceVersion: number
  correctionsVersion: number
}

export const isSnapshotFresh = (snapshot: SnapshotMeta, current: DataVersion, today: string): boolean => {
  if (snapshot.correctionsVersion !== current.corrections) return false
  // Historical attendance is immutable under normal updates.
  if (snapshot.status === 'FINALIZED') return true
  // A provisional snapshot whose range has fully passed is regenerated so it can finalize.
  return snapshot.attendanceVersion === current.attendance && reportStatus(snapshot.end, today) === 'PROVISIONAL'
}
