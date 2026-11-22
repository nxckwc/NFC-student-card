'use client'

import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { FileChartColumn, RefreshCw } from 'lucide-react'
import { fetchReportStudents, fetchReportVersion, fetchSessionUserId, requestReport } from '@/lib/reports/api'
import { deleteReport, listReports, saveReport } from '@/lib/reports/store'
import type { GenerateRequest, ReportStudent, StoredReport } from '@/lib/reports/types'
import ReportCards from './components/ReportCards'
import ReportForm from './components/ReportForm'

type LoadError = 'forbidden' | 'loadError'
type GenerateError = 'rangeError' | 'forbidden' | 'notAssigned' | 'reportError' | 'storageError'

const localDay = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export default function ReportsPage() {
  const t = useTranslations('reports')
  const locale = useLocale()
  const router = useRouter()
  const [userId, setUserId] = useState<number | null>(null)
  const [students, setStudents] = useState<ReportStudent[]>([])
  const [dates, setDates] = useState<{ start: string; end: string } | null>(null)
  const [cards, setCards] = useState<StoredReport[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<LoadError | null>(null)
  const [storageUnavailable, setStorageUnavailable] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<GenerateError | null>(null)
  const [retry, setRetry] = useState(0)
  const request = useRef<AbortController | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const [id, loaded, version] = await Promise.all([
          fetchSessionUserId(controller.signal),
          fetchReportStudents(controller.signal),
          // Defaults follow the school's calendar day, not the browser's timezone.
          fetchReportVersion(controller.signal).catch(() => null),
        ])
        if (controller.signal.aborted) return
        const end = version?.schoolDate ?? localDay(new Date())
        setUserId(id)
        setStudents(loaded)
        setDates({ start: `${end.slice(0, 7)}-01`, end })
        try {
          setCards(await listReports(id))
        } catch {
          setStorageUnavailable(true)
        }
      } catch (cause) {
        if (!controller.signal.aborted) setLoadError(axios.isAxiosError(cause) && cause.response?.status === 403 ? 'forbidden' : 'loadError')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [retry])

  const generate = async (input: GenerateRequest) => {
    if (userId === null) return
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setGenerating(true)
    setError(null)
    let stored: StoredReport
    try {
      stored = await requestReport(input, userId, controller.signal)
    } catch (cause) {
      if (controller.signal.aborted) return
      const status = axios.isAxiosError(cause) ? cause.response?.status : undefined
      setError(status === 403 ? 'forbidden' : status === 404 ? 'notAssigned' : status === 400 ? 'rangeError' : 'reportError')
      setGenerating(false)
      return
    }
    try {
      await saveReport(stored)
    } catch {
      setError('storageError')
      setGenerating(false)
      return
    }
    router.push(`/${locale}/reports/${stored.key}`)
  }

  const remove = async (card: StoredReport) => {
    if (!window.confirm(t('deleteConfirm'))) return
    try {
      await deleteReport(card.userId, card.key)
      setCards((current) => current.filter((item) => item.id !== card.id))
    } catch {
      setError('storageError')
    }
  }

  return (
    <main className="reports-page mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6">
      <header className="mb-6"><h1 className="min-w-0 text-2xl font-bold text-text-primary sm:text-3xl">{t('title')}</h1></header>

      <section className="mb-6 rounded-xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="report-request-title">
        <h2 id="report-request-title" className="font-bold text-text-primary">{t('requestTitle')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('description')}</p>
        {loading ? <p role="status" className="mt-4 text-sm text-text-muted">{t('loadingStudents')}</p> : loadError ? (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-danger-foreground">
            <p>{t(loadError)}</p>
            {loadError !== 'forbidden' && <button type="button" onClick={() => { setLoading(true); setLoadError(null); setRetry((value) => value + 1) }} className="inline-flex items-center gap-1 underline"><RefreshCw className="size-4" />{t('retry')}</button>}
          </div>
        ) : dates && (
          <ReportForm students={students} defaultStart={dates.start} defaultEnd={dates.end} busy={generating} onGenerate={generate} />
        )}
        {error && <p role="alert" className="mt-4 text-sm text-danger-foreground">{t(error)}</p>}
      </section>

      <section aria-labelledby="generated-reports-title">
        <h2 id="generated-reports-title" className="mb-4 font-bold text-text-primary">{t('generatedReports')}</h2>
        {storageUnavailable && <p role="alert" className="mb-4 text-sm text-danger-foreground">{t('storageError')}</p>}
        {cards.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface py-16 text-center text-text-muted">
            <FileChartColumn className="mx-auto mb-3 size-9" /><p>{loading ? t('loadingStudents') : t('noGeneratedReports')}</p>
          </div>
        ) : <ReportCards cards={cards} onDelete={remove} />}
      </section>
    </main>
  )
}
