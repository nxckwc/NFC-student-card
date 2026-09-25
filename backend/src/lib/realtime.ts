import type { Response } from 'express'

export type StudentStatus = 'PRESENT' | 'LATE' | 'ABSENT'

export interface NamelistStatusEvent {
  type: 'status'
  studentId: string
  status: StudentStatus
  presentAt?: string
}

const subscribers = new Map<number, Set<Response>>()

export const subscribeToEntry = (entryId: number, response: Response): (() => void) => {
  const entrySubscribers = subscribers.get(entryId) ?? new Set<Response>()
  entrySubscribers.add(response)
  subscribers.set(entryId, entrySubscribers)

  return () => {
    entrySubscribers.delete(response)
    if (entrySubscribers.size === 0) subscribers.delete(entryId)
  }
}

export const publishEntryStatus = (entryId: number, event: NamelistStatusEvent): void => {
  const entrySubscribers = subscribers.get(entryId)
  if (!entrySubscribers) return

  const payload = `data: ${JSON.stringify(event)}\n\n`
  for (const response of entrySubscribers) {
    try {
      response.write(payload)
    } catch {
      entrySubscribers.delete(response)
    }
  }
}
