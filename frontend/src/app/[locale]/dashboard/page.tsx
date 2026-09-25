"use client"

import { useEffect, useState } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'motion/react'
import {
  PersonAccounts24Filled,
} from '@fluentui/react-icons'
import { AlertCircle, ArrowUpRight, CalendarDays, Check, ChevronRight, Clock3, MapPin, RefreshCw, Sparkles } from 'lucide-react'

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100').replace(/\/+$/, '')

const days = [1, 2, 3, 4, 5, 6, 7]

interface ScheduleEntry {
  id: number
  weekday: number
  period: number
  subject: string
  className: string
  roomId: string
  startTime: string
  endTime: string
}

interface SessionResponse {
  user: { username: string; role: string }
}

const getDashboardData = async (): Promise<{ schedule: ScheduleEntry[]; username: string; role: string }> => {
  const sessionResponse = await axios.get<SessionResponse>(`${API_BASE_URL}/auth/session`, { withCredentials: true })
  const scheduleResponse = sessionResponse.data.user.role === 'USER'
    ? { data: { schedule: [] } }
    : await axios.get<{ schedule: ScheduleEntry[] }>(`${API_BASE_URL}/dashboard/schedule`, { withCredentials: true })

  return {
    schedule: scheduleResponse.data.schedule,
    username: sessionResponse.data.user.username,
    role: sessionResponse.data.user.role,
  }
}

