import type { Request, Response } from 'express'
import { prisma } from '../lib/prisma.js'
import { publishEntryStatus, subscribeToEntry, type StudentStatus } from '../lib/realtime.js'
import { requireStaff } from '../utils/auth.js'

const getZonedParts = (date: Date, timeZone: string): { dateKey: string; weekday: number } => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    weekday: weekdayMap[values.weekday ?? ''] ?? 1,
  }
}

const dayStartUtc = (dateKey: string): Date => new Date(`${dateKey}T00:00:00.000Z`)

const resolveEntry = async (req: Request, res: Response) => {
  const payload = requireStaff(req, res)
  if (!payload) return null

  const entryId = Number(req.params.entryId)
  if (!Number.isInteger(entryId)) {
    res.status(400).json({ message: 'Invalid schedule entry' })
    return null
  }

  const entry = await prisma.scheduleEntry.findUnique({ where: { id: entryId } })
  if (!entry) {
    res.status(404).json({ message: 'Schedule entry not found' })
    return null
  }
  if (payload.role !== 'ADMIN' && entry.userId !== payload.id) {
    res.status(403).json({ message: 'This schedule entry is not assigned to you' })
    return null
  }
  return entry
}

const getToday = async () => {
  const settings = await prisma.schoolSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  const zoned = getZonedParts(new Date(), settings.timezone)
  return { date: dayStartUtc(zoned.dateKey), weekday: zoned.weekday }
}

const getStatus = (status: string | undefined): StudentStatus => status === 'LATE' ? 'LATE' : status === 'PRESENT' ? 'PRESENT' : 'ABSENT'

export const getNamelist = async (req: Request, res: Response): Promise<void> => {
  const entry = await resolveEntry(req, res)
  if (!entry) return
  const { date } = await getToday()

  const [students, logs] = await Promise.all([
    prisma.student.findMany({ where: { classSection: entry.className }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] }),
    prisma.roomLog.findMany({ where: { date, roomId: entry.roomId, subject: entry.subject, period: entry.period }, select: { studentId: true, status: true, presentAt: true } }),
  ])
  const logByStudent = new Map(logs.map((log) => [log.studentId, log]))

  res.json({
    entry: { id: entry.id, subject: entry.subject, className: entry.className, roomId: entry.roomId, period: entry.period, startTime: entry.startTime, endTime: entry.endTime },
    students: students.map((student) => {
      const log = logByStudent.get(student.id)
      const status: StudentStatus = log ? getStatus(log.status) : 'ABSENT'
      return { id: student.id, studentId: student.studentId, firstName: student.firstName, lastName: student.lastName, status, presentAt: log?.presentAt.toISOString() ?? null }
    }),
  })
}

export const setStudentStatus = async (req: Request, res: Response): Promise<void> => {
  const entry = await resolveEntry(req, res)
  if (!entry) return
  const status = req.body?.status as StudentStatus
  if (!['PRESENT', 'LATE', 'ABSENT'].includes(status)) {
    res.status(400).json({ message: 'Status must be PRESENT, LATE, or ABSENT' })
    return
  }

  const studentId = String(req.params.studentId)
  const student = await prisma.student.findFirst({ where: { id: studentId, classSection: entry.className } })
  if (!student) {
    res.status(404).json({ message: 'Student is not in this class' })
    return
  }

  const { date, weekday } = await getToday()
  const key = { studentId, roomId: entry.roomId, subject: entry.subject, period: entry.period, date }
  let presentAt: Date | null = null
  if (status === 'ABSENT') {
    await prisma.roomLog.deleteMany({ where: key })
  } else {
    const log = await prisma.roomLog.upsert({
      where: { studentId_roomId_subject_period_date: key },
      create: { ...key, readerId: null, weekday, className: entry.className, status, presentAt: new Date() },
      update: { status },
    })
    presentAt = log.presentAt
  }

  publishEntryStatus(entry.id, { type: 'status', studentId, status, ...(presentAt ? { presentAt: presentAt.toISOString() } : {}) })
  res.json({ studentId, status, presentAt: presentAt?.toISOString() ?? null })
}

export const namelistEvents = async (req: Request, res: Response): Promise<void> => {
  const entry = await resolveEntry(req, res)
  if (!entry) return

  res.status(200)
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  res.write(': connected\n\n')

  const unsubscribe = subscribeToEntry(entry.id, res)
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000)
  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
}
