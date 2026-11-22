// Pure report-cache rules; no database or network. Run with `npm run test:rules`.
import assert from 'node:assert/strict'
import { test } from 'node:test'

const { reportStatus, schoolDate, resolveRange, canonicalReport, cacheKey, isSnapshotFresh } = await import('../dist/src/lib/reportRules.js')

test('range defaults to the first of the end date\'s month through today', () => {
  assert.deepEqual(resolveRange(undefined, undefined, '2026-11-21'), { start: '2026-11-01', end: '2026-11-21' })
  assert.deepEqual(resolveRange(undefined, '2026-03-15', '2026-11-21'), { start: '2026-03-01', end: '2026-03-15' })
})

test('range must be a real, ordered span of fewer than 366 days; future ends are allowed', () => {
  assert.deepEqual(resolveRange('2024-01-01', '2024-12-31', '2026-11-21'), { start: '2024-01-01', end: '2024-12-31' })
  assert.deepEqual(resolveRange('2026-11-01', '2027-01-01', '2026-11-21'), { start: '2026-11-01', end: '2027-01-01' })
  assert.equal(resolveRange('2024-01-01', '2025-01-01', '2026-11-21'), null) // 366 days apart
  assert.equal(resolveRange('2026-11-02', '2026-11-01', '2026-11-21'), null) // reversed
  assert.equal(resolveRange('2026-02-30', '2026-03-01', '2026-11-21'), null) // not a real date
  assert.equal(resolveRange('11/01/2026', '2026-11-05', '2026-11-21'), null) // wrong format
  assert.equal(resolveRange(20261101, '2026-11-05', '2026-11-21'), null) // not a string
})

test('a report is finalized only when its whole range is before the school date', () => {
  assert.equal(reportStatus('2026-11-20', '2026-11-21'), 'FINALIZED')
  assert.equal(reportStatus('2026-11-21', '2026-11-21'), 'PROVISIONAL')
  assert.equal(reportStatus('2026-12-31', '2026-11-21'), 'PROVISIONAL')
})

test('school date follows the school timezone, not UTC', () => {
  // Bangkok is UTC+7: 17:30Z is already 00:30 the next day there.
  assert.equal(schoolDate(new Date('2026-11-20T17:30:00Z'), 'Asia/Bangkok'), '2026-11-21')
  assert.equal(schoolDate(new Date('2026-11-20T16:59:00Z'), 'Asia/Bangkok'), '2026-11-20')
  assert.equal(schoolDate(new Date('2026-11-20T17:30:00Z'), 'UTC'), '2026-11-20')
})

const range = { start: '2026-11-01', end: '2026-11-10' }
const key = (input) => cacheKey(canonicalReport({ ...range, ...input }))

test('equivalent requests share one cache key', () => {
  assert.match(key({ type: 'class', className: '5/1' }), /^[0-9a-f]{64}$/)
  assert.equal(key({ type: 'class', className: '5/1' }), key({ className: ' 5/1 ', type: 'class' }))
  assert.equal(key({ type: 'student', studentId: 's1' }), key({ type: 'student', studentId: 's1', kind: 'all' }))
  assert.equal(key({ type: 'arrival', classes: ['5/2', '5/1', '5/1'] }), key({ type: 'arrival', classes: ['5/1', '5/2'] }))
  // Parameters that do not belong to the report type must not fragment the cache.
  assert.equal(key({ type: 'class', className: '5/1' }), key({ type: 'class', className: '5/1', subject: 'Math', studentId: 'x', kind: 'gate' }))
})

test('different parameters never share a cache key', () => {
  const base = { type: 'subject', className: '5/1', subject: 'Math' }
  const variants = [
    base,
    { ...base, subject: 'Science' },
    { ...base, className: '5/2' },
    { ...base, start: '2026-11-02' },
    { ...base, end: '2026-11-11' },
    { type: 'class', className: '5/1' },
    { type: 'student', studentId: 's1', kind: 'all' },
    { type: 'student', studentId: 's1', kind: 'gate' },
    { type: 'student', studentId: 's2', kind: 'all' },
    { type: 'arrival', classes: null },
    { type: 'arrival', classes: [] },
    { type: 'arrival', classes: ['5/1'] },
    { type: 'arrival', classes: ['5/1', '5/2'] },
  ]
  const keys = variants.map(key)
  assert.equal(new Set(keys).size, variants.length)
})

const version = { attendance: 7, corrections: 2 }
const snapshot = (over) => ({ status: 'PROVISIONAL', end: '2026-11-21', attendanceVersion: 7, correctionsVersion: 2, ...over })

test('a finalized snapshot survives attendance writes but not corrections', () => {
  const finalized = snapshot({ status: 'FINALIZED', end: '2026-11-10' })
  assert.equal(isSnapshotFresh(finalized, version, '2026-11-21'), true)
  assert.equal(isSnapshotFresh(finalized, { ...version, attendance: 99 }, '2026-11-21'), true)
  assert.equal(isSnapshotFresh(finalized, { ...version, corrections: 3 }, '2026-11-21'), false)
})

test('a provisional snapshot is only fresh while no newer data exists', () => {
  assert.equal(isSnapshotFresh(snapshot(), version, '2026-11-21'), true)
  assert.equal(isSnapshotFresh(snapshot(), { ...version, attendance: 8 }, '2026-11-21'), false)
  assert.equal(isSnapshotFresh(snapshot(), { ...version, corrections: 3 }, '2026-11-21'), false)
})

test('a provisional snapshot goes stale once its range is entirely in the past', () => {
  // Regenerating lets it become finalized with the day's complete data.
  assert.equal(isSnapshotFresh(snapshot({ end: '2026-11-21' }), version, '2026-11-22'), false)
  assert.equal(isSnapshotFresh(snapshot({ end: '2026-12-05' }), version, '2026-11-22'), true)
})
