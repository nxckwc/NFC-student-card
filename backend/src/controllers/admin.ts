import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { getAuthTokenFromCookies } from '../utils/cookie.js'
import type { JwtPayload } from '../interfaces/auth.js'

interface ScheduleInput {
  weekday?: number
  period?: number
  subject?: string
  className?: string
  roomId?: string
}

const getAdmin = (req: Request): JwtPayload | null => {
  const token = getAuthTokenFromCookies(req)
  const secret = process.env['JWT_SECRET']
  if (!token || !secret) return null

  try {
    const payload = jwt.verify(token, secret) as JwtPayload
    return payload.role === 'ADMIN' ? payload : null
  } catch {
    return null
  }
}

const requireAdmin = (req: Request, res: Response): JwtPayload | null => {
  const admin = getAdmin(req)
  if (!admin) res.status(403).json({ message: 'Admin access required' })
  return admin
}

const getPeriodTime = (period: number): { startTime: string; endTime: string } => {
  const startMinutes = 8 * 60 + 30 + (period - 1) * 55
  const endMinutes = startMinutes + 55
  const format = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  return { startTime: format(startMinutes), endTime: format(endMinutes) }
}

/**
 * @swagger
 * /admin/overview:
 *   get:
 *     summary: Admin overview stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Overview counts
 *       403:
 *         description: Admin access required
 */
export const getAdminOverview = async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return

  const [accounts, scheduledAccounts] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.count({ where: { scheduleEntries: { some: {} } } }),
  ])

  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const [students, attendance, scannedStudents] = await prisma.$transaction([
      prisma.student.count(),
      prisma.attendanceLog.count(),
      prisma.attendanceLog.findMany({
        where: { timestamp: { gte: startOfDay } },
        distinct: ['studentId'],
        select: { studentId: true },
      }),
    ])
    res.json({ overview: { accounts, students, attendance, scannedStudents: scannedStudents.length, scheduledAccounts, studentDataAvailable: true } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      res.json({ overview: { accounts, students: null, attendance: null, scheduledAccounts, studentDataAvailable: false } })
      return
    }
    throw error
  }
}

/**
 * @swagger
 * /admin/accounts:
 *   get:
 *     summary: List user accounts
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive username filter
 *     responses:
 *       200:
 *         description: Accounts found
 *       403:
 *         description: Admin access required
 */
export const getAccounts = async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return

  const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : ''

  const accounts = await prisma.user.findMany({
    where: search ? { username: { contains: search, mode: 'insensitive' } } : undefined,
    orderBy: { username: 'asc' },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { scheduleEntries: true } },
    },
  })

  res.json({ accounts })
}

/**
 * @swagger
 * /admin/accounts/{accountId}:
 *   get:
 *     summary: Get account with schedule
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account found
 *       400:
 *         description: Invalid account id
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Account not found
 */
export const getAccount = async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return

  const accountId = Number(req.params['accountId'])
  if (!Number.isInteger(accountId)) {
    res.status(400).json({ message: 'Invalid account id' })
    return
  }

  const account = await prisma.user.findUnique({
    where: { id: accountId },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      scheduleEntries: {
        orderBy: [{ weekday: 'asc' }, { period: 'asc' }],
        select: {
          id: true,
          weekday: true,
          period: true,
          subject: true,
          className: true,
          roomId: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  })

  if (!account) {
    res.status(404).json({ message: 'Account not found' })
    return
  }

  res.json({ account })
}

/**
 * @swagger
 * /admin/accounts/{accountId}/schedule:
 *   put:
 *     summary: Replace account schedule (full replacement)
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - entries
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - weekday
 *                     - period
 *                     - subject
 *                     - className
 *                     - roomId
 *                   properties:
 *                     weekday:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 7
 *                     period:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 8
 *                     subject:
 *                       type: string
 *                     className:
 *                       type: string
 *                     roomId:
 *                       type: string
 *     responses:
 *       200:
 *         description: Schedule replaced
 *       400:
 *         description: Invalid account id or schedule
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Account not found
 */
export const replaceAccountSchedule = async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return

  const accountId = Number(req.params['accountId'])
  const entries = req.body?.entries as ScheduleInput[] | undefined
  if (!Number.isInteger(accountId) || !Array.isArray(entries)) {
    res.status(400).json({ message: 'Invalid account id or schedule' })
    return
  }

  const account = await prisma.user.findUnique({ where: { id: accountId }, select: { id: true } })
  if (!account) {
    res.status(404).json({ message: 'Account not found' })
    return
  }

  const seen = new Set<string>()
  const scheduleData = []
  for (const entry of entries) {
    const weekday = Number(entry.weekday)
    const period = Number(entry.period)
    const subject = entry.subject?.trim()
    const className = entry.className?.trim()
    const roomId = entry.roomId?.trim()
    const key = `${weekday}-${period}`

    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7 || !Number.isInteger(period) || period < 1 || period > 8 || !subject || !className || !roomId || seen.has(key)) {
      res.status(400).json({ message: 'Each schedule entry needs a unique weekday, period, subject, class, and room' })
      return
    }

    seen.add(key)
    scheduleData.push({ userId: accountId, weekday, period, subject, className, roomId, ...getPeriodTime(period) })
  }

  await prisma.$transaction([
    prisma.scheduleEntry.deleteMany({ where: { userId: accountId } }),
    prisma.scheduleEntry.createMany({ data: scheduleData }),
  ])

  res.json({ success: true, schedule: scheduleData })
}

