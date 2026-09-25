import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { getAuthTokenFromCookies } from '../utils/cookie.js'
import type { JwtPayload } from '../interfaces/auth.js'
import type { ScheduleEntryResponse } from '../interfaces/schedule.js'

const getZonedParts = (date: Date, timeZone: string): { dateKey: string; weekday: number; minutes: number } => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const weekdayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  return {
    dateKey: `${values.year}-${values.month}-${values.day}`,
    weekday: weekdayMap[values.weekday ?? ''] ?? 1,
    minutes: Number(values.hour) * 60 + Number(values.minute),
  }
}

const dayStartUtc = (dateKey: string): Date => new Date(`${dateKey}T00:00:00.000Z`)
const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours ?? 0) * 60 + (minutes ?? 0)
}

const getCurrentUserId = (req: Request): number | null => {
  const token = getAuthTokenFromCookies(req)
  const secret = process.env['JWT_SECRET']
  if (!token || !secret) return null

  try {
    return (jwt.verify(token, secret) as JwtPayload).id
  } catch {
    return null
  }
}

/**
 * @swagger
 * /dashboard/schedule:
 *   get:
 *     summary: Get the signed-in user's weekly timetable
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Weekly schedule entries
 *       401:
 *         description: Unauthorized
 */
export const getSchedule = async (req: Request, res: Response): Promise<void> => {
  const userId = getCurrentUserId(req)
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const entries = await prisma.scheduleEntry.findMany({
    where: { userId },
    orderBy: [{ weekday: 'asc' }, { period: 'asc' }],
  })

  const settings = await prisma.schoolSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  const now = new Date()
  const zoned = getZonedParts(now, settings.timezone)
  const today = dayStartUtc(zoned.dateKey)
  const roomLogs = await prisma.roomLog.findMany({
    where: {
      date: today,
      reader: { teachers: { some: { userId } } },
    },
    select: { weekday: true, period: true, subject: true, className: true, roomId: true },
  })
  const checkedLessons = new Set(roomLogs.map((log) => `${log.weekday}-${log.period}-${log.subject}-${log.className}-${log.roomId}`))

  const schedule: ScheduleEntryResponse[] = entries.map((entry) => ({
    id: entry.id,
    weekday: entry.weekday,
    period: entry.period,
    subject: entry.subject,
    className: entry.className,
    roomId: entry.roomId,
    startTime: entry.startTime,
    endTime: entry.endTime,
    attendanceStatus: entry.weekday !== zoned.weekday || toMinutes(entry.startTime) > zoned.minutes
      ? 'FUTURE'
      : checkedLessons.has(`${entry.weekday}-${entry.period}-${entry.subject}-${entry.className}-${entry.roomId}`)
        ? 'COMPLETED'
        : 'PENDING',
  }))

  res.json({ schedule })
}