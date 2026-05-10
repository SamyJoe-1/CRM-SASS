import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Send, Pin } from 'lucide-react'
import { announcementsApi } from '../../api/misc.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { usePermission } from '../../hooks/usePermission'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField, Textarea } from '../../components/ui/input'
import { Select, Tooltip } from '../../components/ui/controls'
import { Badge } from '../../components/ui/index'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Announcement } from '../../types'

const schema = z.object({ title: z.string().min(1), content: z.string().min(1), type: z.string().min(1), is_pinned: z.boolean().optional() })
type FormData = z.infer<typeof schema>

export default function AnnouncementsPage() {
  const { t } = useTranslation()
  const { isHR } = usePermission()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<Announcement|null>(null)

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<Announcement>({ queryKey: 'announcements', queryFn: announcementsApi.list })
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type: 'general', is_pinned: false } })

  const createM = useMutation({ mutationFn: announcementsApi.create, onSuccess: () => { toast.success('Announcement created'); qc.invalidateQueries({ queryKey: ['announcements'] }); setModalOpen(false); reset() } })
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Announcement> }) => announcementsApi.update(id, data), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['announcements'] }); setModalOpen(false) } })
  const deleteM = useMutation({ mutationFn: announcementsApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['announcements'] }); setDeleteId(null) } })
  const publishM = useMutation({ mutationFn: announcementsApi.publish, onSuccess: () => { toast.success('Published'); qc.invalidateQueries({ queryKey: ['announcements'] }) } })

  const typeOptions = [{ value:'general',label:t('announcements.general') },{ value:'urgent',label:t('announcements.urgent') },{ value:'policy',label:t('announcements.policy') },{ value:'event',label:t('announcements.event') }]
  const typeColors: Record<string, 'default'|'danger'|'warning'|'info'> = { general:'default',urgent:'danger',policy:'warning',event:'info' }

  const columns: Column<Announcement>[] = [
    { key: 'title', header: t('common.name'), sortable: true, render: (a) => <div className="flex items-center gap-2">{a.is_pinned && <Pin className="h-3 w-3 text-[var(--color-primary)]" />}<span className="font-medium text-gray-900">{a.title}</span></div> },
    { key: 'type', header: t('common.type'), render: (a) => <Badge variant={typeColors[a.type] ?? 'default'}>{t(`announcements.${a.type}`)}</Badge> },
    { key: 'author', header: 'Author', render: (a) => a.author?.name ?? '—' },
    { key: 'created_at', header: t('common.date'), sortable: true, render: (a) => formatDate(a.created_at) },
    { key: 'status', header: t('common.status'), render: (a) => <StatusBadge status={a.status} /> },
    { key: 'actions', header: t('common.actions'), width: '120px', render: (a) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isHR && a.status === 'draft' && <Tooltip content={t('announcements.publish')}><Button variant="ghost" size="icon-sm" onClick={() => publishM.mutate(a.id)}><Send className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>}
        {isHR && <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(a); reset({ title: a.title, content: a.content, type: a.type, is_pinned: a.is_pinned }); setModalOpen(true) }}><Edit className="h-4 w-4" /></Button></Tooltip>}
        {isHR && <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(a.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('announcements.title')} actions={isHR ? <Button onClick={() => { setEditing(null); reset({ type:'general', is_pinned:false }); setModalOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('announcements.addAnnouncement')}</Button> : undefined} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<Announcement> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(a) => a.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('common.edit') : t('announcements.addAnnouncement')} size="lg"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editing ? updateM.mutate({ id: editing.id, data: d as Partial<Announcement> }) : createM.mutate(d as Partial<Announcement>))} loading={createM.isPending || updateM.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('common.name')} required error={errors.title?.message}><Input {...register('title')} /></FormField>
          <FormField label={t('common.type')} required><Select value={watch('type')} onValueChange={(v) => setValue('type', v)} options={typeOptions} /></FormField>
          <FormField label="Content" required error={errors.content?.message}><Textarea {...register('content')} rows={5} /></FormField>
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteM.mutate(deleteId)} loading={deleteM.isPending} />
    </div>
  )
}