const ACCOUNT_ROLES = ['USER', 'ADMIN'] as const
type AccountRole = (typeof ACCOUNT_ROLES)[number]

/**
 * @swagger
 * /admin/accounts/{accountId}/role:
 *   patch:
 *     summary: Change account role
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *     responses:
 *       200:
 *         description: Role updated
 *       400:
 *         description: Invalid role, own account, or last admin
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Account not found
 */
export const updateAccountRole = async (req: Request, res: Response): Promise<void> => {
  const admin = requireAdmin(req, res)
  if (!admin) return

  const accountId = Number(req.params['accountId'])
  const role = (req.body?.role ?? '') as AccountRole
  if (!Number.isInteger(accountId) || !ACCOUNT_ROLES.includes(role)) {
    res.status(400).json({ message: 'Invalid account id or role' })
    return
  }

  if (accountId === admin.id) {
    res.status(400).json({ message: 'You cannot change your own role' })
    return
  }

  const account = await prisma.user.findUnique({ where: { id: accountId }, select: { id: true, role: true } })
  if (!account) {
    res.status(404).json({ message: 'Account not found' })
    return
  }

  if (account.role === 'ADMIN' && role === 'USER') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      res.status(400).json({ message: 'Cannot demote the last remaining admin' })
      return
    }
  }

  const updated = await prisma.user.update({ where: { id: accountId }, data: { role }, select: { id: true, username: true, role: true } })
  res.json({ account: updated })
}

/**
 * @swagger
 * /admin/accounts/{accountId}:
 *   delete:
 *     summary: Delete account
 *     tags: [Admin]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Account deleted
 *       400:
 *         description: Own account or last admin
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Account not found
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  const admin = requireAdmin(req, res)
  if (!admin) return

  const accountId = Number(req.params['accountId'])
  if (!Number.isInteger(accountId)) {
    res.status(400).json({ message: 'Invalid account id' })
    return
  }

  if (accountId === admin.id) {
    res.status(400).json({ message: 'You cannot delete your own account' })
    return
  }

  const account = await prisma.user.findUnique({ where: { id: accountId }, select: { id: true, role: true } })
  if (!account) {
    res.status(404).json({ message: 'Account not found' })
    return
  }

  if (account.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      res.status(400).json({ message: 'Cannot delete the last remaining admin' })
      return
    }
  }

  await prisma.user.delete({ where: { id: accountId } })
  res.json({ success: true })
}

/**
 * @swagger
 * /admin/students:
 *   get:
 *     summary: List students
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive filter on name or card UID
 *     responses:
 *       200:
 *         description: Students found (or unavailable)
 *       403:
 *         description: Admin access required
 */
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return

  const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : ''

  try {
    const students = await prisma.student.findMany({
      where: search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { uid_card: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        uid_card: true,
        createdAt: true,
        _count: { select: { logs: true } },
      },
    })

    res.json({ students, studentDataAvailable: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      res.json({ students: null, studentDataAvailable: false })
      return
    }
    throw error
  }
}

/**
 * @swagger
 * /admin/attendance:
 *   get:
 *     summary: List attendance logs
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive student name filter
 *     responses:
 *       200:
 *         description: Attendance logs (or unavailable)
 *       403:
 *         description: Admin access required
 */
export const getAttendance = async (req: Request, res: Response): Promise<void> => {
  if (!requireAdmin(req, res)) return

  const rawLimit = Number(req.query['limit'])
  const rawOffset = Number(req.query['offset'])
  const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  const search = typeof req.query['search'] === 'string' ? req.query['search'].trim() : ''

  const where: Prisma.AttendanceLogWhereInput | undefined = search
    ? {
        student: {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
          ],
        },
      }
    : undefined

  try {
    const [logs, total] = await prisma.$transaction([
      prisma.attendanceLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          timestamp: true,
          status: true,
          student: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.attendanceLog.count({ where }),
    ])

    res.json({ logs, total, studentDataAvailable: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      res.json({ logs: null, total: null, studentDataAvailable: false })
      return
    }
    throw error
  }
}
