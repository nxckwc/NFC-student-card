import type { useTranslations } from 'next-intl'
import type { StoredReport } from './types'

export type Translate = ReturnType<typeof useTranslations>

// Dates arrive as school-calendar days (YYYY-MM-DD), so they are formatted in UTC
// to avoid the browser's timezone shifting them.
export const formatDay = (value: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))

export const formatTime = (value: string | null, timeZone: string, locale: string): string =>
  value ? new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone }).format(new Date(value)) : '—'

export const formatStamp = (value: string, timeZone: string, locale: string): string =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(value))

export const reportTypeLabel = (type: StoredReport['meta']['type'], t: Translate): string =>
  t(({ student: 'typeStudent', class: 'typeClass', subject: 'typeSubject', arrival: 'typeArrival' })[type])

// Short title for a card or viewer header.
export const reportHeading = ({ meta, report }: StoredReport, t: Translate): string => {
  if (meta.type === 'student' && 'student' in report) return `${report.student.firstName} ${report.student.lastName}`
  if (meta.type === 'subject' && 'subject' in report) return `${report.className} · ${report.subject}`
  if (meta.type === 'class' && 'className' in report) return `${t('class')} ${report.className}`
  if (meta.type === 'arrival' && 'classes' in report) return report.classes?.join(', ') ?? t('allClasses')
  return reportTypeLabel(meta.type, t)
}

// The parameters beyond the heading (student number, attendance kind, …).
export const reportDetail = ({ meta, report }: StoredReport, t: Translate): string | null => {
  if (meta.type === 'student' && 'student' in report) {
    return `${t('studentId')}: ${report.student.studentId ?? '—'} · ${t('class')}: ${report.student.classSection ?? '—'} · ${t(report.kind)}`
  }
  return null
}
