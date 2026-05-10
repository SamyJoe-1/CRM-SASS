import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { positionsApi } from '../../api/misc.api'
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
import { formatCurrency } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Position } from '../../types'

const schema = z.object({ title: z.string().min(1), code: z.string().optional(), description: z.string().optional(), min_salary: z.coerce.number().optional(), max_salary: z.coerce.number().optional() })
type FormData = z.infer<typeof schema>

export default function PositionsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<Position|null>(null)

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<Position>({ queryKey: 'positions', queryFn: positionsApi.list })
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createM = useMutation({ mutationFn: positionsApi.create, onSuccess: () => { toast.success('Position created'); qc.invalidateQueries({ queryKey: ['positions'] }); setModalOpen(false); reset() } })
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Position> }) => positionsApi.update(id, data), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['positions'] }); setModalOpen(false) } })
  const deleteM = useMutation({ mutationFn: positionsApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['positions'] }); setDeleteId(null) } })

  const columns: Column<Position>[] = [
    { key: 'title', header: t('common.name'), sortable: true, render: (p) => <span className="font-medium text-gray-900">{p.title}</span> },
    { key: 'code', header: t('positions.code'), render: (p) => p.code ?? '—' },
    { key: 'department', header: t('employees.department'), render: (p) => p.department?.name ?? '—' },
    { key: 'salary_range', header: 'Salary Range', render: (p) => p.min_salary && p.max_salary ? `${formatCurrency(p.min_salary)} — ${formatCurrency(p.max_salary)}` : '—' },
    { key: 'is_active', header: t('common.status'), render: (p) => <StatusBadge status={p.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions', header: t('common.actions'), width: '80px', render: (p) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(p); reset({ title: p.title, code: p.code, description: p.description, min_salary: p.min_salary, max_salary: p.max_salary }); setModalOpen(true) }}><Edit className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(p.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('positions.title')} actions={<Button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('positions.addPosition')}</Button>} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<Position> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(p) => p.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('common.edit') : t('positions.addPosition')} size="md"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editing ? updateM.mutate({ id: editing.id, data: d as Partial<Position> }) : createM.mutate(d as Partial<Position>))} loading={createM.isPending || updateM.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('common.name')} required error={errors.title?.message}><Input {...register('title')} /></FormField>
          <FormField label={t('positions.code')}><Input {...register('code')} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('positions.minSalary')}><Input type="number" step="0.01" {...register('min_salary')} /></FormField>
            <FormField label={t('positions.maxSalary')}><Input type="number" step="0.01" {...register('max_salary')} /></FormField>
          </div>
          <FormField label={t('common.description')}><Textarea {...register('description')} rows={2} /></FormField>
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteM.mutate(deleteId)} loading={deleteM.isPending} />
    </div>
  )
}
