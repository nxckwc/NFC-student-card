"use client"

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Activity, Settings2, UserX } from 'lucide-react'
import { ErrorState, PageHeader } from '../components/AdminShell'
import { Dropdown, MultiDropdown } from '../components/Dropdown'
import { createReader, fetchAccounts, fetchReaders, getApiErrorMessage, updateReader } from '../lib/api'

const ReaderPage = () => {
  const queryClient = useQueryClient()
  const t = useTranslations('admin')
  const [name, setName] = useState('')
  const [type, setType] = useState<'GATE' | 'ROOM'>('GATE')
  const [error, setError] = useState<string | null>(null)

  const readersQuery = useQuery({ queryKey: ['admin', 'readers'], queryFn: fetchReaders })
  const accountsQuery = useQuery({ queryKey: ['admin', 'accounts', 'reader-assignment'], queryFn: () => fetchAccounts('') })

  const createMutation = useMutation({
    mutationFn: () => createReader(name.trim(), type),
    onSuccess: () => { setName(''); setError(null); void queryClient.invalidateQueries({ queryKey: ['admin', 'readers'] }) },
    onError: (value) => setError(getApiErrorMessage(value) ?? t('unableToCreateReader')),
  })
  const assignmentMutation = useMutation({
    mutationFn: ({ id, teacherIds }: { id: string; teacherIds: number[] }) => updateReader(id, { teacherIds }),
    onSuccess: () => { setError(null); void queryClient.invalidateQueries({ queryKey: ['admin', 'readers'] }) },
    onError: (value) => setError(getApiErrorMessage(value) ?? t('unableToUpdateReaderAssignment')),
  })

  return (
    <>
      <PageHeader eyebrow={t('readerManagement')} title={t('readers')} description={t('readerManagementDescription')} />
      {error && <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-sm font-semibold text-danger-foreground" role="alert"><UserX className="size-4" />{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-[0_14px_36px_rgba(52,76,61,0.06)] sm:p-7">
          <div className="mb-5 flex items-center gap-2 text-sm font-bold"><Activity className="size-5 text-accent" />{t('configuredReaders')}</div>
          {readersQuery.isLoading ? <p className="text-sm text-text-muted">{t('loadingReaders')}</p> : readersQuery.isError ? <ErrorState message="" onRetry={() => void readersQuery.refetch()} /> : readersQuery.data?.length === 0 ? <p className="rounded-lg border border-dashed border-border-dashed px-4 py-8 text-center text-sm text-text-muted">{t('noReaders')}</p> : <div className="space-y-3">{readersQuery.data?.map((reader) => <div key={reader.id} className="flex flex-col gap-3 rounded-lg border border-border-soft p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-bold">{reader.name} <span className="ml-2 rounded bg-surface-chip px-2 py-1 text-[10px] text-text-secondary">{reader.type}</span></p><p className="mt-1 font-mono text-xs text-text-muted">{reader.id}</p></div>{reader.type === 'ROOM' && <label className="text-[10px] font-bold uppercase text-text-muted">{t('assignedTeachers')}<MultiDropdown values={reader.teachers.map((teacher) => String(teacher.user.id))} options={accountsQuery.data?.map((account) => ({ value: String(account.id), label: account.username })) ?? []} onChange={(values) => assignmentMutation.mutate({ id: reader.id, teacherIds: values.map(Number) })} /></label>}<span className={`text-xs font-bold ${reader.active ? 'text-accent-foreground' : 'text-danger-foreground'}`}>{reader.active ? t('active') : t('inactive')}</span></div>)}</div>}
        </section>

        <aside>
          <section className="rounded-xl border border-border bg-surface p-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><Settings2 className="size-4 text-accent" />{t('createReader')}</h2><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t('readerName')} className="mb-3 w-full rounded-lg border border-border px-3 py-2.5 text-sm" /><Dropdown value={type} onChange={(value) => setType(value as 'GATE' | 'ROOM')} options={[{ value: 'GATE', label: t('gateReader') }, { value: 'ROOM', label: t('roomReader') }]} className="mb-3" /><button type="button" disabled={!name.trim() || createMutation.isPending} onClick={() => createMutation.mutate()} className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{t('createReader')}</button></section>
        </aside>
      </div>
    </>
  )
}

export default ReaderPage
