import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma.js'
import { getAuthTokenFromCookies } from '../utils/cookie.js'
import type { JwtPayload } from '../interfaces/auth.js'
import type { ScheduleEntryResponse } from '../interfaces/schedule.js'

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

  const schedule: ScheduleEntryResponse[] = entries.map((entry) => ({
    id: entry.id,
    weekday: entry.weekday,
    period: entry.period,
    subject: entry.subject,
    className: entry.className,
    roomId: entry.roomId,
    startTime: entry.startTime,
    endTime: entry.endTime,
  }))

  res.json({ schedule })
}