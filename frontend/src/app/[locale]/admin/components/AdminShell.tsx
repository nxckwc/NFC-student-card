import { AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <section className="mb-8 flex flex-col gap-4 border-b border-[#dce5de] pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-[#527263]">{eyebrow}</p>
        <h1 className="text-3xl font-bold">{title}</h1>
        {description && <p className="mt-2 text-sm text-[#748078]">{description}</p>}
      </div>
      {action}
    </section>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const t = useTranslations('admin')
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-[#e8bcb6] bg-[#fff8f6] p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm font-medium text-[#99483f]">
        <AlertCircle className="size-5 shrink-0" />
        {message || t('loadError')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-md bg-[#d8675c] px-3 py-2 text-sm font-semibold text-white hover:bg-[#b85349]"
      >
        <RefreshCw className="size-4" />
        {t('retry')}
      </button>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#c8d5cc] bg-white/70 px-5 py-12 text-center text-sm text-[#748078]">
      {message}
    </div>
  )
}

export function DataUnavailableBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-[#dce5de] bg-[#edf3ef] px-5 py-4 text-sm font-medium text-[#627269]">
      {message}
    </div>
  )
}

export function StatCard({
  icon,
  iconClass,
  value,
  label,
  href,
  loading,
}: {
  icon: React.ReactNode
  iconClass: string
  value: string | number
  label: string
  href?: string
  loading?: boolean
}) {
  const body = (
    <>
      <span className={`mb-5 flex size-10 items-center justify-center rounded-lg ${iconClass}`}>{icon}</span>
      {loading ? (
        <div className="skeleton h-9 w-20 rounded-md" />
      ) : (
        <p className="text-3xl font-bold tabular-nums">{value}</p>
      )}
      <p className="mt-1 text-sm font-medium text-[#748078]">{label}</p>
    </>
  )

  const className = 'border border-[#dce5de] bg-white/85 p-5 text-left transition'

  if (!href) {
    return <div className={className}>{body}</div>
  }

  return (
    <Link
      href={href}
      className={`${className} hover:-translate-y-0.5 hover:border-[#b9cbc0] hover:shadow-[0_10px_24px_rgba(52,76,61,0.07)]`}
    >
      {body}
    </Link>
  )
}

export function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'ADMIN'
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
        isAdmin ? 'bg-[#deece4] text-[#356b5c]' : 'bg-[#eef1ef] text-[#748078]'
      }`}
    >
      {role}
    </span>
  )
}
