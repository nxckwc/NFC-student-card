"use client"

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Check, Copy, GraduationCap, Pencil, Search, Trash2, UserPlus, X } from 'lucide-react'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DataUnavailableBanner, EmptyState, ErrorState, PageHeader } from '../components/AdminShell'
import { createStudent, deleteStudentApi, fetchStudents, getApiErrorMessage, updateStudent, type Student } from '../lib/api'

const StudentsPage = () => {
  const locale = useLocale()
  const t = useTranslations('admin')
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [classSection, setClassSection] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState({ firstName: '', lastName: '', studentId: '', classSection: '' })
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; message: string; card?: string } | null>(null)

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    if (!feedback) return
    const timeout = setTimeout(() => setFeedback(null), 4000)
    return () => clearTimeout(timeout)
  }, [feedback])

  const studentsQuery = useQuery({ queryKey: ['admin', 'students', search], queryFn: () => fetchStudents(search) })
  const students = studentsQuery.data?.studentDataAvailable ? studentsQuery.data.students ?? [] : null

  const addMutation = useMutation({
    mutationFn: () => createStudent(firstName.trim(), lastName.trim(), studentId.trim(), classSection.trim()),
    onSuccess: (student) => {
      setFirstName('')
      setLastName('')
      setStudentId('')
      setClassSection('')
      setFeedback({ kind: 'success', message: t('addStudentSuccess', { name: `${student.firstName} ${student.lastName}`, studentId: student.studentId ?? '' }) })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => setFeedback({ kind: 'error', message: getApiErrorMessage(error) ?? t('loadError') }),
  })

  const editMutation = useMutation({
    mutationFn: () => updateStudent(editingId ?? '', editValues.firstName.trim(), editValues.lastName.trim(), editValues.studentId.trim(), editValues.classSection.trim()),
    onSuccess: (student) => {
      setEditingId(null)
      setFeedback({ kind: 'success', message: t('studentUpdated', { name: `${student.firstName} ${student.lastName}` }) })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
    },
    onError: (error) => setFeedback({ kind: 'error', message: getApiErrorMessage(error) ?? t('loadError') }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStudentApi(id),
    onSuccess: () => {
      setStudentToDelete(null)
      setFeedback({ kind: 'success', message: t('studentDeleted') })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      setStudentToDelete(null)
      setFeedback({ kind: 'error', message: getApiErrorMessage(error) ?? t('loadError') })
    },
  })

  const canAdd = firstName.trim().length > 0 && lastName.trim().length > 0 && /^\d+$/.test(studentId.trim()) && classSection.trim().length > 0

  const copyCard = async (studentId: string, uidCard: string | null) => {
    if (!uidCard) return
    try {
      await navigator.clipboard.writeText(uidCard)
      setCopiedId(studentId)
      setTimeout(() => setCopiedId((current) => (current === studentId ? null : current)), 2000)
    } catch {
      setFeedback({ kind: 'error', message: t('copyFailed') })
    }
  }

  const beginEdit = (student: Student) => {
    setEditingId(student.id)
    setEditValues({ firstName: student.firstName, lastName: student.lastName, studentId: student.studentId ?? '', classSection: student.classSection ?? '' })
  }

  return (
    <>
      <PageHeader
        eyebrow={t('studentManagement')}
        title={t('students')}
        description={t('studentsDescription')}
      />

      {feedback && (
        <div
          className={`mb-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm font-semibold ${
            feedback.kind === 'error' ? 'border-danger-border bg-danger-bg text-danger-foreground' : 'border-accent-border bg-surface-soft text-accent-foreground'
          }`}
          role="status"
        >
          {feedback.kind === 'error' ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <Check className="mt-0.5 size-4 shrink-0" />}
          <span className="break-all">{feedback.message}</span>
        </div>
      )}

      {studentsQuery.data?.studentDataAvailable === false ? (
        <DataUnavailableBanner message={t('studentDataUnavailable')} />
      ) : (
        <>
          <form
            className="mb-6 overflow-hidden rounded-lg border border-border bg-surface/90 shadow-[0_8px_20px_rgba(38,51,46,0.05)]"
            onSubmit={(event) => {
              event.preventDefault()
              if (canAdd) addMutation.mutate()
            }}
          >
            <div className="flex items-center gap-2 border-b border-border-soft bg-surface-subtle px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent text-white">
                  <UserPlus className="size-4" />
                </span>
                <h2 className="truncate text-sm font-bold text-text-primary">{t('addStudent')}</h2>
              </div>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1fr_auto]">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value.replace(/[^0-9]/g, ''))}
                placeholder={t('studentId')}
                aria-label={t('studentId')}
                required
                className="min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-text-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder={t('firstName')}
                aria-label={t('firstName')}
                required
                className="min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-text-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder={t('lastName')}
                aria-label={t('lastName')}
                required
                className="min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-text-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <input
                type="text"
                value={classSection}
                onChange={(event) => setClassSection(event.target.value)}
                placeholder={t('classSectionPlaceholder')}
                aria-label={t('classSection')}
                required
                className="min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none transition placeholder:text-text-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
              />
              <button
                type="submit"
                disabled={!canAdd || addMutation.isPending}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-accent px-3 py-2 text-sm font-bold text-white transition hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus className="size-4" />
                {t('addStudent')}
              </button>
            </div>
          </form>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-faint" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('searchStudents')}
                aria-label={t('searchStudents')}
                className="w-full rounded-lg border border-border bg-surface/85 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent"
              />
            </div>
            {students && <p className="text-sm text-text-muted">{t('studentCount', { count: students.length })}</p>}
          </div>

          {studentsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton h-16 rounded-lg" />)}
            </div>
          ) : studentsQuery.isError ? (
            <ErrorState message="" onRetry={() => void studentsQuery.refetch()} />
          ) : !students ? (
            <DataUnavailableBanner message={t('studentDataUnavailable')} />
          ) : students.length === 0 ? (
            <EmptyState message={search ? t('noStudentsFound') : t('noStudents')} />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface/85">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-soft text-xs uppercase text-text-faint">
                    <th scope="col" className="px-4 py-3 font-bold">{t('student')}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t('studentId')}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t('classSection')}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t('cardUid')}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t('checkIns')}</th>
                    <th scope="col" className="px-4 py-3 font-bold">{t('added')}</th>
                    <th scope="col" className="px-4 py-3 text-right font-bold">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-border-soft last:border-0 hover:bg-surface-row">
                      <td colSpan={editingId === student.id ? 6 : 1} className="px-4 py-3">
                        {editingId === student.id ? <div className="flex flex-col gap-2 sm:flex-row"><input value={editValues.firstName} onChange={(event) => setEditValues({ ...editValues, firstName: event.target.value })} aria-label={t('firstName')} className="w-full rounded border border-border px-2 py-1 text-sm sm:w-32" /><input value={editValues.lastName} onChange={(event) => setEditValues({ ...editValues, lastName: event.target.value })} aria-label={t('lastName')} className="w-full rounded border border-border px-2 py-1 text-sm sm:w-32" /><input value={editValues.studentId} onChange={(event) => setEditValues({ ...editValues, studentId: event.target.value.replace(/[^0-9]/g, '') })} aria-label={t('studentId')} className="w-full rounded border border-border px-2 py-1 text-sm sm:w-32" /><input value={editValues.classSection} onChange={(event) => setEditValues({ ...editValues, classSection: event.target.value })} aria-label={t('classSection')} className="w-full rounded border border-border px-2 py-1 text-sm sm:w-24" /></div> : <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
                            <GraduationCap className="size-4" />
                          </span>
                          <span className="font-bold">{student.firstName} {student.lastName}</span>
                        </div>}
                      </td>
                      {editingId !== student.id && <td className="px-4 py-3 tabular-nums text-text-secondary">{student.studentId ?? '—'}</td>}
                      {editingId !== student.id && <td className="px-4 py-3 text-text-secondary">{student.classSection ?? '—'}</td>}
                      {editingId !== student.id && <td className="px-4 py-3">
                        {student.uid_card ? (
                          <button
                            type="button"
                            onClick={() => void copyCard(student.id, student.uid_card)}
                            title={t('copyCardId')}
                            className="flex items-center gap-2 rounded font-mono text-xs text-text-secondary transition hover:bg-surface-chip"
                          >
                            <span className="truncate">{student.uid_card}</span>
                            {copiedId === student.id ? <Check className="size-3.5 shrink-0 text-accent-foreground" /> : <Copy className="size-3.5 shrink-0 text-text-faint" />}
                          </button>
                        ) : (
                          <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-text-faint">{t('cardNotRegistered')}</span>
                        )}
                      </td>}
                      {editingId !== student.id && <td className="px-4 py-3 tabular-nums text-text-nav">{student._count.gateLogs + student._count.roomLogs}</td>}
                      {editingId !== student.id && <td className="px-4 py-3 text-text-nav">
                        {new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(student.createdAt))}
                      </td>}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {editingId === student.id ? <>
                            <button type="button" onClick={() => editMutation.mutate()} disabled={!editValues.firstName.trim() || !editValues.lastName.trim() || !/^\d+$/.test(editValues.studentId) || !editValues.classSection.trim() || editMutation.isPending} title={t('save')} aria-label={t('save')} className="rounded-md p-2 text-accent-foreground transition hover:bg-surface-active disabled:opacity-40"><Check className="size-4" /></button>
                            <button type="button" onClick={() => setEditingId(null)} disabled={editMutation.isPending} title={t('cancel')} aria-label={t('cancel')} className="rounded-md p-2 text-text-secondary transition hover:bg-surface-active disabled:opacity-40"><X className="size-4" /></button>
                          </> : <>
                            <button type="button" onClick={() => beginEdit(student)} title={t('editStudent')} aria-label={`${t('editStudent')} ${student.firstName} ${student.lastName}`} className="rounded-md p-2 text-text-secondary transition hover:bg-surface-active hover:text-accent-foreground"><Pencil className="size-4" /></button>
                            <button type="button" onClick={() => setStudentToDelete(student)} title={t('deleteStudent')} aria-label={`${t('deleteStudent')} ${student.firstName} ${student.lastName}`} className="rounded-md p-2 text-danger-foreground transition hover:bg-danger-soft"><Trash2 className="size-4" /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={studentToDelete !== null}
        title={t('deleteStudentConfirmTitle')}
        body={t('deleteStudentConfirmBody', { name: studentToDelete ? `${studentToDelete.firstName} ${studentToDelete.lastName}` : '' })}
        confirmLabel={t('deleteStudent')}
        cancelLabel={t('cancel')}
        busy={deleteMutation.isPending}
        onConfirm={() => studentToDelete && deleteMutation.mutate(studentToDelete.id)}
        onCancel={() => setStudentToDelete(null)}
      />
    </>
  )
}

export default StudentsPage
