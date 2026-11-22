// Browser-side twin of the backend's snapshot freshness rule (backend/src/lib/reportRules.ts).
// Keep to erasable TypeScript syntax: the tests run this file directly under Node.

export type ReportStatus = 'FINALIZED' | 'PROVISIONAL'

// A finalized report's range is entirely in the past, so its stored snapshot stays
// valid and can be reopened offline. Only provisional ones must be checked.
export const needsFreshnessCheck = (meta: { status: ReportStatus }): boolean => meta.status === 'PROVISIONAL'

export interface SnapshotVersion {
  status: ReportStatus
  end: string
  version: { attendance: number; corrections: number }
}

// `current` comes from GET /analytics/reports/version (school date is Asia/Bangkok
// by default, never the browser's timezone).
export const isSnapshotFresh = (
  snapshot: SnapshotVersion,
  current: { attendance: number; corrections: number; schoolDate: string },
): boolean => {
  if (snapshot.version.corrections !== current.corrections) return false
  // Historical attendance is immutable under normal updates.
  if (snapshot.status === 'FINALIZED') return true
  // Provisional: stale after newer attendance, or once the range has fully passed
  // (regenerating then lets it finalize with the day's complete data).
  return snapshot.version.attendance === current.attendance && snapshot.end >= current.schoolDate
}
