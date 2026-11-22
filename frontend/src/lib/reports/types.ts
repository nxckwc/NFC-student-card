import type { ReportStatus } from './freshness'

export type ReportType = 'student' | 'class' | 'subject' | 'arrival'
export type ReportKind = 'all' | 'gate' | 'room'

export interface ReportStudent {
  id: string
  studentId: string | null
  firstName: string
  lastName: string
  classSection: string | null
}

export interface StudentProfile {
  id: string
  studentId: string | null
  firstName: string
  lastName: string
}

export interface ReportVersion {
  attendance: number
  corrections: number
}

// What the backend returns next to the report: its cache key and freshness data.
export interface ReportMeta {
  key: string
  type: ReportType
  status: ReportStatus
  start: string
  end: string
  params: { type: ReportType; start: string; end: string; studentId?: string; kind?: ReportKind; className?: string; subject?: string; classes?: string[] | null }
  cache: 'hit' | 'miss'
  version: ReportVersion
  schoolDate: string
}

interface ReportBase {
  start: string
  end: string
  timezone: string
  lateCutoff: string
  generatedAt: string
}

export interface StudentReport extends ReportBase {
  student: ReportStudent
  kind: ReportKind
  summary: {
    gateDays: number
    onTimeGateDays: number
    lateGateDays: number
    gateLateRate: number | null
    roomSessions: number
    presentRoomSessions: number
    lateRoomSessions: number
  }
  records: {
    id: string
    type: 'GATE' | 'ROOM'
    date: string
    status: string
    state: string | null
    arrivalAt: string
    departureAt: string | null
    subject: string | null
    className: string | null
    roomId: string | null
    period: number | null
  }[]
}

export interface ClassReport extends ReportBase {
  type: 'class'
  className: string
  summary: {
    students: number
    gateDays: number
    lateGateDays: number
    gateLateRate: number | null
    roomSessions: number
    presentRoomSessions: number
    lateRoomSessions: number
  }
  rows: { student: StudentProfile; gateDays: number; lateGateDays: number; roomSessions: number; presentRoomSessions: number; lateRoomSessions: number }[]
}

export interface SubjectReport extends ReportBase {
  type: 'subject'
  className: string
  subject: string
  summary: { students: number; sessions: number; presentRecords: number; lateRecords: number }
  rows: { student: StudentProfile; present: number; late: number; attended: number; noRecord: number }[]
}

export interface ArrivalReport extends ReportBase {
  type: 'arrival'
  classes: string[] | null
  summary: { students: number; gateDays: number; onTimeGateDays: number; lateGateDays: number; gateLateRate: number | null }
  daily: { date: string; arrived: number; late: number }[]
  rows: { student: StudentProfile; gateDays: number; lateGateDays: number; averageArrival: string | null; latestArrival: string | null }[]
}

export type ReportPayload = StudentReport | ClassReport | SubjectReport | ArrivalReport

// One generated report as saved in this browser. `meta.type` says which payload it is.
export interface StoredReport {
  id: string
  userId: number
  key: string
  savedAt: number
  meta: ReportMeta
  report: ReportPayload
}

export interface GenerateRequest {
  type: ReportType
  studentId?: string
  kind?: ReportKind
  className?: string
  subject?: string
  start: string
  end: string
}
