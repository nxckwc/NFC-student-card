import type { Request, Response } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { requireStaff } from '../utils/auth.js'

// Teachers can report on students in their assigned classes; admins can use all students.
const studentScope = async (user: { id: number; role: string }): Promise<Prisma.StudentWhereInput> => {
  if (user.role === 'ADMIN') return {}
  const entries = await prisma.scheduleEntry.findMany({
    where: { userId: user.id }, select: { className: true }, distinct: ['className'],
  })
  return { classSection: { in: entries.map((entry) => entry.className) } }
}

export const getReportStudents = async (req: Request, res: Response): Promise<void> => {
  const user = requireStaff(req, res)
  if (!user) return
  res.setHeader('Cache-Control', 'no-store')
  const students = await prisma.student.findMany({
    where: await studentScope(user),
    select: { id: true, studentId: true, firstName: true, lastName: true, classSection: true },
    orderBy: [{ classSection: 'asc' }, { firstName: 'asc' }, { lastName: 'asc' }],
  })
  res.json({ students })
}

export const getStudentReport = async (req: Request, res: Response): Promise<void> => {
  const user = requireStaff(req, res)
  if (!user) return
  res.setHeader('Cache-Control', 'no-store')
  const studentId = String(req.params.studentId)
  const student = await prisma.student.findFirst({
    where: { AND: [{ id: studentId }, await studentScope(user)] }, select: { id: true },
  })
  if (!student) {
    res.status(404).json({ message: 'Student not found or not assigned to your classes' })
    return
  }

  const token = process.env['ANALYTICS_SERVICE_TOKEN'] || process.env['JWT_SECRET']
  if (!token) {
    res.status(503).json({ message: 'Analytics service is not configured' })
    return
  }
  const format = req.params.format ? String(req.params.format) : ''
  if (!['', 'history', 'analysis', 'csv'].includes(format)) {
    res.status(404).json({ message: 'Unknown report format' })
    return
  }
  const base = (process.env['ANALYTICS_URL'] || 'http://127.0.0.1:8000').replace(/\/+$/, '')
  const url = new URL(`${base}/analytics/reports/student/${encodeURIComponent(studentId)}${format ? `/${format}` : ''}`)
  for (const key of ['start', 'end', 'kind']) {
    const value = req.query[key]
    if (typeof value === 'string') url.searchParams.set(key, value)
  }
  try {
    const upstream = await fetch(url, {
      headers: { 'X-Analytics-Token': token }, signal: AbortSignal.timeout(15000),
    })
    if (!upstream.ok) {
      // Keep service credentials and database errors out of browser responses.
      res.status(upstream.status === 422 ? 400 : upstream.status === 404 ? 404 : 503)
        .json({ message: upstream.status === 422 ? 'Choose a valid date range of at most 366 days and report type' : 'Unable to generate report' })
      return
    }
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json')
    if (format === 'csv') res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"')
    res.send(await upstream.text())
  } catch {
    res.status(503).json({ message: 'Analytics service is unavailable. Please try again later.' })
  }
}
