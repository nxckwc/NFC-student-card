import type { Prisma } from '@prisma/client'
import { prisma } from './prisma.js'
import type { DataVersion } from './reportRules.js'

type Db = Prisma.TransactionClient

export const getDataVersion = async (): Promise<DataVersion> =>
  prisma.reportDataVersion.upsert({
    where: { id: 1 }, update: {}, create: { id: 1 }, select: { attendance: true, corrections: true },
  })

export const bumpAttendance = (db: Db = prisma) =>
  db.reportDataVersion.upsert({ where: { id: 1 }, update: { attendance: { increment: 1 } }, create: { id: 1, attendance: 1 } })

export const bumpCorrections = (db: Db = prisma) =>
  db.reportDataVersion.upsert({ where: { id: 1 }, update: { corrections: { increment: 1 } }, create: { id: 1, corrections: 1 } })

// Called after the write has already committed. A failed bump is logged rather than
// thrown so a successful attendance write is never reported as an error (a reader
// would retry and toggle the gate state). The cost is a provisional snapshot staying
// reusable until the next write.
const bestEffort = async (bump: () => Promise<unknown>): Promise<void> => {
  try {
    await bump()
  } catch (error) {
    console.error('Failed to update report data version', error)
  }
}

export const noteAttendanceChange = (): Promise<void> => bestEffort(() => bumpAttendance())
export const noteCorrection = (): Promise<void> => bestEffort(() => bumpCorrections())
