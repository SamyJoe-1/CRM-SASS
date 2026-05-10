import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, X } from 'lucide-react'
import { leaveApi } from '../../api/leave.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { usePermission } from '../../hooks/usePermission'
import { useAuthStore } from '../../stores/authStore'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField, Textarea } from '../../components/ui/input'
import { Select, Tooltip } from '../../components/ui/controls'
import { Tabs, TabsList, TabsTrigger, TabsContent, Progress, Card, CardContent } from '../../components/ui/index'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { LeaveRequest, LeaveBalance } from '../../types'

const schema = z.object({ leave_type_id: z.string().min(1), start_date: z.string().min(1), end_date: z.string().min(1), reason: z.string().min(1) })
type FormData = z.infer<typeof schema>

export default function LeavePage() {
  const { t } = useTranslation()
  const { isHR } = usePermission()
  const authUser = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [rejectModal, setRejectModal] = useState<string|null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<LeaveRequest>({ queryKey: 'leave-requests', queryFn: leaveApi.listRequests })
  const { data: types } = useQuery({ queryKey: ['leave-types'], queryFn: leaveApi.getTypes })
  const { data: balances } = useQuery({ queryKey: ['leave-balances', authUser?.employee_id], queryFn: () => leaveApi.getBalances(authUser?.employee_id ?? ''), enabled: !!authUser?.employee_id })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const createMutation = useMutation({ mutationFn: leaveApi.createRequest, onSuccess: () => { toast.success('Leave request submitted'); qc.invalidateQueries({ queryKey: ['leave-requests'] }); setModalOpen(false); reset() }, onError: () => toast.error(t('common.errorOccurred')) })
  const approveMutation = useMutation({ mutationFn: (id: string) => leaveApi.approveRequest(id), onSuccess: () => { toast.success('Leave approved'); qc.invalidateQueries({ queryKey: ['leave-requests'] }) } })
  const rejectMutation = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => leaveApi.rejectRequest(id, { reason }), onSuccess: () => { toast.success('Leave rejected'); qc.invalidateQueries({ queryKey: ['leave-requests'] }); setRejectModal(null) } })
  const cancelMutation = useMutation({ mutationFn: leaveApi.cancelRequest, onSuccess: () => { toast.success('Leave cancelled'); qc.invalidateQueries({ queryKey: ['leave-requests'] }) } })

  const typeOptions = types?.map((lt) => ({ value: lt.id, label: lt.name })) ?? []

  const columns: Column<LeaveRequest>[] = [
    { key: 'employee', header: t('employees.fullName'), render: (r) => r.employee?.full_name ?? '—' },
    { key: 'leave_type', header: t('leave.leaveType'), render: (r) => r.leave_type?.name ?? '—' },
    { key: 'start_date', header: t('leave.startDate'), sortable: true, render: (r) => formatDate(r.start_date) },
    { key: 'end_date', header: t('leave.endDate'), render: (r) => formatDate(r.end_date) },
    { key: 'days', header: t('leave.days'), render: (r) => `${r.days}d` },
    { key: 'status', header: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    { key: 'actions', header: t('common.actions'), width: '120px', render: (r) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {isHR && r.status === 'pending' && <>
          <Tooltip content={t('common.approve')}><Button variant="ghost" size="icon-sm" onClick={() => approveMutation.mutate(r.id)}><Check className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>
          <Tooltip content={t('common.reject')}><Button variant="ghost" size="icon-sm" onClick={() => setRejectModal(r.id)}><X className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
        </>}
        {r.status === 'pending' && <Tooltip content={t('leave.cancelLeave')}><Button variant="ghost" size="icon-sm" onClick={() => cancelMutation.mutate(r.id)}><X className="h-4 w-4 text-[var(--color-warning)]" /></Button></Tooltip>}
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('leave.title')} actions={<Button onClick={() => setModalOpen(true)} className="gap-2"><Plus className="h-4 w-4" />{t('leave.applyLeave')}</Button>} />
      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">{t('leave.requests')}</TabsTrigger>
          <TabsTrigger value="balance">{t('leave.myBalance')}</TabsTrigger>
          {isHR && <TabsTrigger value="types">{t('leave.leaveTypes')}</TabsTrigger>}
        </TabsList>
        <TabsContent value="requests">
          <div className="space-y-4">
            <FilterBar search={search} onSearch={handleSearch} />
            <DataTable<LeaveRequest> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(r) => r.id} />
          </div>
        </TabsContent>
        <TabsContent value="balance">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(balances as LeaveBalance[] | undefined)?.map((b) => (
              <Card key={b.leave_type_id}>
                <CardContent className="p-6">
                  <p className="text-sm font-semibold text-gray-900 mb-3">{b.leave_type?.name ?? 'Leave Type'}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500"><span>{t('leave.remainingDays')}</span><span className="font-semibold text-gray-900">{b.remaining_days} / {b.total_days}</span></div>
                    <Progress value={(b.remaining_days / b.total_days) * 100} />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{t('leave.usedDays')}: {b.used_days}</span>
                      <span>{t('leave.pendingDays')}: {b.pending_days}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {!balances?.length && <p className="text-sm text-gray-500 col-span-3 text-center py-8">{t('common.noData')}</p>}
          </div>
        </TabsContent>
        <TabsContent value="types">
          <LeaveTypesPanel />
        </TabsContent>
      </Tabs>
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); reset() }} title={t('leave.applyLeave')} size="md"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); reset() }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => createMutation.mutate(d as Partial<LeaveRequest>))} loading={createMutation.isPending}>{t('common.submit')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('leave.leaveType')} required error={errors.leave_type_id?.message}><Select value={watch('leave_type_id') ?? ''} onValueChange={(v) => setValue('leave_type_id', v)} options={typeOptions} placeholder="Select type" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('leave.startDate')} required error={errors.start_date?.message}><Input type="date" {...register('start_date')} /></FormField>
            <FormField label={t('leave.endDate')} required error={errors.end_date?.message}><Input type="date" {...register('end_date')} /></FormField>
          </div>
          <FormField label={t('leave.reason')} required error={errors.reason?.message}><Textarea {...register('reason')} rows={3} /></FormField>
        </div>
      </CrudModal>
      <CrudModal open={!!rejectModal} onClose={() => setRejectModal(null)} title={t('leave.rejectLeave')} size="sm"
        footer={<><Button variant="outline" onClick={() => setRejectModal(null)}>{t('common.cancel')}</Button><Button variant="destructive" onClick={() => rejectModal && rejectMutation.mutate({ id: rejectModal, reason: rejectReason })} loading={rejectMutation.isPending}>{t('common.reject')}</Button></>}>
        <FormField label={t('leave.rejectionReason')} required><Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} /></FormField>
      </CrudModal>
    </div>
  )
}

