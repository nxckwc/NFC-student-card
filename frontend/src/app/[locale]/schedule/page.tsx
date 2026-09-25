'use client'

import { useState } from 'react'
import axios from 'axios'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { AlertCircle, MapPin, RefreshCw } from 'lucide-react'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100').replace(/\/+$/, '')
const days = [1, 2, 3, 4, 5, 6, 7]
const periods = [1, 2, 3, 4, 5, 6, 7, 8]

interface ScheduleEntry {
  id: number
  weekday: number
  period: number
  subject: string
  className: string
  roomId: string
  startTime: string
  endTime: string
  attendanceStatus: 'FUTURE' | 'PENDING' | 'COMPLETED'
}

const fetchSchedule = async (): Promise<ScheduleEntry[]> => {
  const { data } = await axios.get<{ schedule: ScheduleEntry[] }>(`${API_BASE_URL}/dashboard/schedule`, { withCredentials: true })
  return data.schedule
}

function ScheduleContent() {
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['schedule-page'],
    queryFn: fetchSchedule,
    refetchInterval: 10000,
  })

  const schedule = data ?? []
  const dateLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(new Date())

  return (
    <main className="relative h-[100svh] overflow-hidden bg-background px-4 pb-4 pt-20 text-text-primary sm:px-6 sm:pb-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(112,139,122,0.16)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="relative mx-auto flex h-full max-w-7xl min-h-0 flex-col">
        <header className="mb-3 flex shrink-0 flex-col gap-2 border-b border-border pb-3 sm:mb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-4">
          <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{t('weeklySchedule')}</h1>
          <p className="text-sm font-medium text-text-muted">{dateLabel}</p>
        </header>

        {isLoading ? (
          <div className="min-h-0 flex-1 space-y-3 overflow-hidden rounded-lg border border-border bg-surface/45 p-3" aria-label={t('loading')}>
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="skeleton h-16 rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-danger-border bg-danger-bg p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm font-medium text-danger-foreground"><AlertCircle className="size-5" />{t('loadError')}</p>
            <button type="button" className="inline-flex items-center gap-2 rounded-md bg-danger px-3 py-2 text-sm font-semibold text-white hover:bg-danger-hover" onClick={() => void refetch()}><RefreshCw className="size-4" />{t('retry')}</button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface shadow-[0_8px_28px_rgba(52,76,61,0.06)]">
            <div className="h-full overflow-x-auto">
            <table className="h-full w-full min-w-[880px] table-fixed border-collapse text-center">
              <thead>
                <tr className="bg-accent-soft text-sm font-bold text-text-primary">
                  <th className="sticky left-0 z-10 w-16 border border-border bg-accent-soft px-1 py-2 text-[10px] font-bold sm:w-28 sm:px-3 sm:py-3 sm:text-sm">{t('dayAndPeriod')}</th>
                  {periods.map((period) => <th key={period} className="border border-border px-0.5 py-2 text-xs sm:px-2 sm:py-3 sm:text-sm">{period}</th>)}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <th scope="row" className="sticky left-0 z-10 border border-border bg-surface-muted px-1 py-2 text-[10px] font-bold leading-4 text-text-primary sm:px-3 sm:py-4 sm:text-sm">{t(`days.${day}.full`)}</th>
                    {periods.map((period) => {
                      const lesson = schedule.find((entry) => entry.weekday === day && entry.period === period)
                      if (!lesson) return <td key={period} className="border border-border bg-background/40" />
                      const statusClass = lesson.attendanceStatus === 'COMPLETED'
                        ? 'border-success bg-success text-white'
                        : lesson.attendanceStatus === 'PENDING'
                          ? 'border-danger-accent bg-danger-accent text-white'
                          : 'border-neutral bg-neutral text-white opacity-75'
                      return (
                        <td key={period} className="border border-border p-0.5 align-middle sm:p-1">
                          <div className={`flex h-full min-h-0 items-center justify-between gap-1 overflow-hidden rounded-md border px-1 py-1 text-left sm:px-1.5 sm:py-1.5 ${statusClass}`}>
                            <strong className="line-clamp-2 min-w-0 flex-1 text-xs leading-4 sm:text-sm sm:leading-5">{lesson.subject}</strong>
                            <div className="flex min-w-0 shrink-0 flex-col items-end justify-center gap-0.5 text-right">
                              <span className="line-clamp-1 max-w-full text-[9px] font-semibold leading-3 sm:text-[10px]">{lesson.className}</span>
                              <span className="flex max-w-full items-center gap-0.5 text-[9px] leading-3 sm:text-[10px]"><MapPin className="size-2.5 shrink-0" />{lesson.roomId}</span>
                            </div>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>            </div>          </div>
        )}
      </div>
    </main>
  )
}

export default function SchedulePage() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ScheduleContent />
    </QueryClientProvider>
  )
}