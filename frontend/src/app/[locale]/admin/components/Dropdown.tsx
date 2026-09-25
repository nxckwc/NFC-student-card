"use client"

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  emptyLabel?: string
  className?: string
}

export const Dropdown = ({ value, onChange, options, placeholder = 'Select an option', emptyLabel = 'No options available', className = '' }: DropdownProps) => {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(Math.max(0, options.findIndex((option) => option.value === value)))
  const containerRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const select = (option: DropdownOption) => {
    onChange(option.value)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            setHighlighted((current) => event.key === 'ArrowDown' ? Math.min(options.length - 1, current + 1) : Math.max(0, current - 1))
          } else if (event.key === 'Enter' && open && options[highlighted]) {
            event.preventDefault()
            select(options[highlighted])
          } else if (event.key === 'Escape') setOpen(false)
        }}
        className="flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm transition hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
      >
        <span className={selected ? 'text-text-primary' : 'text-text-muted'}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={`size-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={listboxId} role="listbox" className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface p-1 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
          {options.length === 0 ? <div className="px-3 py-3 text-center text-xs text-text-muted">{emptyLabel}</div> : options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setHighlighted(index)}
              onClick={() => select(option)}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${index === highlighted ? 'bg-surface-active' : 'hover:bg-surface-subtle'} ${option.value === value ? 'font-bold text-accent-foreground' : 'text-text-primary'}`}
            >
              {option.label}
              {option.value === value && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface MultiDropdownProps {
  values: string[]
  onChange: (values: string[]) => void
  options: DropdownOption[]
  label?: string
  emptyLabel?: string
}

export const MultiDropdown = ({ values, onChange, options, label = 'Select options', emptyLabel = 'No options available' }: MultiDropdownProps) => {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selectedLabels = options.filter((option) => values.includes(option.value)).map((option) => option.label)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={containerRef} className="relative mt-1 min-w-40">
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-left text-xs transition hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15">
        <span className="truncate text-text-primary">{selectedLabels.length ? selectedLabels.join(', ') : label}</span>
        <ChevronDown className={`size-3.5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-lg border border-border bg-surface p-1 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">{options.length === 0 ? <div className="px-2.5 py-3 text-center text-xs text-text-muted">{emptyLabel}</div> : options.map((option) => { const checked = values.includes(option.value); return <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs text-text-primary hover:bg-surface-subtle"><input type="checkbox" checked={checked} onChange={() => onChange(checked ? values.filter((value) => value !== option.value) : [...values, option.value])} className="accent-accent" />{option.label}</label> })}</div>}
    </div>
  )
}
