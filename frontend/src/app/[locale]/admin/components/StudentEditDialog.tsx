"use client"

import { useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { motion } from 'motion/react'

// Add editable fields here; layout and required-field validation follow this list.
const fields = [
  { key: 'studentId', numeric: true },
  { key: 'classSection', numeric: false },
  { key: 'firstName', numeric: false },
  { key: 'lastName', numeric: false },
] as const

export type StudentEditValues = Record<(typeof fields)[number]['key'], string>

export function StudentEditDialog({ values, onChange, busy, error, onSave, onCancel }: {
  values: StudentEditValues
  onChange: (values: StudentEditValues) => void
  busy: boolean
  error: string | null
  onSave: () => void
  onCancel: () => void
}) {
  const t = useTranslations('admin')
  const dialogRef = useRef<HTMLDialogElement>(null)
  const valid = fields.every(({ key, numeric }) => numeric ? /^\d+$/.test(values[key].trim()) : values[key].trim().length > 0)

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
      aria-labelledby="student-edit-title"
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel() }}
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-screen max-w-none items-center justify-center border-0 bg-transparent p-4 text-text-primary open:flex backdrop:bg-transparent"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="absolute inset-0 bg-dialog-backdrop backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <motion.div
        className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
      <form
        className="flex max-h-[85dvh] flex-col"
        onSubmit={(event) => { event.preventDefault(); if (valid && !busy) onSave() }}
        aria-busy={busy}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border-soft px-6 py-4">
          <h2 id="student-edit-title" className="text-lg font-bold">{t('editStudent')}</h2>
          <button type="button" onClick={onCancel} disabled={busy} aria-label={t('cancel')} className="rounded-md p-2 text-text-secondary hover:bg-surface-active disabled:opacity-50">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto p-6">
          <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
            {fields.map(({ key, numeric }, index) => (
              <label key={key} className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
                {t(key)}
                <input
                  autoFocus={index === 0}
                  name={key}
                  type="text"
                  inputMode={numeric ? 'numeric' : undefined}
                  pattern={numeric ? '[0-9]+' : undefined}
                  required
                  value={values[key]}
                  onChange={(event) => onChange({ ...values, [key]: numeric ? event.target.value.replace(/[^0-9]/g, '') : event.target.value })}
                  className="w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 font-normal outline-none focus:border-accent focus:ring-2 focus:ring-accent/15 disabled:opacity-60"
                />
              </label>
            ))}
          </fieldset>
          {error && <p role="alert" className="mt-4 rounded-md border border-danger-border bg-danger-bg p-3 text-sm text-danger-foreground">{error}</p>}
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border-soft px-6 py-4">
          <button type="button" onClick={onCancel} disabled={busy} className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-surface-subtle disabled:opacity-50">{t('cancel')}</button>
          <button type="submit" disabled={!valid || busy} className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-white hover:bg-accent-hover disabled:opacity-50">{t(busy ? 'saving' : 'save')}</button>
        </footer>
      </form>
      </motion.div>
    </motion.dialog>
  )
}