const currentWeekday = (): number => {
  const day = new Date().getDay()
  return day === 0 ? 7 : day
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function DashboardContent() {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations('dashboard')
  const [selectedDay, setSelectedDay] = useState(currentWeekday)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null)
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-schedule'],
    queryFn: getDashboardData,
    refetchInterval: 5000,
  })

  const selectedLessons = (data?.schedule ?? []).filter((entry) => entry.weekday === selectedDay)
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
  const selectedDayLabel = t(`days.${selectedDay}.full`)
  const dateLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(currentTime)

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  const isCurrentLesson = (lesson: ScheduleEntry): boolean => (
    selectedDay === currentWeekday()
    && currentMinutes >= toMinutes(lesson.startTime)
    && currentMinutes < toMinutes(lesson.endTime)
  )

  const todayLessons = (data?.schedule ?? []).filter((entry) => entry.weekday === currentWeekday()).sort((a, b) => a.period - b.period)
  const currentLesson = todayLessons.find(isCurrentLesson)
  const nextLesson = todayLessons.find((lesson) => toMinutes(lesson.startTime) > currentMinutes)
  const completedToday = todayLessons.filter((lesson) => toMinutes(lesson.endTime) <= currentMinutes).length
  const lessonProgress = currentLesson
    ? Math.min(100, Math.max(0, ((currentMinutes - toMinutes(currentLesson.startTime)) / (toMinutes(currentLesson.endTime) - toMinutes(currentLesson.startTime))) * 100))
    : 0

  if (data?.role === 'USER') {
    return (
      <AnimatePresence mode="wait">
        <motion.main
          key="student-dashboard"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="relative min-h-screen overflow-hidden bg-background px-4 pb-14 pt-24 text-text-primary sm:px-6 lg:px-8"
        >
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(112,139,122,0.16)_1px,transparent_1px)] bg-size-[24px_24px]" />
        <div className="relative mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl items-center">
          <motion.section
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
            className="grid w-full overflow-hidden rounded-lg border border-border bg-surface shadow-[0_18px_50px_rgba(52,92,70,0.1)] md:grid-cols-[1.2fr_0.8fr]"
          >
            <div className="p-8 sm:p-12">
              <span className="mb-8 inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-accent-foreground"><Sparkles className="size-3.5" /> {t('workspace')}</span>
              <h1 className="max-w-lg text-4xl font-bold leading-tight text-text-primary sm:text-5xl">{t('welcome', { username: data?.username ?? 'Student' })}</h1>
              <p className="mt-4 max-w-md text-base leading-7 text-text-secondary">{t('noPeriods', { day: selectedDayLabel })}</p>
              <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-text-muted"><CalendarDays className="size-4 text-danger-accent" /> {dateLabel}</div>
            </div>
            <div className="flex flex-col justify-between bg-accent p-8 text-white sm:p-12">
              <PersonAccounts24Filled className="size-10 opacity-70" />
              <div><p className="text-sm font-medium text-white/70">{t('insights')}</p><p className="mt-2 text-2xl font-bold">{t('scheduleStatus')}</p><p className="mt-3 text-sm leading-6 text-white/75">{t('weeklySchedule')}</p></div>
            </div>
          </motion.section>
        </div>
        </motion.main>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key="staff-dashboard"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -18 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative min-h-screen overflow-x-hidden bg-background px-4 pb-14 pt-24 text-text-primary sm:px-6 lg:flex lg:h-dvh lg:min-h-0 lg:flex-col lg:overflow-hidden lg:px-8 lg:pb-6"
      >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle,rgba(112,139,122,0.16)_1px,transparent_1px)] bg-size-[24px_24px]" />
      <div className="relative mx-auto flex min-h-0 w-full max-w-7xl min-w-0 flex-1 flex-col">
        <section className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-3" aria-labelledby="dashboard-title">
          <div className="flex min-w-0 items-center gap-3"><span className="h-8 w-1 shrink-0 rounded-full bg-danger-accent" /><div className="min-w-0"><h1 id="dashboard-title" className="truncate text-lg font-bold text-text-primary sm:text-xl">{t('currentPeriod')}</h1><p className="truncate text-xs text-text-muted">{t('today', { date: dateLabel })}</p></div></div>
          
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.45fr_0.55fr]" aria-label={t('insights')}>
          <div className="relative overflow-hidden rounded-lg bg-accent p-6 text-white shadow-[0_16px_34px_rgba(52,92,70,0.16)] sm:p-8">
            <div className="absolute -right-8 -top-12 size-48 rounded-full border-[24px] border-white/10" />
            <div className="relative flex h-full flex-col justify-between gap-10"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-white/65">{currentLesson ? t('current') : t('scheduleStatus')}</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">{currentLesson?.subject ?? nextLesson?.subject ?? t('noPeriods', { day: t(`days.${currentWeekday()}.full`) })}</h2></div><Clock3 className="size-8 text-white/60" /></div><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-sm text-white/70">{currentLesson ? `${currentLesson.startTime} - ${currentLesson.endTime}` : nextLesson ? `${t('statusFuture')} · ${nextLesson.startTime}` : t('weeklySchedule')}</p>{currentLesson && <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold"><MapPin className="size-4" /> {t('room', { id: currentLesson.roomId })}</p>}</div><div className="min-w-40"><div className="mb-2 flex justify-between text-xs font-bold text-white/70"><span>{currentLesson ? t('lessonProgress') : t('statusFuture')}</span><span>{currentLesson ? `${Math.round(lessonProgress)}%` : '0%'}</span></div><div className="h-2 overflow-hidden rounded-full bg-black/15"><div className="h-full rounded-full bg-danger-accent" style={{ width: `${currentLesson ? lessonProgress : 0}%` }} /></div></div></div></div>
          </div>
          <Link href={currentLesson ? `/${locale}/namelist/${currentLesson.id}` : `/${locale}/schedule`} className="rounded-lg border border-border bg-surface p-6 shadow-sm"><div className="mb-8 flex items-center justify-between"><span className="flex size-10 items-center justify-center rounded-lg bg-danger-soft text-danger-foreground"><CalendarDays className="size-5" /></span><ArrowUpRight className="size-4 text-text-faint" /></div><p className="text-xs font-bold uppercase tracking-wide text-text-muted">{t('periodCount', { count: todayLessons.length })}</p><p className="mt-2 text-3xl font-bold text-text-primary">{completedToday} <span className="text-base font-medium text-text-muted">/ {todayLessons.length || 0}</span></p><p className="mt-1 text-sm text-text-secondary">{t(`days.${currentWeekday()}.full`)}</p></Link>
        </section>

        <section id="schedule" className="grid min-h-0 min-w-0 gap-8 lg:h-full lg:flex-1 lg:grid-cols-[minmax(0,1fr)_280px]" aria-labelledby="schedule-title">
          <div className="min-w-0 lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col">
            
            <div className="mb-6 grid w-full grid-cols-7 border-b border-border" role="tablist" aria-label={t('selectDay')}>
              {days.map((day) => <button key={day} type="button" role="tab" aria-selected={selectedDay === day} className={`relative min-w-0 px-0 pb-3 pt-1 text-center text-xs font-bold transition sm:px-2 sm:text-sm ${selectedDay === day ? 'text-accent-foreground after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:bg-danger-accent sm:after:inset-x-2' : 'text-text-muted hover:text-text-primary'}`} onClick={() => setSelectedDay(day)}>{t(`days.${day}.short`)}</button>)}
            </div>

          {isLoading ? (
            <div className="schedule-rail min-h-0 space-y-3 rounded-lg border border-border bg-surface/45 p-3 pb-6 lg:flex-1 lg:overflow-y-auto lg:pr-2" aria-label={t('loading')}>
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="skeleton h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-danger-border bg-danger-bg p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-sm font-medium text-danger-foreground"><AlertCircle className="size-5" />{t('loadError')}</p>
              <button type="button" className="inline-flex items-center gap-2 rounded-md bg-danger px-3 py-2 text-sm font-semibold text-white hover:bg-danger-hover" onClick={() => void refetch()}><RefreshCw className="size-4" />{t('retry')}</button>
            </div>
          ) : selectedLessons.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-dashed bg-surface/70 px-5 py-12 text-center text-sm text-text-muted">{t('noPeriods', { day: selectedDayLabel })}</div>
          ) : (
            <div className="schedule-rail min-h-0 space-y-3 rounded-lg border border-border bg-surface/45 p-3 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2" aria-label={`${selectedDayLabel} ${t('weeklySchedule')}`}>
              {selectedLessons.map((lesson) => {
                const isCurrent = isCurrentLesson(lesson)
                const isSelected = selectedLessonId === lesson.id

                return (
                <button
                  key={lesson.id}
                  type="button"
                  disabled={!isCurrent}
                  aria-pressed={isSelected}
                  aria-label={`Period ${lesson.period}: ${lesson.subject}, ${isCurrent ? t('inProgress') : t('unavailable')}`}
                  onClick={() => { setSelectedLessonId(lesson.id); router.push(`/${locale}/namelist/${lesson.id}`) }}
                  className={`relative grid min-h-24 w-full grid-cols-[4.5rem_1fr_auto] items-center gap-3 overflow-hidden rounded-lg border p-4 text-left transition sm:grid-cols-[5.5rem_1fr_auto] sm:gap-5 ${isCurrent ? `border-accent-border bg-surface shadow-[0_10px_28px_rgba(52,92,70,0.1)] ${isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-background' : 'hover:border-accent-border-hover'}` : 'cursor-not-allowed border-border bg-surface-muted opacity-60 grayscale'}`}
                >
                  <span className={`absolute inset-y-0 left-0 w-1 ${isCurrent ? 'bg-danger-accent' : 'bg-neutral'}`} />
                  <div className="border-r border-border-soft pr-3"><span className="block text-xs font-bold uppercase text-text-muted">Period</span><span className="text-xl font-bold text-text-primary">{lesson.period}</span><span className="mt-1 block text-xs tabular-nums text-text-muted">{lesson.startTime}</span></div>
                  <div className="min-w-0"><h3 className="truncate text-lg font-bold text-text-primary">{lesson.subject}</h3><p className="mt-1 truncate text-sm text-text-secondary">{t('class', { name: lesson.className })} <span className="mx-1 text-text-faint">·</span> {t('room', { id: lesson.roomId })}</p></div>
                  <div className="flex items-center gap-2 text-right">{isCurrent ? <span className="hidden rounded-md bg-danger-accent px-2 py-1 text-xs font-bold text-white sm:inline">{t('current')}</span> : <Check className="size-4 text-text-faint" />}<ChevronRight className="size-4 text-text-faint" /></div>
                </button>
                )
              })}
            </div>
          )}
          </div>
          
        </section>
      </div>
      </motion.main>
    </AnimatePresence>
  )
}

export default function Dashboard() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  )
}
