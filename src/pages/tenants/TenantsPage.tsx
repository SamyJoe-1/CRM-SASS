import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, PauseCircle, PlayCircle } from 'lucide-react'
import { tenantsApi } from '../../api/misc.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField } from '../../components/ui/input'
import { Tooltip } from '../../components/ui/controls'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Tenant } from '../../types'

const schema = z.object({ name: z.string().min(1), slug: z.string().min(1), domain: z.string().optional(), plan: z.string().optional(), admin_email: z.string().email().optional() })
type FormData = z.infer<typeof schema>

export default function TenantsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<Tenant|null>(null)

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<Tenant>({ queryKey: 'tenants', queryFn: tenantsApi.list })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createM = useMutation({ mutationFn: tenantsApi.create, onSuccess: () => { toast.success('Tenant created'); qc.invalidateQueries({ queryKey: ['tenants'] }); setModalOpen(false); reset() } })
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Tenant> }) => tenantsApi.update(id, data), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['tenants'] }); setModalOpen(false) } })
  const deleteM = useMutation({ mutationFn: tenantsApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['tenants'] }); setDeleteId(null) } })
  const suspendM = useMutation({ mutationFn: tenantsApi.suspend, onSuccess: () => { toast.success('Suspended'); qc.invalidateQueries({ queryKey: ['tenants'] }) } })
  const restoreM = useMutation({ mutationFn: tenantsApi.restore, onSuccess: () => { toast.success('Restored'); qc.invalidateQueries({ queryKey: ['tenants'] }) } })

  const columns: Column<Tenant>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (t_) => <span className="font-medium text-gray-900">{t_.name}</span> },
    { key: 'slug', header: t('tenants.slug'), render: (t_) => <span className="font-mono text-xs text-gray-500">{t_.slug}</span> },
    { key: 'domain', header: t('tenants.domain'), render: (t_) => t_.domain ?? '—' },
    { key: 'plan', header: t('tenants.plan'), render: (t_) => t_.plan ?? '—' },
    { key: 'employee_count', header: t('departments.employeeCount'), render: (t_) => t_.employee_count ?? 0 },
    { key: 'created_at', header: t('common.date'), sortable: true, render: (t_) => formatDate(t_.created_at) },
    { key: 'status', header: t('common.status'), render: (t_) => <StatusBadge status={t_.status} /> },
    { key: 'actions', header: t('common.actions'), width: '120px', render: (t_) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {t_.status === 'active'
          ? <Tooltip content={t('tenants.suspend')}><Button variant="ghost" size="icon-sm" onClick={() => suspendM.mutate(t_.id)}><PauseCircle className="h-4 w-4 text-[var(--color-warning)]" /></Button></Tooltip>
          : <Tooltip content={t('tenants.restore')}><Button variant="ghost" size="icon-sm" onClick={() => restoreM.mutate(t_.id)}><PlayCircle className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>}
        <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(t_); reset({ name: t_.name, slug: t_.slug, domain: t_.domain, plan: t_.plan, admin_email: t_.admin_email }); setModalOpen(true) }}><Edit className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(t_.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('tenants.title')} actions={<Button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('tenants.addTenant')}</Button>} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<Tenant> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(t_) => t_.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('common.edit') : t('tenants.addTenant')} size="md"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editing ? updateM.mutate({ id: editing.id, data: d as Partial<Tenant> }) : createM.mutate(d as Partial<Tenant>))} loading={createM.isPending || updateM.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('common.name')} required error={errors.name?.message}><Input {...register('name')} /></FormField>
          <FormField label={t('tenants.slug')} required error={errors.slug?.message}><Input {...register('slug')} placeholder="my-company" /></FormField>
          <FormField label={t('tenants.domain')}><Input {...register('domain')} placeholder="mycompany.com" /></FormField>
          <FormField label={t('tenants.plan')}><Input {...register('plan')} placeholder="starter, pro, enterprise" /></FormField>
          <FormField label="Admin Email" error={errors.admin_email?.message}><Input type="email" {...register('admin_email')} /></FormField>
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteM.mutate(deleteId)} loading={deleteM.isPending} />
    </div>
  )
}
