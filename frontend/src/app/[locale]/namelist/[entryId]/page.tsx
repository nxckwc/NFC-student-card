"use client"

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Circle, Wifi, WifiOff } from 'lucide-react'
import { EmptyState, ErrorState } from '../../admin/components/AdminShell'
import { fetchNamelist, setNamelistStudentStatus, type NamelistData, type StudentStatus } from '../../admin/lib/api'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100').replace(/\/+$/, '')

const STATUS_ORDER: StudentStatus[] = ['PRESENT', 'LATE', 'ABSENT']

const STATUS_DOT: Record<StudentStatus, string> = {
  PRESENT: 'bg-success',
  LATE: 'bg-info',
  ABSENT: 'bg-purple',
}

const STATUS_BADGE: Record<StudentStatus, string> = {
  PRESENT: 'bg-success/15 text-success',
  LATE: 'bg-info/15 text-info',
  ABSENT: 'bg-purple/15 text-purple-foreground',
}

const STICKY_TH = 'sticky z-10 bg-surface-muted px-4 py-3 shadow-[inset_0_-1px_0_0_var(--border)]'

const formatTime = (value: string | null): string => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function NamelistContent({ entryId }: { entryId: number }) {
  const t = useTranslations('namelist')
  const queryClient = useQueryClient()
  const [isLive, setIsLive] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const queryKey = ['namelist', entryId]
  const query = useQuery({ queryKey, queryFn: () => fetchNamelist(entryId), refetchInterval: 5000 })

  useEffect(() => {
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const visible = currentScrollY <= 8 || currentScrollY < lastScrollY
      setNavVisible(visible)
      lastScrollY = currentScrollY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!Number.isInteger(entryId)) return
    const events = new EventSource(`${API_BASE_URL}/dashboard/namelist/${entryId}/events`)
    events.onopen = () => {
      setIsLive(true)
      void query.refetch()
    }
    events.onmessage = (message) => {
      const event = JSON.parse(message.data) as { studentId: string; status: StudentStatus; presentAt?: string }
      queryClient.setQueryData<NamelistData>(queryKey, (old) => old ? {
        ...old,
        students: old.students.map((student) => student.id === event.studentId
          ? { ...student, status: event.status, presentAt: event.presentAt ?? null }
          : student),
      } : old)
    }
    events.onerror = () => setIsLive(false)
    return () => events.close()
  }, [entryId, queryClient, queryKey])

  const mutation = useMutation({
    mutationFn: ({ studentId, status }: { studentId: string; status: StudentStatus }) => setNamelistStudentStatus(entryId, studentId, status),
    onMutate: async ({ studentId, status }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<NamelistData>(queryKey)
      queryClient.setQueryData<NamelistData>(queryKey, (old) => old ? {
        ...old,
        students: old.students.map((student) => student.id === studentId ? { ...student, status } : student),
      } : old)
      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey }),
  })

  const data = query.data
  const stickyTop = navVisible ? 'top-16' : 'top-0'

  return (
    <main className="min-h-screen bg-background px-4 pb-14 pt-24 text-text-primary sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <Link href="../.." className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-text-primary"><ArrowLeft className="size-4" />{t('back')}</Link>
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted">{data?.entry.subject ?? t('title')}</p>
            <h1 className="mt-1 text-3xl font-bold">{data?.entry.className ?? t('title')}</h1>
            {data && <p className="mt-2 text-sm text-text-secondary">{t('period', { period: data.entry.period })} · {t('room', { room: data.entry.roomId })} · {data.entry.startTime}–{data.entry.endTime}</p>}
          </div>
          <div className={`flex items-center gap-2 text-xs font-bold ${isLive ? 'text-success-foreground' : 'text-text-muted'}`}><span className={isLive ? 'animate-pulse' : ''}><Circle className="size-3 fill-current" /></span>{isLive ? <><Wifi className="size-4" />{t('live')}</> : <><WifiOff className="size-4" />{t('offline')}</>}</div>
        </div>

        {query.isLoading ? <div className="space-y-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="skeleton h-14 rounded-lg" />)}</div>
          : query.error ? <ErrorState message={t('loadError')} onRetry={() => void query.refetch()} />
          : !data?.students.length ? <EmptyState message={t('noStudents')} />
          : <div className="rounded-lg border border-border bg-surface shadow-sm">
            <table className="w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  <th className={`${STICKY_TH} ${stickyTop}`}>{t('name')}</th>
                  <th className={`${STICKY_TH} ${stickyTop}`}>{t('studentId')}</th>
                  <th className={`${STICKY_TH} ${stickyTop}`}>{t('status')}</th>
                  <th className={`${STICKY_TH} ${stickyTop}`}>{t('time')}</th>
                  <th className={`${STICKY_TH} ${stickyTop}`}>
                    <div className="flex justify-end gap-6">
                      {STATUS_ORDER.map((status) => <span key={status} className="flex w-6 items-center justify-center whitespace-nowrap text-[10px] font-bold leading-none normal-case tracking-normal text-text-muted">{t(status.toLowerCase())}</span>)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((student) => <StudentRow key={student.id} student={student} onStatus={(status) => mutation.mutate({ studentId: student.id, status })} disabled={mutation.isPending} t={t} />)}
              </tbody>
            </table>
          </div>}
      </div>
    </main>
  )
}

function StudentRow({ student, onStatus, disabled, t }: { student: NamelistData['students'][number]; onStatus: (status: StudentStatus) => void; disabled: boolean; t: (key: string) => string }) {
  return (
    <tr className="border-b border-border-soft last:border-b-0 hover:bg-surface-hover">
      <td className="px-4 py-3 font-bold">{student.firstName} {student.lastName}</td>
      <td className="px-4 py-3 text-text-muted">{student.studentId ?? '—'}</td>
      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[student.status]}`}>{t(student.status.toLowerCase())}</span></td>
      <td className="px-4 py-3 tabular-nums text-text-muted">{formatTime(student.presentAt)}</td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-6">
          {STATUS_ORDER.map((status) => <button key={status} type="button" disabled={disabled} aria-pressed={student.status === status} aria-label={t(status.toLowerCase())} title={t(status.toLowerCase())} onClick={() => onStatus(status)} className={`flex size-6 items-center justify-center rounded-full border-2 transition ${student.status === status ? `border-transparent ${STATUS_DOT[status]}` : 'border-border-strong bg-transparent hover:border-text-muted'}`}>{student.status === status && <span className="size-2 rounded-full bg-white" />}</button>)}
        </div>
      </td>
    </tr>
  )
}

export default function NamelistPage({ params }: { params: Promise<{ entryId: string }> }) {
  const { entryId: rawEntryId } = use(params)
  const entryId = Number(rawEntryId)
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}><NamelistContent entryId={entryId} /></QueryClientProvider>
}
