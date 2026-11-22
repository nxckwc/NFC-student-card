import type { Request, Response } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { requireStaff } from '../utils/auth.js'
import { getDataVersion } from '../lib/reportCache.js'
import {
  cacheKey, canonicalReport, isSnapshotFresh, reportStatus, resolveRange, schoolDate,
  type CanonicalReport, type ReportInput, type ReportStatus, type ReportType, type StudentReportKind,
} from '../lib/reportRules.js'
import { assignedClasses, studentScope } from './analytics.js'

const REPORT_TYPES: readonly string[] = ['student', 'class', 'subject', 'arrival']
const KINDS: readonly string[] = ['all', 'gate', 'room']
const MAX_TEXT = 200

type Staff = { id: number; role: string }
type Authorized = { input: Omit<ReportInput, 'type' | 'start' | 'end'> } | { status: number; message: string }

const text = (value: unknown): string | null => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed && trimmed.length <= MAX_TEXT ? trimmed : null
}

const settingsToday = async (): Promise<string> => {
  const settings = await prisma.schoolSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } })
  return schoolDate(new Date(), settings.timezone)
}

// Checks the requesting staff member may see this report and resolves the scope the
// report will actually cover. This runs on every request, before the cache is read.
const authorize = async (user: Staff, type: ReportType, body: Record<string, unknown>): Promise<Authorized> => {
  const bad = { status: 400, message: 'Missing or invalid report parameters' }
  const classes = await assignedClasses(user)
  const mayUseClass = (className: string) => classes === null || classes.includes(className)
  const denied = { status: 404, message: 'Not found or not assigned to your classes' }

  if (type === 'student') {
    const studentId = text(body['studentId'])
    const kind = body['kind'] ?? 'all'
    if (!studentId || typeof kind !== 'string' || !KINDS.includes(kind)) return bad
    const student = await prisma.student.findFirst({ where: { AND: [{ id: studentId }, await studentScope(user)] }, select: { id: true } })
    return student ? { input: { studentId, kind: kind as StudentReportKind } } : denied
  }
  const className = text(body['className'])
  if (type === 'class' || type === 'subject') {
    const subject = text(body['subject'])
    if (!className || (type === 'subject' && !subject)) return bad
    if (!mayUseClass(className)) return denied
    return { input: type === 'class' ? { className } : { className, subject: subject as string } }
  }
  // Arrival: one class if given, otherwise every class the staff member may see.
  if (body['className'] !== undefined && body['className'] !== '' && !className) return bad
  if (className) return mayUseClass(className) ? { input: { classes: [className] } } : denied
  return classes !== null && classes.length === 0 ? denied : { input: { classes } }
}

const upstreamUrl = (report: CanonicalReport): URL => {
  const base = (process.env['ANALYTICS_URL'] || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  const path = report.type === 'student' ? `student/${encodeURIComponent(report.studentId)}` : report.type
  const url = new URL(`${base}/analytics/reports/${path}`)
  url.searchParams.set('start', report.start)
  url.searchParams.set('end', report.end)
  if (report.type === 'student') url.searchParams.set('kind', report.kind)
  if (report.type === 'class' || report.type === 'subject') url.searchParams.set('className', report.className)
  if (report.type === 'subject') url.searchParams.set('subject', report.subject)
  if (report.type === 'arrival') for (const name of report.classes ?? []) url.searchParams.append('classes', name)
  return url
}

export const getReportVersion = async (req: Request, res: Response): Promise<void> => {
  if (!requireStaff(req, res)) return
  res.setHeader('Cache-Control', 'no-store')
  res.json({ ...(await getDataVersion()), schoolDate: await settingsToday() })
}

export const generateReport = async (req: Request, res: Response): Promise<void> => {
  const user = requireStaff(req, res)
  if (!user) return
  res.setHeader('Cache-Control', 'no-store')
  const body: Record<string, unknown> = req.body && typeof req.body === 'object' ? req.body : {}
  const type = body['type']
  if (typeof type !== 'string' || !REPORT_TYPES.includes(type)) {
    res.status(400).json({ message: 'Unknown report type' })
    return
  }
  const today = await settingsToday()
  const range = resolveRange(body['start'], body['end'], today)
  if (!range) {
    res.status(400).json({ message: 'Choose a valid date range of fewer than 366 days' })
    return
  }
  const authorized = await authorize(user, type as ReportType, body)
  if ('status' in authorized) {
    res.status(authorized.status).json({ message: authorized.message })
    return
  }

  const params = canonicalReport({ type: type as ReportType, ...range, ...authorized.input })
  const key = cacheKey(params)
  // Read before computing: a write that lands mid-computation leaves this snapshot
  // stamped with the older version, so it is treated as stale next time.
  const version = await getDataVersion()
  const respond = (report: unknown, status: ReportStatus, cache: 'hit' | 'miss') =>
    res.json({ report, meta: { key, type, status, start: range.start, end: range.end, params, cache, version, schoolDate: today } })

  const cached = await prisma.reportSnapshot.findUnique({ where: { key } })
  const cachedStatus = cached?.status as ReportStatus | undefined
  if (cached && cachedStatus && isSnapshotFresh(
    { status: cachedStatus, end: cached.endDate, attendanceVersion: cached.attendanceVersion, correctionsVersion: cached.correctionsVersion }, version, today,
  )) {
    respond(cached.payload, cachedStatus, 'hit')
    return
  }

  const token = process.env['ANALYTICS_SERVICE_TOKEN'] || process.env['JWT_SECRET']
  if (!token) {
    res.status(503).json({ message: 'Analytics service is not configured' })
    return
  }
  try {
    const upstream = await fetch(upstreamUrl(params), { headers: { 'X-Analytics-Token': token }, signal: AbortSignal.timeout(15000) })
    if (!upstream.ok) {
      // Keep service credentials and database errors out of browser responses.
      res.status(upstream.status === 422 ? 400 : 503).json({ message: upstream.status === 422 ? 'Choose a valid date range of fewer than 366 days' : 'Unable to generate report' })
      return
    }
    const payload = (await upstream.json()) as Prisma.InputJsonValue
    const status = reportStatus(range.end, today)
    const snapshot = { type, endDate: range.end, status, attendanceVersion: version.attendance, correctionsVersion: version.corrections, payload }
    // The report is already computed; failing to cache it must not fail the request.
    await prisma.reportSnapshot.upsert({ where: { key }, create: { key, ...snapshot }, update: snapshot })
      .catch((error: unknown) => console.error('Failed to store report snapshot', error))
    respond(payload, status, 'miss')
  } catch {
    res.status(503).json({ message: 'Analytics service is unavailable. Please try again later.' })
  }
}
