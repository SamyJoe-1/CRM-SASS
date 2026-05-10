import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { departmentsApi } from '../../api/misc.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField, Textarea } from '../../components/ui/input'
import { Tooltip } from '../../components/ui/controls'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Department } from '../../types'

const schema = z.object({ name: z.string().min(1), code: z.string().optional(), description: z.string().optional(), manager_id: z.string().optional() })
type FormData = z.infer<typeof schema>

export default function DepartmentsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<Department|null>(null)

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<Department>({ queryKey: 'departments', queryFn: departmentsApi.list })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createM = useMutation({ mutationFn: departmentsApi.create, onSuccess: () => { toast.success('Department created'); qc.invalidateQueries({ queryKey: ['departments'] }); setModalOpen(false); reset() } })
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Department> }) => departmentsApi.update(id, data), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['departments'] }); setModalOpen(false) } })
  const deleteM = useMutation({ mutationFn: departmentsApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['departments'] }); setDeleteId(null) } })

  const columns: Column<Department>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (d) => <span className="font-medium text-gray-900">{d.name}</span> },
    { key: 'code', header: t('departments.code'), render: (d) => d.code ?? '—' },
    { key: 'manager', header: t('departments.manager'), render: (d) => d.manager?.full_name ?? '—' },
    { key: 'employee_count', header: t('departments.employeeCount'), render: (d) => d.employee_count ?? 0 },
    { key: 'is_active', header: t('common.status'), render: (d) => <StatusBadge status={d.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions', header: t('common.actions'), width: '80px', render: (d) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(d); reset({ name: d.name, code: d.code, description: d.description, manager_id: d.manager_id }); setModalOpen(true) }}><Edit className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(d.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('departments.title')} actions={<Button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('departments.addDepartment')}</Button>} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<Department> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(d) => d.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('common.edit') : t('departments.addDepartment')} size="md"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editing ? updateM.mutate({ id: editing.id, data: d as Partial<Department> }) : createM.mutate(d as Partial<Department>))} loading={createM.isPending || updateM.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('common.name')} required error={errors.name?.message}><Input {...register('name')} /></FormField>
          <FormField label={t('departments.code')}><Input {...register('code')} /></FormField>
          <FormField label={t('common.description')}><Textarea {...register('description')} rows={2} /></FormField>
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteM.mutate(deleteId)} loading={deleteM.isPending} />
    </div>
  )
}
