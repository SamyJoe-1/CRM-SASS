import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Send, CheckSquare } from 'lucide-react'
import { performanceApi } from '../../api/performance.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { usePermission } from '../../hooks/usePermission'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField, Textarea } from '../../components/ui/input'
import { Progress } from '../../components/ui/index'
import { Tooltip } from '../../components/ui/controls'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { PerformanceReview } from '../../types'

const schema = z.object({
  employee_id: z.string().min(1), review_period: z.string().min(1),
  period_start: z.string().min(1), period_end: z.string().min(1),
  comments: z.string().optional(),
  criteria: z.array(z.object({ name: z.string().min(1), weight: z.coerce.number().min(1).max(100), score: z.coerce.number().min(0).max(10).optional() })),
})
type FormData = z.infer<typeof schema>

export default function PerformancePage() {
  const { t } = useTranslation()
  const { isHR } = usePermission()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<PerformanceReview|null>(null)

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<PerformanceReview>({ queryKey: 'performance', queryFn: performanceApi.list })

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { criteria: [{ name: '', weight: 20 }] } })
  const { fields, append, remove } = useFieldArray({ control, name: 'criteria' })

  const createMutation = useMutation({ mutationFn: performanceApi.create, onSuccess: () => { toast.success('Review created'); qc.invalidateQueries({ queryKey: ['performance'] }); setModalOpen(false); reset() }, onError: () => toast.error(t('common.errorOccurred')) })
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<PerformanceReview> }) => performanceApi.update(id, data), onSuccess: () => { toast.success('Review updated'); qc.invalidateQueries({ queryKey: ['performance'] }); setModalOpen(false); setEditing(null) } })
  const deleteMutation = useMutation({ mutationFn: performanceApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['performance'] }); setDeleteId(null) } })
  const submitMutation = useMutation({ mutationFn: performanceApi.submit, onSuccess: () => { toast.success('Submitted'); qc.invalidateQueries({ queryKey: ['performance'] }) } })
  const ackMutation = useMutation({ mutationFn: performanceApi.acknowledge, onSuccess: () => { toast.success('Acknowledged'); qc.invalidateQueries({ queryKey: ['performance'] }) } })

  const columns: Column<PerformanceReview>[] = [
    { key: 'employee', header: t('employees.fullName'), render: (r) => r.employee?.full_name ?? '—' },
    { key: 'reviewer', header: t('performance.reviewer'), render: (r) => r.reviewer?.full_name ?? '—' },
    { key: 'review_period', header: t('performance.reviewPeriod'), render: (r) => r.review_period },
    { key: 'overall_score', header: t('performance.overallScore'), render: (r) => r.overall_score != null ? (
      <div className="flex items-center gap-2"><Progress value={r.overall_score * 10} className="w-20 h-2" /><span className="text-xs font-medium">{r.overall_score}/10</span></div>
    ) : '—' },
    { key: 'status', header: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: t('common.actions'), width: '140px', render: (r) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isHR && r.status === 'draft' && <Tooltip content={t('performance.submit')}><Button variant="ghost" size="icon-sm" onClick={() => submitMutation.mutate(r.id)}><Send className="h-4 w-4 text-[var(--color-primary)]" /></Button></Tooltip>}
        {r.status === 'submitted' && <Tooltip content={t('performance.acknowledge')}><Button variant="ghost" size="icon-sm" onClick={() => ackMutation.mutate(r.id)}><CheckSquare className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>}
        {isHR && <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setModalOpen(true) }}><Edit className="h-4 w-4" /></Button></Tooltip>}
        {isHR && <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('performance.title')} actions={isHR ? <Button onClick={() => { setEditing(null); reset({ criteria: [{ name: '', weight: 20 }] }); setModalOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('performance.addReview')}</Button> : undefined} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<PerformanceReview> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(r) => r.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('common.edit') : t('performance.addReview')} size="xl"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editing ? updateMutation.mutate({ id: editing.id, data: d as Partial<PerformanceReview> }) : createMutation.mutate(d as Partial<PerformanceReview>))} loading={createMutation.isPending || updateMutation.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Employee ID" required error={errors.employee_id?.message}><Input {...register('employee_id')} /></FormField>
            <FormField label={t('performance.reviewPeriod')} required error={errors.review_period?.message}><Input {...register('review_period')} placeholder="Q1 2025" /></FormField>
            <FormField label="Period Start" required error={errors.period_start?.message}><Input type="date" {...register('period_start')} /></FormField>
            <FormField label="Period End" required error={errors.period_end?.message}><Input type="date" {...register('period_end')} /></FormField>
          </div>
          <FormField label={t('performance.comments')}><Textarea {...register('comments')} rows={2} /></FormField>
          <div>
            <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-gray-700">{t('performance.criteria')}</p><Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', weight: 20 })}>{t('performance.addCriteria')}</Button></div>
            {fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-3 gap-2 mb-2 items-end">
                <FormField label={i === 0 ? t('performance.criteriaName') : undefined} error={errors.criteria?.[i]?.name?.message}><Input {...register(`criteria.${i}.name`)} placeholder="Communication..." /></FormField>
                <FormField label={i === 0 ? t('performance.weight') : undefined} error={errors.criteria?.[i]?.weight?.message}><Input type="number" {...register(`criteria.${i}.weight`)} placeholder="20" /></FormField>
                <FormField label={i === 0 ? t('performance.score') : undefined}><Input type="number" step="0.1" min="0" max="10" {...register(`criteria.${i}.score`)} placeholder="0–10" /></FormField>
                {fields.length > 1 && <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)} className="text-[var(--color-danger)]">✕</Button>}
              </div>
            ))}
          </div>
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} />
    </div>
  )
}
