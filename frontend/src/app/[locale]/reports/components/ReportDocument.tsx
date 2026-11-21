'use client'

import type { ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { formatDay, formatStamp, formatTime, reportDetail, reportHeading, reportTypeLabel } from '@/lib/reports/format'
import type { ArrivalReport, ClassReport, StoredReport, StudentProfile, StudentReport, SubjectReport } from '@/lib/reports/types'
import { StatusBadge } from './ReportCards'

interface TableRow { key: string; cells: ReactNode[] }

function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: TableRow[] }) {
  return (
    <div className="report-table-scroll overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border bg-surface-soft text-xs text-text-secondary"><tr>
          {headers.map((header) => <th key={header} scope="col" className="p-3">{header}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-border text-text-primary">{rows.map((row) => (
          <tr key={row.key}>{row.cells.map((cell, index) => <td key={index} className="p-3 tabular-nums">{cell}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  )
}

const person = (student: StudentProfile): ReactNode => (
  <><span className="font-semibold">{student.firstName} {student.lastName}</span><span className="block text-xs text-text-muted">{student.studentId ?? '—'}</span></>
)

export default function ReportDocument({ stored }: { stored: StoredReport }) {
  const t = useTranslations('reports')
  const locale = useLocale()
  const { meta, report } = stored
  const rate = (value: number | null) => (value === null ? '—' : `${value}%`)
  const statusLabel = (value: string) => ({ ON_TIME: t('onTime'), PRESENT: t('present'), LATE: t('late'), ABSENT: t('absent') })[value] ?? value

  let tiles: [string, string | number][] = []
  let body: ReactNode = null
  let hasRows = true

  if (meta.type === 'student') {
    const r = report as StudentReport
    tiles = r.kind === 'room'
      ? [['roomSessions', r.summary.roomSessions], ['presentRoomSessions', r.summary.presentRoomSessions], ['lateRoomSessions', r.summary.lateRoomSessions]]
      : r.kind === 'gate'
        ? [['gateDays', r.summary.gateDays], ['onTimeGateDays', r.summary.onTimeGateDays], ['lateGateDays', r.summary.lateGateDays], ['gateLateRate', rate(r.summary.gateLateRate)]]
        : [['gateDays', r.summary.gateDays], ['lateGateDays', r.summary.lateGateDays], ['roomSessions', r.summary.roomSessions], ['lateRoomSessions', r.summary.lateRoomSessions]]
    hasRows = r.records.length > 0
    body = <DataTable caption={t('history')} headers={[t('date'), t('type'), t('details'), t('arrival'), t('departure'), t('status')]} rows={r.records.map((row) => ({
      key: `${row.type}-${row.id}`,
      cells: [
        <span key="d" className="whitespace-nowrap">{formatDay(row.date, locale)}</span>, t(row.type === 'GATE' ? 'gate' : 'room'),
        row.type === 'ROOM' ? <span key="x"><span className="font-semibold">{row.subject}</span><span className="block text-xs text-text-muted">{row.className} · {t('roomLabel')} {row.roomId} · {t('period')} {row.period}</span></span> : t('dailyGate'),
        formatTime(row.arrivalAt, r.timezone, locale), formatTime(row.departureAt, r.timezone, locale),
        <span key="s" className={`inline-block rounded-md px-2 py-1 text-xs font-bold ${row.status === 'LATE' ? 'bg-danger-bg text-danger-foreground' : 'bg-surface-active text-accent-foreground'}`}>{statusLabel(row.status)}</span>,
      ],
    }))} />
  } else if (meta.type === 'class') {
    const r = report as ClassReport
    tiles = [['students', r.summary.students], ['gateDays', r.summary.gateDays], ['lateGateDays', r.summary.lateGateDays], ['gateLateRate', rate(r.summary.gateLateRate)], ['roomSessions', r.summary.roomSessions], ['lateRoomSessions', r.summary.lateRoomSessions]]
    hasRows = r.rows.length > 0
    body = <DataTable caption={t('typeClass')} headers={[t('name'), t('gateDays'), t('lateGateDays'), t('roomSessions'), t('presentRoomSessions'), t('lateRoomSessions')]} rows={r.rows.map((row) => ({
      key: row.student.id, cells: [person(row.student), row.gateDays, row.lateGateDays, row.roomSessions, row.presentRoomSessions, row.lateRoomSessions],
    }))} />
  } else if (meta.type === 'subject') {
    const r = report as SubjectReport
    tiles = [['students', r.summary.students], ['sessions', r.summary.sessions], ['presentRecords', r.summary.presentRecords], ['lateRecords', r.summary.lateRecords]]
    hasRows = r.rows.length > 0
    body = <DataTable caption={t('typeSubject')} headers={[t('name'), t('present'), t('late'), t('noRecord')]} rows={r.rows.map((row) => ({
      key: row.student.id, cells: [person(row.student), row.present, row.late, row.noRecord],
    }))} />
  } else {
    const r = report as ArrivalReport
    tiles = [['students', r.summary.students], ['gateDays', r.summary.gateDays], ['onTimeGateDays', r.summary.onTimeGateDays], ['lateGateDays', r.summary.lateGateDays], ['gateLateRate', rate(r.summary.gateLateRate)]]
    hasRows = r.rows.length > 0
    body = (
      <>
        <DataTable caption={t('typeArrival')} headers={[t('name'), t('gateDays'), t('lateGateDays'), t('averageArrival'), t('latestArrival')]} rows={r.rows.map((row) => ({
          key: row.student.id, cells: [person(row.student), row.gateDays, row.lateGateDays, row.averageArrival ?? '—', row.latestArrival ?? '—'],
        }))} />
        {r.daily.length > 0 && (
          <div className="mt-6">
            <h3 className="px-3 pb-2 text-sm font-bold text-text-primary">{t('daily')}</h3>
            <DataTable caption={t('daily')} headers={[t('date'), t('arrived'), t('late')]} rows={r.daily.map((day) => ({ key: day.date, cells: [formatDay(day.date, locale), day.arrived, day.late] }))} />
          </div>
        )}
      </>
    )
  }

  const detail = reportDetail(stored, t)
  return (
    <article className="report-document space-y-6">
      <div className="border-b border-border px-2 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-accent-foreground">{reportTypeLabel(meta.type, t)}</p>
          <StatusBadge status={meta.status} />
        </div>
        <h2 className="mt-1 text-xl font-bold text-text-primary">{reportHeading(stored, t)}</h2>
        {meta.type === 'subject' && <p className="mt-1 text-sm text-text-secondary">{t('class')}: {(report as SubjectReport).className}</p>}
        {detail && <p className="mt-1 text-sm text-text-secondary">{detail}</p>}
        <p className="mt-2 text-sm text-text-secondary">{formatDay(meta.start, locale)} – {formatDay(meta.end, locale)}</p>
        <p className="mt-1 text-xs text-text-muted">{t('timezone')}: {report.timezone} · {t('generated')}: {formatStamp(report.generatedAt, report.timezone, locale)}</p>
        {meta.status === 'PROVISIONAL' && <p className="mt-2 text-xs text-text-muted">{t('provisionalNote')}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([label, value]) => <div key={label} className="rounded-lg border border-border bg-surface-soft p-4"><p className="text-xs font-semibold text-text-muted">{t(label)}</p><p className="mt-2 text-2xl font-bold text-text-primary">{value}</p></div>)}
      </div>

      {hasRows ? body : <p className="py-10 text-center text-text-muted">{t('noRecords')}</p>}

      <footer className="border-t border-border px-2 py-3 text-xs leading-relaxed text-text-muted">
        {meta.type === 'subject' ? <p>{t('subjectNote')}</p> : (meta.type !== 'student' || (report as StudentReport).kind !== 'room') && <p>{t('gateNote', { cutoff: report.lateCutoff })}</p>}
        <p>{t('recordsNote')}</p>
      </footer>
    </article>
  )
}
