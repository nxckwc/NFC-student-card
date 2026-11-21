'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { FileChartColumn, LoaderCircle } from 'lucide-react'
import DatePicker from '@/components/DatePicker'
import type { GenerateRequest, ReportKind, ReportStudent, ReportType } from '@/lib/reports/types'

const inputClass = 'mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
const REPORT_TYPES: { type: ReportType; label: string }[] = [
  { type: 'student', label: 'typeStudent' }, { type: 'class', label: 'typeClass' },
  { type: 'subject', label: 'typeSubject' }, { type: 'arrival', label: 'typeArrival' },
]

interface Props {
  students: ReportStudent[]
  defaultStart: string
  defaultEnd: string
  busy: boolean
  onGenerate: (request: GenerateRequest) => void
}

export default function ReportForm({ students, defaultStart, defaultEnd, busy, onGenerate }: Props) {
  const t = useTranslations('reports')
  const [type, setType] = useState<ReportType>('student')
  const [studentId, setStudentId] = useState('')
  const [kind, setKind] = useState<ReportKind>('all')
  const [className, setClassName] = useState('')
  const [subject, setSubject] = useState('')
  const [start, setStart] = useState(defaultStart)
  const [end, setEnd] = useState(defaultEnd)
  const [rangeError, setRangeError] = useState(false)
  const classes = useMemo(
    () => [...new Set(students.map((student) => student.classSection).filter((value): value is string => Boolean(value)))].sort(),
    [students],
  )

  const ready = type === 'student' ? Boolean(studentId) : type === 'class' ? Boolean(className) : type === 'subject' ? Boolean(className && subject.trim()) : true

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const days = (Date.parse(end) - Date.parse(start)) / 86400000
    if (!Number.isFinite(days) || days < 0 || days >= 366) {
      setRangeError(true)
      return
    }
    setRangeError(false)
    onGenerate({
      type, start, end,
      ...(type === 'student' ? { studentId, kind } : {}),
      ...(type !== 'student' && className ? { className } : {}),
      ...(type === 'subject' ? { subject: subject.trim() } : {}),
    })
  }

  const classSelect = (optional: boolean) => (
    <label className="text-sm font-semibold text-text-secondary">{t(optional ? 'classOptional' : 'class')}
      <select required={!optional} value={className} onChange={(event) => setClassName(event.target.value)} className={inputClass}>
        <option value="">{optional ? t('allClasses') : t('selectClass')}</option>
        {classes.map((value) => <option key={value} value={value}>{value}</option>)}
      </select>
    </label>
  )

  return (
    <form onSubmit={submit} className="mt-4 grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="text-sm font-semibold text-text-secondary">{t('reportType')}
        <select value={type} onChange={(event) => setType(event.target.value as ReportType)} className={inputClass}>
          {REPORT_TYPES.map((option) => <option key={option.type} value={option.type}>{t(option.label)}</option>)}
        </select>
      </label>

      {type === 'student' && <>
        <label className="text-sm font-semibold text-text-secondary sm:col-span-2 lg:col-span-1">{t('student')}
          <select required value={studentId} onChange={(event) => setStudentId(event.target.value)} className={inputClass}>
            <option value="">{t('selectStudent')}</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.studentId ?? '—'} · {student.firstName} {student.lastName}{student.classSection ? ` (${student.classSection})` : ''}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold text-text-secondary">{t('type')}
          <select value={kind} onChange={(event) => setKind(event.target.value as ReportKind)} className={inputClass}>
            <option value="all">{t('all')}</option><option value="gate">{t('gate')}</option><option value="room">{t('room')}</option>
          </select>
        </label>
      </>}
      {(type === 'class' || type === 'subject') && classSelect(false)}
      {type === 'subject' && (
        <label className="text-sm font-semibold text-text-secondary">{t('subject')}
          <input required type="text" maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t('subjectPlaceholder')} className={inputClass} />
        </label>
      )}
      {type === 'arrival' && classSelect(true)}

      <DatePicker label={t('start')} value={start} onChange={setStart} max={end || undefined} today={defaultEnd} />
      <DatePicker label={t('end')} value={end} onChange={setEnd} min={start || undefined} today={defaultEnd} />
      <button disabled={!ready || busy} type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
        {busy ? <LoaderCircle className="size-4 animate-spin" /> : <FileChartColumn className="size-4" />}{t(busy ? 'generating' : 'generate')}
      </button>
      {rangeError && <p role="alert" className="text-sm text-danger-foreground sm:col-span-2 lg:col-span-4">{t('rangeError')}</p>}
    </form>
  )
}
