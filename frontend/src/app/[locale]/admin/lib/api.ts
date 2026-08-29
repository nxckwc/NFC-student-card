import axios from 'axios'

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100').replace(/\/+$/, '')

export interface Account {
  id: number
  username: string
  role: string
  createdAt: string
  updatedAt: string
  _count: { scheduleEntries: number }
}

export interface ScheduleEntry {
  id?: number
  weekday: number
  period: number
  subject: string
  className: string
  roomId: string
  startTime?: string
  endTime?: string
}

export interface AccountDetail extends Account {
  scheduleEntries: ScheduleEntry[]
}

export interface AdminOverview {
  accounts: number
  students: number | null
  attendance: number | null
  scannedStudents: number | null
  scheduledAccounts: number
  studentDataAvailable: boolean
}

export interface Student {
  id: string
  firstName: string
  lastName: string
  uid_card: string
  createdAt: string
  _count: { logs: number }
}

export interface AttendanceLog {
  id: string
  timestamp: string
  status: string
  student: { id: string; firstName: string; lastName: string }
}

export interface SessionUser {
  id: number
  username: string
  role: string
}

export const fetchOverview = async (): Promise<AdminOverview> => {
  const { data } = await axios.get<{ overview: AdminOverview }>(`${API_BASE_URL}/admin/overview`, { withCredentials: true })
  return data.overview
}

export const fetchAccounts = async (search: string): Promise<Account[]> => {
  const { data } = await axios.get<{ accounts: Account[] }>(`${API_BASE_URL}/admin/accounts`, {
    withCredentials: true,
    params: search ? { search } : undefined,
  })
  return data.accounts
}

export const fetchAccount = async (id: number): Promise<AccountDetail> => {
  const { data } = await axios.get<{ account: AccountDetail }>(`${API_BASE_URL}/admin/accounts/${id}`, { withCredentials: true })
  return data.account
}

export const saveAccountSchedule = async (id: number, entries: ScheduleEntry[]): Promise<ScheduleEntry[]> => {
  const { data } = await axios.put<{ success: boolean; schedule: ScheduleEntry[] }>(
    `${API_BASE_URL}/admin/accounts/${id}/schedule`,
    { entries },
    { withCredentials: true },
  )
  return data.schedule
}

export const changeAccountRole = async (id: number, role: 'USER' | 'ADMIN'): Promise<Account> => {
  const { data } = await axios.patch<{ account: Account }>(`${API_BASE_URL}/admin/accounts/${id}/role`, { role }, { withCredentials: true })
  return data.account
}

export const deleteAccountApi = async (id: number): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/admin/accounts/${id}`, { withCredentials: true })
}

export const fetchStudents = async (search: string): Promise<{ students: Student[] | null; studentDataAvailable: boolean }> => {
  const { data } = await axios.get<{ students: Student[] | null; studentDataAvailable: boolean }>(`${API_BASE_URL}/admin/students`, {
    withCredentials: true,
    params: search ? { search } : undefined,
  })
  return data
}

export const createStudent = async (firstName: string, lastName: string): Promise<Student> => {
  const { data } = await axios.post<Student>(`${API_BASE_URL}/student`, { firstName, lastName }, { withCredentials: true })
  return data
}

export const fetchAttendance = async (
  offset: number,
  limit: number,
  search: string,
): Promise<{ logs: AttendanceLog[] | null; total: number | null; studentDataAvailable: boolean }> => {
  const { data } = await axios.get<{ logs: AttendanceLog[] | null; total: number | null; studentDataAvailable: boolean }>(
    `${API_BASE_URL}/admin/attendance`,
    { withCredentials: true, params: { offset, limit, ...(search ? { search } : {}) } },
  )
  return data
}

export const fetchSession = async (): Promise<SessionUser> => {
  const { data } = await axios.get<{ authenticated: boolean; user: SessionUser }>(`${API_BASE_URL}/auth/session`, { withCredentials: true })
  return data.user
}

export const getApiErrorMessage = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? error.response?.data?.error
    return typeof message === 'string' && message.length > 0 ? message : undefined
  }
  return undefined
}
