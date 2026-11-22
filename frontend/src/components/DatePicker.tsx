'use client'

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CalendarDays, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { addDays, addMonths, clampDay, endOfMonth, localDay, monthGrid, parseDay, startOfMonth, startOfWeek } from '@/lib/dates'

const POPOVER_WIDTH = 288 // w-72

interface Props {
  label: string
  /** YYYY-MM-DD, or '' for no date. */
  value: string
  onChange: (value: string) => void
  /** Earliest and latest selectable day (YYYY-MM-DD). */
  min?: string
  max?: string
  /** The calendar day to mark as today. Defaults to the browser's local date. */
  today?: string
  weekStart?: 0 | 1
  /** Replaces the default styling of the trigger button. */
  className?: string
}

const triggerClass = 'flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
const navClass = 'rounded-lg p-2 text-text-secondary hover:bg-surface-active disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

export default function DatePicker({ label, value, onChange, min, max, today, weekStart = 0, className }: Props) {
  const t = useTranslations('datePicker')
  const locale = useLocale()
  const popoverId = useId()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const cells = useRef(new Map<string, HTMLButtonElement>())
  const focusGrid = useRef(false) // keyboard navigation moves DOM focus; the nav buttons keep theirs
  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState('') // the day that owns focus; its month is the one shown
  const [todayMark, setTodayMark] = useState('')
  const [alignRight, setAlignRight] = useState(false)

  // Dates are school-calendar days, so format them in UTC like the rest of the app.
  const formats = useMemo(() => ({
    value: new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }),
    month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }),
    full: new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }),
  }), [locale])
  const format = (kind: keyof typeof formats, day: string) => formats[kind].format(new Date(`${day}T00:00:00Z`))

  const selected = parseDay(value) ? value : ''
  const disabled = (day: string) => Boolean((min && day < min) || (max && day > max))

  useEffect(() => {
    if (open && focusGrid.current) cells.current.get(cursor)?.focus()
  }, [open, cursor])

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  const openPicker = () => {
    const mark = today ?? localDay(new Date())
    const rect = triggerRef.current?.getBoundingClientRect()
    focusGrid.current = true
    setTodayMark(mark)
    setCursor(clampDay(selected || mark, min, max))
    setAlignRight(Boolean(rect && rect.left + POPOVER_WIDTH > window.innerWidth - 8))
    setOpen(true)
  }

  const closePicker = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const choose = (day: string) => {
    if (disabled(day)) return
    onChange(day)
    closePicker()
  }

  const moveCursor = (day: string) => {
    focusGrid.current = true
    setCursor(day)
  }

  const onGridKeyDown = (event: KeyboardEvent) => {
    const year = event.shiftKey ? 12 : 1
    const next: Record<string, string> = {
      ArrowLeft: addDays(cursor, -1), ArrowRight: addDays(cursor, 1),
      ArrowUp: addDays(cursor, -7), ArrowDown: addDays(cursor, 7),
      PageUp: addMonths(cursor, -year), PageDown: addMonths(cursor, year),
      Home: startOfWeek(cursor, weekStart), End: addDays(startOfWeek(cursor, weekStart), 6),
    }
    const target = next[event.key]
    if (!target) return
    event.preventDefault()
    moveCursor(target)
  }

  const shiftMonth = (count: number) => {
    focusGrid.current = false
    setCursor(addMonths(cursor, count))
  }

  const days = open ? monthGrid(cursor, weekStart) : []
  const weeks = Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7))
  const monthLabel = open ? format('month', cursor) : ''
  // A button is off when the month it would show lies entirely outside [min, max].
  const monthOutOfRange = (day: string) => Boolean((min && endOfMonth(day) < min) || (max && startOfMonth(day) > max))
  const off = (months: number) => open && monthOutOfRange(addMonths(cursor, months))
  const valueText = selected ? format('value', selected) : t('choose')

  return (
    <div
      ref={wrapperRef}
      className="text-sm font-semibold text-text-secondary"
      onKeyDown={(event) => { if (event.key === 'Escape' && open) { event.stopPropagation(); closePicker() } }}
      onBlur={(event) => {
        // Tabbing out closes it. A null relatedTarget (a click in Safari) is left to the pointerdown handler.
        const next = event.relatedTarget as Node | null
        if (open && next && !wrapperRef.current?.contains(next)) setOpen(false)
      }}
    >
      <span>{label}</span>
      <div className="relative mt-2">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          aria-label={`${label}: ${valueText}`}
          onClick={() => (open ? closePicker() : openPicker())}
          className={className ?? triggerClass}
        >
          <span className={selected ? '' : 'text-text-muted'}>{valueText}</span>
          <CalendarDays className="size-4 shrink-0 text-text-muted" aria-hidden />
        </button>

        {open && (
          <div
            id={popoverId}
            role="dialog"
            aria-label={label}
            tabIndex={-1}
            className={`absolute top-full z-50 mt-2 w-72 max-w-[calc(100vw-1rem)] rounded-xl border border-border bg-surface p-3 font-normal text-text-primary shadow-lg outline-none ${alignRight ? 'right-0' : 'left-0'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex">
                <button type="button" aria-label={t('previousYear')} disabled={off(-12)} onClick={() => shiftMonth(-12)} className={navClass}><ChevronsLeft className="size-4" /></button>
                <button type="button" aria-label={t('previousMonth')} disabled={off(-1)} onClick={() => shiftMonth(-1)} className={navClass}><ChevronLeft className="size-4" /></button>
              </div>
              <p aria-live="polite" className="text-sm font-bold">{monthLabel}</p>
              <div className="flex">
                <button type="button" aria-label={t('nextMonth')} disabled={off(1)} onClick={() => shiftMonth(1)} className={navClass}><ChevronRight className="size-4" /></button>
                <button type="button" aria-label={t('nextYear')} disabled={off(12)} onClick={() => shiftMonth(12)} className={navClass}><ChevronsRight className="size-4" /></button>
              </div>
            </div>

            <div role="grid" aria-label={monthLabel} onKeyDown={onGridKeyDown} className="mt-2">
              <div role="row" className="grid grid-cols-7">
                {weeks[0]?.map((day) => (
                  <div key={day} role="columnheader" className="py-1 text-center text-xs font-semibold text-text-muted">{format('weekday', day)}</div>
                ))}
              </div>
              {weeks.map((week) => (
                <div key={week[0]} role="row" className="grid grid-cols-7">
                  {week.map((day) => {
                    const inMonth = day.slice(0, 7) === cursor.slice(0, 7)
                    const isSelected = day === selected
                    const off = disabled(day)
                    return (
                      <div key={day} role="gridcell" aria-selected={isSelected} className="p-0.5">
                        <button
                          ref={(node) => { if (node) cells.current.set(day, node); else cells.current.delete(day) }}
                          type="button"
                          tabIndex={day === cursor ? 0 : -1}
                          aria-label={format('full', day)}
                          aria-current={day === todayMark ? 'date' : undefined}
                          aria-disabled={off || undefined}
                          onClick={() => choose(day)}
                          className={[
                            'flex size-9 w-full items-center justify-center rounded-lg text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-accent',
                            isSelected ? 'bg-accent font-bold text-white' : off ? 'cursor-not-allowed text-text-muted opacity-40' : 'hover:bg-surface-active',
                            !isSelected && !off && !inMonth ? 'text-text-muted' : '',
                            !isSelected && day === todayMark ? 'ring-1 ring-accent' : '',
                          ].join(' ')}
                        >
                          {Number(day.slice(8))}
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
