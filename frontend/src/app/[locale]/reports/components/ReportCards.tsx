'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { formatDay, formatStamp, reportDetail, reportHeading, reportTypeLabel } from '@/lib/reports/format'
import type { StoredReport } from '@/lib/reports/types'

export const StatusBadge = ({ status }: { status: StoredReport['meta']['status'] }) => {
  const t = useTranslations('reports')
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-xs font-bold ${status === 'FINALIZED' ? 'bg-surface-active text-accent-foreground' : 'border border-border text-text-secondary'}`}>
      {t(status === 'FINALIZED' ? 'finalized' : 'provisional')}
    </span>
  )
}

interface Props {
  cards: StoredReport[]
  onDelete: (card: StoredReport) => void
}

export default function ReportCards({ cards, onDelete }: Props) {
  const t = useTranslations('reports')
  const locale = useLocale()

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <li key={card.id} className="relative rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent">
          {/* The link stretches over the whole card; the delete button sits above it. */}
          <Link href={`/${locale}/reports/${card.key}`} className="block pr-10 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-accent">
            <p className="text-xs font-semibold text-accent-foreground">{reportTypeLabel(card.meta.type, t)}</p>
            <h3 className="mt-1 break-words font-bold text-text-primary">{reportHeading(card, t)}</h3>
            {reportDetail(card, t) && <p className="mt-1 text-xs text-text-secondary">{reportDetail(card, t)}</p>}
            {card.meta.type === 'subject' && <p className="mt-1 text-xs text-text-secondary">{t('class')}: {'className' in card.report ? card.report.className : '—'}</p>}
            <p className="mt-2 text-sm text-text-secondary">{formatDay(card.meta.start, locale)} – {formatDay(card.meta.end, locale)}</p>
            <p className="mt-1 text-xs text-text-muted">{t('generated')}: {formatStamp(card.report.generatedAt, card.report.timezone, locale)}</p>
          </Link>
          <div className="mt-3"><StatusBadge status={card.meta.status} /></div>
          <button type="button" onClick={() => onDelete(card)} aria-label={`${t('deleteReport')}: ${reportHeading(card, t)}`} className="absolute right-3 top-3 z-10 rounded-lg p-2 text-text-muted hover:bg-surface-active hover:text-danger-foreground">
            <Trash2 className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  )
}
