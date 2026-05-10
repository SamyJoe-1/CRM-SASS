import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Play, XCircle, Download, Edit, Trash2 } from 'lucide-react'
import { payrollApi } from '../../api/payroll.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { useExport } from '../../hooks/useUtils'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm, ExportMenu } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField } from '../../components/ui/input'
import { Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/index'
import { Tooltip } from '../../components/ui/controls'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate, formatCurrency } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { PayrollCycle, PayrollRecord } from '../../types'

const cycleSchema = z.object({ name: z.string().min(1), period_start: z.string().min(1), period_end: z.string().min(1), payment_date: z.string().min(1) })
type CycleFormData = z.infer<typeof cycleSchema>

export default function PayrollPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [selectedCycle, setSelectedCycle] = useState<PayrollCycle|null>(null)
  const { exportData, isExporting } = useExport()

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<PayrollCycle>({ queryKey: 'payroll', queryFn: payrollApi.list })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CycleFormData>({ resolver: zodResolver(cycleSchema) })
  const createMutation = useMutation({ mutationFn: payrollApi.create, onSuccess: () => { toast.success('Payroll cycle created'); qc.invalidateQueries({ queryKey: ['payroll'] }); setModalOpen(false); reset() }, onError: () => toast.error(t('common.errorOccurred')) })
  const deleteMutation = useMutation({ mutationFn: payrollApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['payroll'] }); setDeleteId(null) } })
  const generateMutation = useMutation({ mutationFn: payrollApi.generate, onSuccess: () => { toast.success('Records generated'); qc.invalidateQueries({ queryKey: ['payroll'] }) } })
  const processAllMutation = useMutation({ mutationFn: payrollApi.processAll, onSuccess: () => { toast.success('All processed'); qc.invalidateQueries({ queryKey: ['payroll'] }) } })
  const cancelAllMutation = useMutation({ mutationFn: payrollApi.cancelAll, onSuccess: () => { toast.success('All cancelled'); qc.invalidateQueries({ queryKey: ['payroll'] }) } })

  const columns: Column<PayrollCycle>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (c) => <button onClick={() => setSelectedCycle(c)} className="font-medium text-[var(--color-primary)] hover:underline">{c.name}</button> },
    { key: 'period_start', header: t('payroll.periodStart'), render: (c) => formatDate(c.period_start) },
    { key: 'period_end', header: t('payroll.periodEnd'), render: (c) => formatDate(c.period_end) },
    { key: 'payment_date', header: t('payroll.paymentDate'), render: (c) => formatDate(c.payment_date) },
    { key: 'total_employees', header: t('payroll.totalEmployees'), render: (c) => c.total_employees },
    { key: 'total_net', header: t('payroll.totalNet'), render: (c) => formatCurrency(c.total_net, c.currency) },
    { key: 'status', header: t('common.status'), render: (c) => <StatusBadge status={c.status} /> },
    { key: 'actions', header: t('common.actions'), width: '160px', render: (c) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Tooltip content={t('payroll.generate')}><Button variant="ghost" size="icon-sm" onClick={() => generateMutation.mutate(c.id)}><Play className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>
        <Tooltip content={t('payroll.processAll')}><Button variant="ghost" size="icon-sm" onClick={() => processAllMutation.mutate(c.id)}><Play className="h-4 w-4 text-[var(--color-primary)]" /></Button></Tooltip>
        <Tooltip content={t('payroll.cancelAll')}><Button variant="ghost" size="icon-sm" onClick={() => cancelAllMutation.mutate(c.id)}><XCircle className="h-4 w-4 text-[var(--color-warning)]" /></Button></Tooltip>
        <Tooltip content={t('common.export')}><Button variant="ghost" size="icon-sm" onClick={() => exportData(() => payrollApi.export(c.id), `payroll-${c.name}.csv`)}><Download className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(c.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
      </div>
    )},
  ]

  if (selectedCycle) return <PayrollCycleDetail cycle={selectedCycle} onBack={() => setSelectedCycle(null)} />

  return (
    <div className="space-y-6">
      <PageHeader title={t('payroll.title')} description={t('payroll.cycles')} actions={<Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{t('payroll.addCycle')}</Button>} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<PayrollCycle> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(c) => c.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); reset() }} title={t('payroll.addCycle')} size="md"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); reset() }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => createMutation.mutate(d as Partial<PayrollCycle>))} loading={createMutation.isPending}>{t('common.create')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('common.name')} required error={errors.name?.message}><Input {...register('name')} placeholder="January 2025 Payroll" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('payroll.periodStart')} required error={errors.period_start?.message}><Input type="date" {...register('period_start')} /></FormField>
            <FormField label={t('payroll.periodEnd')} required error={errors.period_end?.message}><Input type="date" {...register('period_end')} /></FormField>
          </div>
          <FormField label={t('payroll.paymentDate')} required error={errors.payment_date?.message}><Input type="date" {...register('payment_date')} /></FormField>
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} />
    </div>
  )
}

