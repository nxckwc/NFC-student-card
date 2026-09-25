"use client"

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  GraduationCap,
  Radio,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { DataUnavailableBanner, ErrorState } from './components/AdminShell'
import { fetchOverview, type OverviewGateLog } from './lib/api'

/* ── Donut chart ──────────────────────────────────────────────── */

const RADIUS = 45
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Segment { value: number; color: string }

const Donut = ({ segments, centerLabel, centerValue }: {
  segments: Segment[]; centerLabel: string; centerValue: string
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  let offset = 0

  return (
    <div className="relative flex size-44 shrink-0 items-center justify-center">
      <svg viewBox="0 0 120 120" className="size-44 -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--border-soft)" strokeWidth="12" strokeLinecap="round" />
        {total > 0 &&
          segments.map((segment, i) => {
            if (segment.value <= 0) return null
            const dash = (segment.value / total) * CIRCUMFERENCE
            const gap = 2
            const el = (
              <circle
                key={i}
                cx="60" cy="60" r={RADIUS}
                fill="none"
                stroke={segment.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, dash - gap)} ${CIRCUMFERENCE - Math.max(0, dash - gap)}`}
                strokeDashoffset={-offset}
                className="transition-all duration-700 ease-out"
              />
            )
            offset += dash
            return el
          })}
      </svg>
      <div className="absolute flex flex-col items-center leading-tight">
        <span className="text-3xl font-bold tabular-nums text-text-primary">{centerValue}</span>
        <span className="mt-1 text-xs font-medium text-text-muted">{centerLabel}</span>
      </div>
    </div>
  )
}

/* ── KPI Card ─────────────────────────────────────────────────── */

const KpiCard = ({ icon, iconClass, value, label, detail, loading }: {
  icon: React.ReactNode
  iconClass: string
  value: string | number
  label: string
  detail?: string
  loading?: boolean
}) => (
  <div className="group relative overflow-hidden rounded-xl border border-border bg-surface/80 p-4 transition-colors hover:border-border-strong">
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        {loading ? (
          <div className="skeleton mt-2 h-8 w-16 rounded-md" />
        ) : (
          <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">{value}</p>
        )}
        {detail && <p className="mt-1 truncate text-xs text-text-faint">{detail}</p>}
      </div>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span>
    </div>
  </div>
)

/* ── Status helpers ───────────────────────────────────────────── */

const statusStyle = (status: string) => {
  switch (status) {
    case 'LATE':
      return 'bg-warning-soft text-warning-foreground'
    case 'OUT':
      return 'bg-surface-chip text-text-secondary'
    default:
      return 'bg-accent-soft text-accent-foreground'
  }
}

/* ── Activity row ─────────────────────────────────────────────── */

const ActivityRow = ({ log, locale, statusLabel }: {
  log: OverviewGateLog; locale: string; statusLabel: string
}) => (
  <div className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-hover">
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-foreground">
      {log.student.firstName.charAt(0).toUpperCase()}
    </span>
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-text-primary">
        {log.student.firstName} {log.student.lastName}
      </span>
      <span className="text-xs text-text-faint">
        {new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(new Date(log.inAt))}
      </span>
    </span>
    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusStyle(log.inStatus)}`}>
      {statusLabel}
    </span>
  </div>
)

/* ── Legend row ────────────────────────────────────────────────── */

const LegendRow = ({ color, label, value }: {
  color: string; label: string; value: string | number
}) => (
  <div className="flex items-center gap-2.5">
    <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
    <span className="min-w-0 flex-1 truncate text-sm text-text-secondary">{label}</span>
    <span className="shrink-0 text-sm font-semibold tabular-nums text-text-primary">{value}</span>
  </div>
)

/* ── Card wrapper ─────────────────────────────────────────────── */

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`overflow-hidden rounded-xl border border-border bg-surface/80 ${className}`}>
    {children}
  </div>
)

const CardHeader = ({ children, trailing }: { children: React.ReactNode; trailing?: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
    <div className="flex items-center gap-2">{children}</div>
    {trailing}
  </div>
)

/* ── Page ─────────────────────────────────────────────────────── */

const OverviewPage = () => {
  const locale = useLocale()
  const t = useTranslations('admin')

  const overviewQuery = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: fetchOverview,
    refetchInterval: 15000,
  })

  const overview = overviewQuery.data
  const loading = overviewQuery.isLoading
  const dataAvailable = overview?.studentDataAvailable !== false

  const students = overview?.students ?? null
  const scanned = overview?.scannedStudents ?? null
  const late = overview?.lateStudents ?? null
  const notScanned = overview?.notScannedStudents ?? null
  const onTime = scanned !== null && late !== null ? Math.max(0, scanned - late) : null
  const recentLogs = overview?.recentGateLogs ?? []

  const attendancePct = students && students > 0 && scanned !== null
    ? Math.min(100, Math.round((scanned / students) * 100))
    : 0

  return (
    <div className="space-y-5">
      {/* ── KPI strip ──────────────────────────────────────────── */}
      <section
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        aria-label={t('systemOverview')}
      >
        <KpiCard
          icon={<GraduationCap className="size-4" />}
          iconClass="bg-accent-soft text-accent-foreground"
          value={loading || students === null ? '—' : students}
          label={t('students')}
          detail={t('registeredStudents')}
          loading={loading}
        />
        <KpiCard
          icon={<CheckCircle2 className="size-4" />}
          iconClass="bg-info-soft text-info"
          value={loading || scanned === null ? '—' : scanned}
          label={t('scannedAtGate')}
          detail={t('scannedDetail', { pct: attendancePct })}
          loading={loading}
        />
        <KpiCard
          icon={<Timer className="size-4" />}
          iconClass="bg-warning-soft text-warning-foreground"
          value={loading || late === null ? '—' : late}
          label={t('lateArrivals')}
          detail={t('lateDetail')}
          loading={loading}
        />
        <KpiCard
          icon={<Radio className="size-4" />}
          iconClass="bg-surface-chip text-text-secondary"
          value={loading || overview?.readers === undefined ? '—' : overview.readers}
          label={t('activeReaders')}
          detail={t('readersDetail')}
          loading={loading}
        />
      </section>

      {/* ── Attendance + Activity ──────────────────────────────── */}
      {dataAvailable ? (
        <section className="grid gap-4 lg:grid-cols-6" aria-label={t('attendanceStats')}>
          {/* Attendance donut card */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <span className="flex size-6 items-center justify-center rounded-md bg-surface-chip text-text-secondary">
                <TrendingUp className="size-3.5" />
              </span>
              <h2 className="text-sm font-semibold text-text-primary">{t('attendanceStats')}</h2>
            </CardHeader>

            <div className="flex flex-col items-center gap-6 p-6">
              <Donut
                centerLabel={t('scannedAtGate')}
                centerValue={loading || students === null ? '—' : `${attendancePct}%`}
                segments={
                  loading || students === null
                    ? []
                    : [
                        { value: onTime ?? 0, color: 'var(--accent)' },
                        { value: late ?? 0, color: 'var(--warning)' },
                        { value: notScanned ?? 0, color: 'var(--neutral)' },
                      ]
                }
              />
              <div className="w-full space-y-2.5">
                <LegendRow color="var(--accent)" label={t('onTime')} value={loading || onTime === null ? '—' : onTime} />
                <LegendRow color="var(--warning)" label={t('lateArrivals')} value={loading || late === null ? '—' : late} />
                <LegendRow color="var(--neutral)" label={t('notScanned')} value={loading || notScanned === null ? '—' : notScanned} />
              </div>
            </div>
          </Card>

          {/* Recent activity card */}
          <Card className="lg:col-span-3">
            <CardHeader
              trailing={
                <Link
                  href={`/${locale}/admin/activity`}
                  className="flex items-center gap-1 text-xs font-semibold text-accent-foreground transition-colors hover:text-accent-hover"
                >
                  {t('viewAll')}
                  <ArrowUpRight className="size-3.5" />
                </Link>
              }
            >
              <CalendarClock className="size-4 text-accent-foreground" />
              <h2 className="text-sm font-semibold text-text-primary">{t('recentActivity')}</h2>
            </CardHeader>

            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="skeleton h-10 rounded-lg" />
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-14 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-surface-chip text-text-faint">
                  <Activity className="size-5" />
                </span>
                <p className="text-sm text-text-muted">{t('noLatestLog')}</p>
              </div>
            ) : (
              <div className="divide-y divide-border-soft">
                {recentLogs.map((log, i) => (
                  <ActivityRow
                    key={i}
                    log={log}
                    locale={locale}
                    statusLabel={log.inStatus === 'LATE' ? t('late') : t('onTime')}
                  />
                ))}
              </div>
            )}
          </Card>
        </section>
      ) : (
        <DataUnavailableBanner message={t('studentDataUnavailable')} />
      )}

      {overviewQuery.isError && (
        <ErrorState message="" onRetry={() => void overviewQuery.refetch()} />
      )}
    </div>
  )
}

export default OverviewPage
