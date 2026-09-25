'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import axios from 'axios'
import { useLocale, useTranslations } from 'next-intl'
import { FileChartColumn, LoaderCircle, Printer, RefreshCw } from 'lucide-react'
import type { AttendanceReport, ReportKind, ReportStudent } from './types'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100').replace(/\/+$/, '')
const inputClass = 'mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function ReportsPage() {
  const t = useTranslations('reports')
  const locale = useLocale()
  const [students, setStudents] = useState<ReportStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(true)
  const [studentsError, setStudentsError] = useState<'forbidden' | 'loadError' | null>(null)
  const [retry, setRetry] = useState(0)
  const [studentId, setStudentId] = useState('')
  const [kind, setKind] = useState<ReportKind>('all')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [report, setReport] = useState<AttendanceReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<'rangeError' | 'reportError' | 'forbidden' | null>(null)
  const request = useRef<AbortController | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  useEffect(() => {
    const controller = new AbortController()
    axios.get<{ students: ReportStudent[] }>(`${API_BASE_URL}/analytics/students`, {
      withCredentials: true, signal: controller.signal,
    }).then(({ data }) => {
      setStudents(data.students)
      // Initialize browser-local dates after loading, avoiding server/client timezone differences.
      const now = new Date()
      setStart((value) => value || localDate(new Date(now.getFullYear(), now.getMonth(), 1)))
      setEnd((value) => value || localDate(now))
    })
      .catch((cause) => {
        if (!controller.signal.aborted) setStudentsError(axios.isAxiosError(cause) && cause.response?.status === 403 ? 'forbidden' : 'loadError')
      }).finally(() => { if (!controller.signal.aborted) setLoadingStudents(false) })
    return () => controller.abort()
  }, [retry])

  const generateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const days = (Date.parse(end) - Date.parse(start)) / 86400000
    if (!Number.isFinite(days) || days < 0 || days >= 366) {
      setError('rangeError')
      return
    }
    request.current?.abort()
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError(null)
    setReport(null)
    try {
      const { data } = await axios.get<AttendanceReport>(`${API_BASE_URL}/analytics/reports/student/${encodeURIComponent(studentId)}`, {
        params: { start, end, kind }, withCredentials: true, signal: controller.signal,
      })
      if (!controller.signal.aborted) setReport(data)
    } catch (cause) {
      if (!controller.signal.aborted) setError(axios.isAxiosError(cause) && cause.response?.status === 403 ? 'forbidden' : 'reportError')
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  const formatDate = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
  const formatTime = (value: string | null) => value && report
    ? new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: report.timezone }).format(new Date(value)) : '—'
  const statusLabel = (value: string) => ({ ON_TIME: t('onTime'), PRESENT: t('present'), LATE: t('late'), ABSENT: t('absent') })[value] ?? value
  const hasRecords = Boolean(report?.records.length)

  return (
    <main className="reports-page mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <h1 className="min-w-0 text-2xl font-bold text-text-primary sm:text-3xl">{t('title')}</h1>
        <button type="button" onClick={() => window.print()} disabled={!report || loading} className="print:hidden inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
          <Printer className="size-4" />{t('print')}
        </button>
      </header>

      <section className="print:hidden mb-6 rounded-xl border border-border bg-surface p-4 sm:p-5" aria-labelledby="report-request-title">
        <h2 id="report-request-title" className="font-bold text-text-primary">{t('requestTitle')}</h2>
        <p className="mt-1 text-sm text-text-muted">{t('description')}</p>
        {loadingStudents ? <p role="status" className="mt-4 text-sm text-text-muted">{t('loadingStudents')}</p> : studentsError ? (
          <div role="alert" className="mt-4 flex flex-wrap items-center gap-3 text-sm text-danger-foreground">
            <p>{t(studentsError)}</p>
            {studentsError !== 'forbidden' && <button type="button" onClick={() => { setLoadingStudents(true); setStudentsError(null); setRetry((value) => value + 1) }} className="inline-flex items-center gap-1 underline"><RefreshCw className="size-4" />{t('retry')}</button>}
          </div>
        ) : students.length === 0 ? <p className="mt-4 text-sm text-text-muted">{t('noStudents')}</p> : (
          <form onSubmit={generateReport} className="mt-4 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
            <label className="text-sm font-semibold text-text-secondary"><span id="report-student-label">{t('student')}</span>
              <select aria-labelledby="report-student-label" required value={studentId} onChange={(event) => setStudentId(event.target.value)} className={inputClass}>
                <option value="">{t('selectStudent')}</option>
                {students.map((student) => <option key={student.id} value={student.id}>{student.studentId ?? '—'} · {student.firstName} {student.lastName}{student.classSection ? ` (${student.classSection})` : ''}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-text-secondary"><span id="report-type-label">{t('type')}</span>
              <select aria-labelledby="report-type-label" value={kind} onChange={(event) => setKind(event.target.value as ReportKind)} className={inputClass}>
                <option value="all">{t('all')}</option><option value="gate">{t('gate')}</option><option value="room">{t('room')}</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-text-secondary">{t('start')}<input required type="date" value={start} onChange={(event) => setStart(event.target.value)} max={end || undefined} className={inputClass} /></label>
            <label className="text-sm font-semibold text-text-secondary">{t('end')}<input required type="date" value={end} onChange={(event) => setEnd(event.target.value)} min={start || undefined} className={inputClass} /></label>
            <button disabled={!studentId || loading} type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
              {loading ? <LoaderCircle className="size-4 animate-spin" /> : <FileChartColumn className="size-4" />}{t(loading ? 'generating' : 'generate')}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-danger-foreground">{t(error)}</p>}
      </section>

      <section className="report-container rounded-xl border border-border bg-surface p-2" aria-label={t('title')} aria-busy={loading}>
        {loading ? <div role="status" className="flex items-center justify-center gap-2 py-20 text-text-muted"><LoaderCircle className="size-5 animate-spin" />{t('generating')}</div> : !report ? (
          <div className="py-20 text-center text-text-muted"><FileChartColumn className="mx-auto mb-3 size-9" /><p>{t('empty')}</p></div>
        ) : (
          <article className="report-document space-y-6">
            <div className="border-b border-border px-2 py-4">
              <p className="text-sm font-semibold text-accent-foreground">{t(report.kind)}</p>
              <h2 className="mt-1 text-xl font-bold text-text-primary">{report.student.firstName} {report.student.lastName}</h2>
              <p className="mt-1 text-sm text-text-secondary">{t('studentId')}: {report.student.studentId ?? '—'} · {t('class')}: {report.student.classSection ?? '—'}</p>
              <p className="mt-2 text-sm text-text-secondary">{formatDate(report.start)} – {formatDate(report.end)}</p>
              <p className="mt-1 text-xs text-text-muted">{t('timezone')}: {report.timezone} · {t('generated')}: {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: report.timezone }).format(new Date(report.generatedAt))}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(report.kind === 'room' ? [
                ['roomSessions', report.summary.roomSessions], ['presentRoomSessions', report.summary.presentRoomSessions], ['lateRoomSessions', report.summary.lateRoomSessions],
              ] : report.kind === 'gate' ? [
                ['gateDays', report.summary.gateDays], ['onTimeGateDays', report.summary.onTimeGateDays], ['lateGateDays', report.summary.lateGateDays], ['gateLateRate', report.summary.gateLateRate === null ? '—' : `${report.summary.gateLateRate}%`],
              ] : [
                ['gateDays', report.summary.gateDays], ['lateGateDays', report.summary.lateGateDays], ['roomSessions', report.summary.roomSessions], ['lateRoomSessions', report.summary.lateRoomSessions],
              ]).map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface-soft p-4"><p className="text-xs font-semibold text-text-muted">{t(String(label))}</p><p className="mt-2 text-2xl font-bold text-text-primary">{value}</p></div>)}
            </div>

            {!hasRecords ? <p className="py-10 text-center text-text-muted">{t('noRecords')}</p> : (
              <div className="report-table-scroll overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="sr-only">{t('history')}</caption>
                  <thead className="border-b border-border bg-surface-soft text-xs text-text-secondary"><tr>
                    <th scope="col" className="p-3">{t('date')}</th><th scope="col" className="p-3">{t('type')}</th><th scope="col" className="p-3">{t('details')}</th><th scope="col" className="p-3">{t('arrival')}</th><th scope="col" className="p-3">{t('departure')}</th><th scope="col" className="p-3">{t('status')}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border text-text-primary">{report.records.map((row) => <tr key={`${row.type}-${row.id}`}>
                    <td className="whitespace-nowrap p-3">{formatDate(row.date)}</td><td className="p-3">{t(row.type === 'GATE' ? 'gate' : 'room')}</td>
                    <td className="min-w-40 p-3">{row.type === 'ROOM' ? <><span className="font-semibold">{row.subject}</span><span className="block text-xs text-text-muted">{row.className} · {t('roomLabel')} {row.roomId} · {t('period')} {row.period}</span></> : t('dailyGate')}</td>
                    <td className="whitespace-nowrap p-3 tabular-nums">{formatTime(row.arrivalAt)}</td><td className="whitespace-nowrap p-3 tabular-nums">{formatTime(row.departureAt)}</td>
                    <td className="p-3"><span className={`inline-block rounded-md px-2 py-1 text-xs font-bold ${row.status === 'LATE' ? 'bg-danger-bg text-danger-foreground' : 'bg-surface-active text-accent-foreground'}`}>{statusLabel(row.status)}</span></td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
            <footer className="border-t border-border px-2 py-3 text-xs leading-relaxed text-text-muted">
              {report.kind !== 'room' && <p>{t('gateNote', { cutoff: report.lateCutoff })}</p>}
              <p>{t('recordsNote')}</p>
            </footer>
          </article>
        )}
      </section>
    </main>
  )
}
