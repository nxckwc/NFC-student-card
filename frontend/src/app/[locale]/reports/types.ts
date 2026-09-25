export type ReportKind = 'all' | 'gate' | 'room'

export interface ReportStudent {
  id: string
  studentId: string | null
  firstName: string
  lastName: string
  classSection: string | null
}

export interface AttendanceReport {
  student: ReportStudent
  start: string
  end: string
  kind: ReportKind
  timezone: string
  lateCutoff: string
  generatedAt: string
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
