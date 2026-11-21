import axios from 'axios'
import { API_BASE_URL } from '@/config/env'
import { recordId } from './store'
import type { GenerateRequest, ReportMeta, ReportPayload, ReportStudent, StoredReport } from './types'

const credentials = { withCredentials: true }

export const fetchSessionUserId = async (signal?: AbortSignal): Promise<number> =>
  (await axios.get<{ user: { id: number } }>(`${API_BASE_URL}/auth/session`, { ...credentials, signal })).data.user.id

export const fetchReportStudents = async (signal?: AbortSignal): Promise<ReportStudent[]> =>
  (await axios.get<{ students: ReportStudent[] }>(`${API_BASE_URL}/analytics/students`, { ...credentials, signal })).data.students

export const fetchReportVersion = async (signal?: AbortSignal) =>
  (await axios.get<{ attendance: number; corrections: number; schoolDate: string }>(`${API_BASE_URL}/analytics/reports/version`, { ...credentials, signal })).data

// Asks the backend for a report; it may come from the shared (tier 2) cache.
export const requestReport = async (request: GenerateRequest, userId: number, signal?: AbortSignal): Promise<StoredReport> => {
  const { data } = await axios.post<{ report: ReportPayload; meta: ReportMeta }>(`${API_BASE_URL}/analytics/reports`, request, { ...credentials, signal })
  return { id: recordId(userId, data.meta.key), userId, key: data.meta.key, savedAt: Date.now(), meta: data.meta, report: data.report }
}

// Rebuilds the request that produced a stored report, to refresh it.
export const requestFor = (meta: ReportMeta): GenerateRequest => {
  const { params } = meta
  return {
    type: meta.type, start: meta.start, end: meta.end,
    ...(params.studentId ? { studentId: params.studentId, kind: params.kind } : {}),
    // An arrival report scoped to a single class was requested with that class.
    ...(params.className ? { className: params.className } : {}),
    ...(meta.type === 'arrival' && params.classes?.length === 1 ? { className: params.classes[0] } : {}),
    ...(params.subject ? { subject: params.subject } : {}),
  }
}
