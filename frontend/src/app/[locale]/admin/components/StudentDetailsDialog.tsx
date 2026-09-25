"use client"

import { useEffect, useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { motion } from 'motion/react'
import type { Student } from '../lib/api'

export function StudentDetailsDialog({ student, onClose }: { student: Student; onClose: () => void }) {
  const t = useTranslations('admin')
  const locale = useLocale()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const details = [
    { label: 'firstName', value: student.firstName },
    { label: 'lastName', value: student.lastName },
    { label: 'studentId', value: student.studentId ?? '—' },
    { label: 'classSection', value: student.classSection ?? '—' },
    { label: 'cardUid', value: student.uid_card ?? t('cardNotRegistered') },
    { label: 'added', value: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(student.createdAt)) },
    { label: 'checkIns', value: student._count.gateLogs + student._count.roomLogs },
  ] as const

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  return (
    <motion.dialog
      ref={dialogRef}
      aria-labelledby="student-details-title"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-screen max-w-none items-center justify-center border-0 bg-transparent p-4 text-text-primary open:flex backdrop:bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-dialog-backdrop backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
      <div className="flex max-h-[85dvh] flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-border-soft px-6 py-4">
          <h2 id="student-details-title" className="text-lg font-bold">{t('studentDetails')}</h2>
          <button type="button" onClick={onClose} aria-label={t('closeStudentDetails')} className="rounded-md p-2 text-text-secondary hover:bg-surface-active">
            <X className="size-5" />
          </button>
        </header>
        <dl className="grid min-h-0 gap-5 overflow-y-auto p-6 sm:grid-cols-2">
          {details.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-sm font-semibold text-text-muted">{t(label)}</dt>
              <dd className="mt-1 break-words text-sm [overflow-wrap:anywhere]">{value}</dd>
            </div>
          ))}
        </dl>
        <footer className="flex shrink-0 justify-end border-t border-border-soft px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-subtle">{t('closeStudentDetails')}</button>
        </footer>
      </div>
      </motion.div>
    </motion.dialog>
  )
}
