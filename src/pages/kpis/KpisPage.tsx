import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react'
import { kpisApi } from '../../api/kpis.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField, Textarea } from '../../components/ui/input'
import { Progress } from '../../components/ui/index'
import { Tooltip } from '../../components/ui/controls'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { KPI } from '../../types'

const schema = z.object({ title: z.string().min(1), target_value: z.coerce.number().min(0), unit: z.string().min(1), start_date: z.string().min(1), end_date: z.string().min(1), category: z.string().optional(), description: z.string().optional(), employee_id: z.string().min(1) })
type FormData = z.infer<typeof schema>

export default function KpisPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [progressModal, setProgressModal] = useState<KPI|null>(null)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<KPI|null>(null)
  const [progressValue, setProgressValue] = useState(0)
  const [progressNote, setProgressNote] = useState('')

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<KPI>({ queryKey: 'kpis', queryFn: kpisApi.list })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const createMutation = useMutation({ mutationFn: kpisApi.create, onSuccess: () => { toast.success('KPI created'); qc.invalidateQueries({ queryKey: ['kpis'] }); setModalOpen(false); reset() } })
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<KPI> }) => kpisApi.update(id, data), onSuccess: () => { toast.success('KPI updated'); qc.invalidateQueries({ queryKey: ['kpis'] }); setModalOpen(false) } })
  const deleteMutation = useMutation({ mutationFn: kpisApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['kpis'] }); setDeleteId(null) } })
  const progressMutation = useMutation({ mutationFn: ({ id, value, notes }: { id: string; value: number; notes: string }) => kpisApi.addProgress(id, { value, notes, recorded_at: new Date().toISOString() }), onSuccess: () => { toast.success('Progress updated'); qc.invalidateQueries({ queryKey: ['kpis'] }); setProgressModal(null) } })

  const columns: Column<KPI>[] = [
    { key: 'title', header: t('common.name'), sortable: true, render: (k) => <span className="font-medium text-gray-900">{k.title}</span> },
    { key: 'employee', header: t('employees.fullName'), render: (k) => k.employee?.full_name ?? k.employee_id },
    { key: 'progress', header: t('kpis.progress'), render: (k) => {
      const pct = Math.min(100, (k.current_value / k.target_value) * 100)
      return <div className="flex items-center gap-2"><Progress value={pct} className="w-20 h-2" /><span className="text-xs text-gray-500">{k.current_value}/{k.target_value} {k.unit}</span></div>
    }},
    { key: 'start_date', header: t('kpis.startDate'), render: (k) => formatDate(k.start_date) },
    { key: 'end_date', header: t('kpis.endDate'), render: (k) => formatDate(k.end_date) },
    { key: 'category', header: t('kpis.category'), render: (k) => k.category ?? '—' },
    { key: 'status', header: t('common.status'), render: (k) => <StatusBadge status={k.status} /> },
    { key: 'actions', header: t('common.actions'), width: '120px', render: (k) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Tooltip content={t('kpis.updateProgress')}><Button variant="ghost" size="icon-sm" onClick={() => { setProgressModal(k); setProgressValue(k.current_value); setProgressNote('') }}><TrendingUp className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>
        <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(k); reset({ title: k.title, target_value: k.target_value, unit: k.unit, start_date: k.start_date, end_date: k.end_date, category: k.category ?? '', description: k.description ?? '', employee_id: k.employee_id }); setModalOpen(true) }}><Edit className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(k.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('kpis.title')} actions={<Button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('kpis.addKPI')}</Button>} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<KPI> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(k) => k.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('common.edit') : t('kpis.addKPI')} size="lg"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editing ? updateMutation.mutate({ id: editing.id, data: d as Partial<KPI> }) : createMutation.mutate(d as Partial<KPI>))} loading={createMutation.isPending || updateMutation.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Title" required error={errors.title?.message} className="col-span-2"><Input {...register('title')} /></FormField>
          <FormField label="Employee ID" required error={errors.employee_id?.message}><Input {...register('employee_id')} /></FormField>
          <FormField label={t('kpis.category')}><Input {...register('category')} /></FormField>
          <FormField label={t('kpis.targetValue')} required error={errors.target_value?.message}><Input type="number" step="0.01" {...register('target_value')} /></FormField>
          <FormField label={t('kpis.unit')} required error={errors.unit?.message}><Input {...register('unit')} placeholder="%, units, $..." /></FormField>
          <FormField label={t('kpis.startDate')} required error={errors.start_date?.message}><Input type="date" {...register('start_date')} /></FormField>
          <FormField label={t('kpis.endDate')} required error={errors.end_date?.message}><Input type="date" {...register('end_date')} /></FormField>
          <FormField label={t('common.description')} className="col-span-2"><Textarea {...register('description')} rows={2} /></FormField>
        </div>
      </CrudModal>
      <CrudModal open={!!progressModal} onClose={() => setProgressModal(null)} title={t('kpis.updateProgress')} size="sm"
        footer={<><Button variant="outline" onClick={() => setProgressModal(null)}>{t('common.cancel')}</Button><Button onClick={() => progressModal && progressMutation.mutate({ id: progressModal.id, value: progressValue, notes: progressNote })} loading={progressMutation.isPending}>{t('common.save')}</Button></>}>
        <div className="space-y-4">
          <FormField label={`Current Value (target: ${progressModal?.target_value} ${progressModal?.unit})`} required><Input type="number" step="0.01" value={progressValue} onChange={(e) => setProgressValue(Number(e.target.value))} /></FormField>
          <FormField label={t('common.notes')}><Textarea value={progressNote} onChange={(e) => setProgressNote(e.target.value)} rows={2} /></FormField>
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} />
    </div>
  )
}
