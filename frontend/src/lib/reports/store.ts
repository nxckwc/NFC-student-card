// Tier 1 cache: each teacher's generated reports, kept only in this browser's IndexedDB.
// Records are keyed by user so staff sharing a browser never see each other's reports.
import type { StoredReport } from './types'

const DB_NAME = 'nfc-student-card-reports'
const STORE = 'reports'

const openDb = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, 1)
  request.onupgradeneeded = () => {
    request.result.createObjectStore(STORE, { keyPath: 'id' }).createIndex('byUser', 'userId')
  }
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error)
})

const run = async <T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE))
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally {
    db.close() // waits for the pending transaction before closing
  }
}

export const recordId = (userId: number, key: string): string => `${userId}:${key}`

export const listReports = async (userId: number): Promise<StoredReport[]> => {
  const records = await run<StoredReport[]>('readonly', (store) => store.index('byUser').getAll(userId))
  return records.sort((a, b) => b.savedAt - a.savedAt)
}

export const getReport = async (userId: number, key: string): Promise<StoredReport | null> =>
  (await run<StoredReport | undefined>('readonly', (store) => store.get(recordId(userId, key)))) ?? null

export const saveReport = (record: StoredReport): Promise<IDBValidKey> => run('readwrite', (store) => store.put(record))

export const deleteReport = (userId: number, key: string): Promise<undefined> =>
  run('readwrite', (store) => store.delete(recordId(userId, key)))
