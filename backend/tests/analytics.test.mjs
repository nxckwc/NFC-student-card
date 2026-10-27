import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { after, before, test } from 'node:test'
import express from 'express'
import jwt from 'jsonwebtoken'

const database = process.env.ANALYTICS_TEST_DATABASE_URL
if (!database || !new URL(database).pathname.endsWith('_test')) {
  throw new Error('Set ANALYTICS_TEST_DATABASE_URL to a migrated disposable database ending in _test')
}
process.env.DATABASE_URL = database
process.env.JWT_SECRET = 'report-test-session-only'
process.env.ANALYTICS_SERVICE_TOKEN = 'report-test-internal-only'
process.env.ANALYTICS_URL ||= 'http://127.0.0.1:58039'
const { prisma } = await import('../dist/src/lib/prisma.js')
const { getReportStudents, getStudentReport } = await import('../dist/src/controllers/analytics.js')
let server
let base
let teacher
let student
let otherStudent
const className = `report-test-${randomUUID()}`

const cookie = (role, id = -1) => `auth_token=${jwt.sign({ id, role, username: 'report-test' }, process.env.JWT_SECRET, { expiresIn: '5m' })}`
const request = (path, role = 'ADMIN', id = -1) => fetch(`${base}${path}`, {
  headers: role ? { Cookie: cookie(role, id) } : {},
})

before(async () => {
  teacher = await prisma.user.create({ data: { username: className, password: 'unused', role: 'TEACHER' } })
  await prisma.scheduleEntry.create({ data: {
    userId: teacher.id, weekday: 1, period: 1, subject: 'Science', className,
    roomId: '101', startTime: '08:00', endTime: '09:00',
  } })
  student = await prisma.student.create({ data: { firstName: 'Report', lastName: 'Student', classSection: className } })
  otherStudent = await prisma.student.create({ data: { firstName: 'Other', lastName: 'Student', classSection: `${className}-other` } })
  await prisma.roomLog.create({ data: {
    studentId: student.id, date: new Date('2026-09-02T00:00:00Z'), weekday: 3, period: 1,
    subject: 'Science', className, roomId: '101', status: 'LATE', presentAt: new Date('2026-09-02T02:05:00Z'),
  } })
  const app = express()
  app.get('/analytics/students', getReportStudents)
  app.get('/analytics/reports/student/:studentId', getStudentReport)
  app.get('/analytics/reports/student/:studentId/:format', getStudentReport)
  server = app.listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  for (const fixture of [student, otherStudent]) {
    if (fixture) await prisma.student.delete({ where: { id: fixture.id } })
  }
  if (teacher) await prisma.user.delete({ where: { id: teacher.id } })
  await prisma.$disconnect()
})

test('anonymous and non-staff users cannot read reports or student lists', async () => {
  for (const role of [null, 'USER']) {
    assert.equal((await request('/analytics/students', role)).status, 403)
    assert.equal((await request(`/analytics/reports/student/${student.id}`, role)).status, 403)
  }
})

test('teachers only see and report on students in their assigned classes', async () => {
  const response = await request('/analytics/students', 'TEACHER', teacher.id)
  assert.equal(response.status, 200)
  const data = await response.json()
  assert.deepEqual(data.students.map((row) => row.id), [student.id])
  assert.equal((await request(`/analytics/reports/student/${otherStudent.id}`, 'TEACHER', teacher.id)).status, 404)
  assert.equal((await request(`/analytics/reports/student/${student.id}?start=2026-09-01&end=2026-09-03`, 'TEACHER', teacher.id)).status, 200)
})

test('Express forwards a report from PostgreSQL through the analytics service', async () => {
  const response = await request(`/analytics/reports/student/${student.id}?start=2026-09-02&end=2026-09-02&kind=room`)
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const data = await response.json()
  assert.equal(data.student.id, student.id)
  assert.equal(data.records.length, 1)
  assert.equal(data.records[0].status, 'LATE')
  assert.equal(data.summary.lateRoomSessions, 1)
})

test('invalid ranges, dates, and report types return validation errors', async () => {
  for (const query of ['start=2026-09-03&end=2026-09-01', 'start=bad', 'kind=unknown', 'start=2020-01-01&end=2026-09-01']) {
    assert.equal((await request(`/analytics/reports/student/${student.id}?${query}`)).status, 400)
  }
})

test('empty reports remain successful and CSV is downloadable', async () => {
  const response = await request(`/analytics/reports/student/${student.id}?start=2026-08-01&end=2026-08-31`)
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).records, [])
  const csv = await request(`/analytics/reports/student/${student.id}/csv?start=2026-09-02&end=2026-09-02`)
  assert.equal(csv.status, 200)
  assert.match(csv.headers.get('content-type'), /text\/csv/)
  assert.match(await csv.text(), /Science/)
})

test('the analytics service itself rejects unauthenticated requests', async () => {
  const response = await fetch(`${process.env.ANALYTICS_URL}/analytics/reports/student/${student.id}`)
  assert.equal(response.status, 401)
})

test('unavailable analytics returns a recoverable service error', async () => {
  const original = process.env.ANALYTICS_URL
  try {
    process.env.ANALYTICS_URL = 'http://127.0.0.1:1'
    const response = await request(`/analytics/reports/student/${student.id}`)
    assert.equal(response.status, 503)
    assert.match((await response.json()).message, /unavailable/)
  } finally {
    process.env.ANALYTICS_URL = original
  }
})
