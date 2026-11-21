'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowLeft, LoaderCircle, Printer, RefreshCw } from 'lucide-react'
import { fetchReportVersion, fetchSessionUserId, requestFor, requestReport } from '@/lib/reports/api'
import { isSnapshotFresh, needsFreshnessCheck } from '@/lib/reports/freshness'
import { getReport, saveReport } from '@/lib/reports/store'
import type { StoredReport } from '@/lib/reports/types'
import ReportDocument from '../components/ReportDocument'

type LoadState = 'loading' | 'ready' | 'missing' | 'error'

export default function ReportViewerPage() {
  const t = useTranslations('reports')
  const locale = useLocale()
  const router = useRouter()
  const { reportId } = useParams<{ reportId: string }>()
  const [stored, setStored] = useState<StoredReport | null>(null)
  const [state, setState] = useState<LoadState>('loading')
  const [stale, setStale] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const userId = await fetchSessionUserId(controller.signal)
        const found = await getReport(userId, reportId)
        if (controller.signal.aborted) return
        if (!found) {
          setState('missing')
          return
        }
        setStored(found)
        setState('ready')
        // The snapshot is shown immediately. Only a provisional one is checked, and only
        // against the cheap version endpoint: nothing is recomputed unless the user asks.
        if (needsFreshnessCheck(found.meta)) {
          try {
            const current = await fetchReportVersion(controller.signal)
            if (!controller.signal.aborted) setStale(!isSnapshotFresh({ status: found.meta.status, end: found.meta.end, version: found.meta.version }, current))
          } catch {
            // Offline or unavailable: keep showing the saved snapshot.
          }
        }
      } catch {
        if (!controller.signal.aborted) setState('error')
      }
    }
    void load()
    return () => controller.abort()
  }, [reportId])

  const refresh = async () => {
    if (!stored) return
    setRefreshing(true)
    setRefreshFailed(false)
    try {
      const next = await requestReport(requestFor(stored.meta), stored.userId)
      await saveReport(next)
      setStored(next)
      setStale(false)
      if (next.key !== stored.key) router.replace(`/${locale}/reports/${next.key}`)
    } catch {
      setRefreshFailed(true)
    } finally {
      setRefreshing(false)
    }
  }

  const buttonClass = 'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <main className="reports-page mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <Link href={`/${locale}/reports`} className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary">
          <ArrowLeft className="size-4" />{t('backToReports')}
        </Link>
        {stored && (
          <div className="flex gap-2">
            <button type="button" onClick={refresh} disabled={refreshing} className={`${buttonClass} border border-border text-text-primary hover:bg-surface-active`}>
              {refreshing ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}{t(refreshing ? 'refreshing' : 'refresh')}
            </button>
            <button type="button" onClick={() => window.print()} className={`${buttonClass} bg-accent text-white hover:opacity-90`}>
              <Printer className="size-4" />{t('print')}
            </button>
          </div>
        )}
      </header>

      {stale && <p role="status" className="mb-4 rounded-lg border border-border bg-surface-soft p-3 text-sm text-text-secondary print:hidden">{t('staleNotice')}</p>}
      {refreshFailed && <p role="alert" className="mb-4 text-sm text-danger-foreground print:hidden">{t('reportError')}</p>}

      <section className="report-container rounded-xl border border-border bg-surface p-2" aria-label={t('title')} aria-busy={state === 'loading'}>
        {state === 'loading' && <div role="status" className="flex items-center justify-center gap-2 py-20 text-text-muted"><LoaderCircle className="size-5 animate-spin" />{t('loadingReport')}</div>}
        {state === 'missing' && <p className="py-20 text-center text-text-muted">{t('notFound')}</p>}
        {state === 'error' && <p role="alert" className="py-20 text-center text-danger-foreground">{t('storageError')}</p>}
        {state === 'ready' && stored && <ReportDocument stored={stored} />}
      </section>
    </main>
  )
}