function LeaveTypesPanel() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<{id:string;name:string;code:string;days_per_year:number}|null>(null)
  const { data: types } = useQuery({ queryKey: ['leave-types'], queryFn: leaveApi.getTypes })
  const createMutation = useMutation({ mutationFn: leaveApi.createType, onSuccess: () => { qc.invalidateQueries({ queryKey: ['leave-types'] }); setModal(false) } })
  const deleteMutation = useMutation({ mutationFn: leaveApi.deleteType, onSuccess: () => qc.invalidateQueries({ queryKey: ['leave-types'] }) })
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><Button onClick={() => { setEditing(null); setModal(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('leave.addLeaveType')}</Button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {types?.map((lt) => (
          <Card key={lt.id}><CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div><p className="font-semibold text-gray-900">{lt.name}</p><p className="text-xs text-gray-500">{lt.code} · {lt.days_per_year} days/year</p></div>
              <Button variant="ghost" size="icon-sm" onClick={() => deleteMutation.mutate(lt.id)}><X className="h-4 w-4 text-[var(--color-danger)]" /></Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <CrudModal open={modal} onClose={() => setModal(false)} title={t('leave.addLeaveType')} size="sm"
        footer={<><Button variant="outline" onClick={() => setModal(false)}>{t('common.cancel')}</Button><Button onClick={() => { if (editing) createMutation.mutate(editing as Parameters<typeof leaveApi.createType>[0]); }} loading={createMutation.isPending}>{t('common.create')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('common.name')} required><Input value={editing?.name ?? ''} onChange={(e) => setEditing(prev => ({ ...(prev ?? { id:'',code:'',days_per_year:10 }), name: e.target.value }))} /></FormField>
          <FormField label="Code" required><Input value={editing?.code ?? ''} onChange={(e) => setEditing(prev => ({ ...(prev ?? { id:'',name:'',days_per_year:10 }), code: e.target.value }))} /></FormField>
          <FormField label={t('leave.daysPerYear')} required><Input type="number" value={editing?.days_per_year ?? 10} onChange={(e) => setEditing(prev => ({ ...(prev ?? { id:'',name:'',code:'' }), days_per_year: Number(e.target.value) }))} /></FormField>
        </div>
      </CrudModal>
    </div>
  )
}
