// Run with `npm test` (Node strips the TypeScript types; no extra test runner).
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isSnapshotFresh, needsFreshnessCheck } from './freshness.ts'

test('a finalized card reopens without contacting the backend; a provisional one must be checked', () => {
  assert.equal(needsFreshnessCheck({ status: 'FINALIZED' }), false)
  assert.equal(needsFreshnessCheck({ status: 'PROVISIONAL' }), true)
})

const meta = (over) => ({ status: 'PROVISIONAL', end: '2026-11-21', version: { attendance: 7, corrections: 2 }, ...over })
const current = (over) => ({ attendance: 7, corrections: 2, schoolDate: '2026-11-21', ...over })

test('a finalized snapshot survives attendance writes but not corrections', () => {
  const finalized = meta({ status: 'FINALIZED', end: '2026-11-10' })
  assert.equal(isSnapshotFresh(finalized, current()), true)
  assert.equal(isSnapshotFresh(finalized, current({ attendance: 99 })), true)
  assert.equal(isSnapshotFresh(finalized, current({ corrections: 3 })), false)
})

test('a provisional snapshot is stale after newer data or once its range has fully passed', () => {
  assert.equal(isSnapshotFresh(meta(), current()), true)
  assert.equal(isSnapshotFresh(meta(), current({ attendance: 8 })), false)
  assert.equal(isSnapshotFresh(meta(), current({ corrections: 3 })), false)
  assert.equal(isSnapshotFresh(meta({ end: '2026-11-21' }), current({ schoolDate: '2026-11-22' })), false)
  assert.equal(isSnapshotFresh(meta({ end: '2026-12-05' }), current({ schoolDate: '2026-11-22' })), true)
})