function PayrollCycleDetail({ cycle, onBack }: { cycle: PayrollCycle; onBack: () => void }) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [editRecord, setEditRecord] = useState<PayrollRecord|null>(null)
  const { data: records, isLoading } = useQuery({ queryKey: ['payroll-records', cycle.id], queryFn: () => payrollApi.getRecords(cycle.id) })
  const { data: summary } = useQuery({ queryKey: ['payroll-summary', cycle.id], queryFn: () => payrollApi.getSummary(cycle.id) })
  const processRecord = useMutation({ mutationFn: (rId: string) => payrollApi.processRecord(cycle.id, rId), onSuccess: () => { toast.success('Processed'); qc.invalidateQueries({ queryKey: ['payroll-records', cycle.id] }) } })
  const cancelRecord = useMutation({ mutationFn: (rId: string) => payrollApi.cancelRecord(cycle.id, rId), onSuccess: () => { toast.success('Cancelled'); qc.invalidateQueries({ queryKey: ['payroll-records', cycle.id] }) } })
  const { register, handleSubmit } = useForm<Partial<PayrollRecord>>()
  const updateRecord = useMutation({ mutationFn: (d: Partial<PayrollRecord>) => payrollApi.updateRecord(cycle.id, editRecord!.id, d), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['payroll-records', cycle.id] }); setEditRecord(null) } })
  const s = summary as Record<string, number> | undefined

  return (
    <div className="space-y-6">
      <PageHeader title={cycle.name} description={`${formatDate(cycle.period_start)} — ${formatDate(cycle.period_end)}`} actions={<Button variant="outline" onClick={onBack}>{t('common.back')}</Button>} />
      {s && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[['totalGross','total_gross'],['totalDeductions','total_deductions'],['totalNet','total_net'],['totalEmployees','total_employees']].map(([k,dk]) => (
            <Card key={k}><CardContent className="p-4"><p className="text-xs text-[var(--color-muted)] uppercase">{t(`payroll.${k}`)}</p><p className="text-xl font-bold text-gray-900 mt-1">{dk === 'total_employees' ? s[dk] : formatCurrency(s[dk] ?? 0, cycle.currency)}</p></CardContent></Card>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full data-table">
          <thead><tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
            {['Employee','Basic','Allowances','Bonuses','Gross','Deductions','Net','Status','Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-muted)] uppercase">{h}</th>)}
          </tr></thead>
          <tbody>
            {isLoading ? Array.from({length:5}).map((_,i) => <tr key={i} className="border-b border-[var(--color-border)]">{Array.from({length:9}).map((_,j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-20 rounded" /></td>)}</tr>) :
              records?.data?.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0 bg-white hover:bg-[var(--color-surface-2)]">
                  <td className="px-4 py-3 text-sm">{r.employee?.full_name ?? r.employee_id}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(r.basic_salary, r.currency)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(r.allowances, r.currency)}</td>
                  <td className="px-4 py-3 text-sm">{formatCurrency(r.bonuses, r.currency)}</td>
                  <td className="px-4 py-3 text-sm font-medium">{formatCurrency(r.gross_salary, r.currency)}</td>
                  <td className="px-4 py-3 text-sm text-[var(--color-danger)]">{formatCurrency(r.total_deductions, r.currency)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-[var(--color-success)]">{formatCurrency(r.net_salary, r.currency)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditRecord(r); }}><Edit className="h-4 w-4" /></Button></Tooltip>
                      {r.status === 'pending' && <Tooltip content="Process"><Button variant="ghost" size="icon-sm" onClick={() => processRecord.mutate(r.id)}><Play className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>}
                      {r.status !== 'cancelled' && <Tooltip content="Cancel"><Button variant="ghost" size="icon-sm" onClick={() => cancelRecord.mutate(r.id)}><XCircle className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>}
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {editRecord && (
        <CrudModal open={!!editRecord} onClose={() => setEditRecord(null)} title={t('common.edit')} size="md"
          footer={<><Button variant="outline" onClick={() => setEditRecord(null)}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => updateRecord.mutate(d))} loading={updateRecord.isPending}>{t('common.save')}</Button></>}>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('payroll.basicSalary')}><Input type="number" step="0.01" defaultValue={editRecord.basic_salary} {...register('basic_salary', { valueAsNumber: true })} /></FormField>
            <FormField label={t('payroll.allowances')}><Input type="number" step="0.01" defaultValue={editRecord.allowances} {...register('allowances', { valueAsNumber: true })} /></FormField>
            <FormField label={t('payroll.bonuses')}><Input type="number" step="0.01" defaultValue={editRecord.bonuses} {...register('bonuses', { valueAsNumber: true })} /></FormField>
            <FormField label={t('payroll.tax')}><Input type="number" step="0.01" defaultValue={editRecord.tax} {...register('tax', { valueAsNumber: true })} /></FormField>
            <FormField label={t('payroll.insurance')}><Input type="number" step="0.01" defaultValue={editRecord.insurance} {...register('insurance', { valueAsNumber: true })} /></FormField>
            <FormField label={t('payroll.otherDeductions')}><Input type="number" step="0.01" defaultValue={editRecord.other_deductions} {...register('other_deductions', { valueAsNumber: true })} /></FormField>
          </div>
        </CrudModal>
      )}
    </div>
  )
}
