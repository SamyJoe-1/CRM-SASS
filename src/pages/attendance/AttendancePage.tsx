import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Edit } from 'lucide-react'
import { attendanceApi } from '../../api/attendance.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { useExport } from '../../hooks/useUtils'
import { usePermission } from '../../hooks/usePermission'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, ExportMenu } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/index'
import { Input, FormField } from '../../components/ui/input'
import { useForm } from 'react-hook-form'
import { formatDate, formatDateTime } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { AttendanceRecord, AttendancePolicy } from '../../types'

export default function AttendancePage() {
  const { t } = useTranslation()
  const { isHR } = usePermission()
  const qc = useQueryClient()
  const [now, setNow] = useState(new Date())
  const [editRecord, setEditRecord] = useState<AttendanceRecord|null>(null)
  const { exportData, isExporting } = useExport()
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i) }, [])

  const clockInMutation = useMutation({ mutationFn: () => attendanceApi.clockIn(), onSuccess: () => { toast.success(t('attendance.clockedIn')); qc.invalidateQueries({ queryKey: ['attendance-records'] }) }, onError: (e: unknown) => { const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message; toast.error(msg ?? t('common.errorOccurred')) } })
  const clockOutMutation = useMutation({ mutationFn: () => attendanceApi.clockOut(), onSuccess: () => { toast.success(t('attendance.clockedOut')); qc.invalidateQueries({ queryKey: ['attendance-records'] }) }, onError: (e: unknown) => { const msg = (e as {response?:{data?:{message?:string}}})?.response?.data?.message; toast.error(msg ?? t('common.errorOccurred')) } })

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<AttendanceRecord>({ queryKey: 'attendance-records', queryFn: attendanceApi.listRecords })
  const { data: policy } = useQuery({ queryKey: ['attendance-policy'], queryFn: attendanceApi.getPolicy })
  const { register, handleSubmit, reset } = useForm<{ clock_in: string; clock_out: string; notes: string }>()
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceRecord> }) => attendanceApi.updateRecord(id, data), onSuccess: () => { toast.success('Record updated'); qc.invalidateQueries({ queryKey: ['attendance-records'] }); setEditRecord(null) }, onError: () => toast.error(t('common.errorOccurred')) })

  const [policyForm, setPolicyForm] = useState<AttendancePolicy|null>(null)
  useEffect(() => { if (policy) setPolicyForm(policy) }, [policy])
  const policyMutation = useMutation({ mutationFn: (d: AttendancePolicy) => attendanceApi.updatePolicy(d), onSuccess: () => toast.success('Policy saved') })

  const columns: Column<AttendanceRecord>[] = [
    { key: 'employee', header: t('employees.fullName'), render: (r) => r.employee?.full_name ?? r.employee_id },
    { key: 'date', header: t('common.date'), sortable: true, render: (r) => formatDate(r.date) },
    { key: 'clock_in', header: t('attendance.clockInTime'), render: (r) => r.clock_in ? formatDateTime(r.clock_in) : '—' },
    { key: 'clock_out', header: t('attendance.clockOutTime'), render: (r) => r.clock_out ? formatDateTime(r.clock_out) : '—' },
    { key: 'total_hours', header: t('attendance.totalHours'), render: (r) => r.total_hours != null ? `${r.total_hours.toFixed(1)}h` : '—' },
    { key: 'overtime_hours', header: t('attendance.overtimeHours'), render: (r) => r.overtime_hours != null ? `${r.overtime_hours.toFixed(1)}h` : '—' },
    { key: 'status', header: t('common.status'), render: (r) => <StatusBadge status={r.status} /> },
    ...(isHR ? [{ key: 'actions', header: t('common.actions'), width: '80px', render: (r: AttendanceRecord) => <Button variant="ghost" size="icon-sm" onClick={() => { setEditRecord(r); reset({ clock_in: r.clock_in?.slice(0,16) ?? '', clock_out: r.clock_out?.slice(0,16) ?? '', notes: r.notes ?? '' }) }}><Edit className="h-4 w-4" /></Button> }] as Column<AttendanceRecord>[] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('attendance.title')} actions={isHR ? <ExportMenu onExport={() => exportData(() => attendanceApi.export(), 'attendance.csv')} loading={isExporting} /> : undefined} />
      <Tabs defaultValue="clock">
        <TabsList>
          <TabsTrigger value="clock">{t('attendance.clockIn')}</TabsTrigger>
          {isHR && <TabsTrigger value="records">{t('attendance.records')}</TabsTrigger>}
          {isHR && <TabsTrigger value="policy">{t('attendance.policy')}</TabsTrigger>}
        </TabsList>
        <TabsContent value="clock">
          <Card><CardContent className="py-10">
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <p className="text-5xl font-mono font-bold text-gray-900">{now.toLocaleTimeString()}</p>
                <p className="text-sm text-gray-500 mt-1">{now.toLocaleDateString(undefined, { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => clockInMutation.mutate()} loading={clockInMutation.isPending} className="gap-2 min-w-[140px]"><CheckCircle className="h-4 w-4" />{t('attendance.clockIn')}</Button>
                <Button variant="outline" onClick={() => clockOutMutation.mutate()} loading={clockOutMutation.isPending} className="gap-2 min-w-[140px]"><XCircle className="h-4 w-4" />{t('attendance.clockOut')}</Button>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="records">
          <div className="space-y-4">
            <FilterBar search={search} onSearch={handleSearch} />
            <DataTable<AttendanceRecord> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(r) => r.id} />
          </div>
        </TabsContent>
        <TabsContent value="policy">
          {policyForm && (
            <Card><CardContent className="py-6">
              <div className="grid grid-cols-2 gap-4 max-w-lg">
                <FormField label={t('attendance.workStart')}><Input type="time" value={policyForm.work_start_time} onChange={(e) => setPolicyForm(f => f ? {...f, work_start_time: e.target.value} : f)} /></FormField>
                <FormField label={t('attendance.workEnd')}><Input type="time" value={policyForm.work_end_time} onChange={(e) => setPolicyForm(f => f ? {...f, work_end_time: e.target.value} : f)} /></FormField>
                <FormField label={t('attendance.lateThreshold')}><Input type="number" value={policyForm.late_threshold_minutes} onChange={(e) => setPolicyForm(f => f ? {...f, late_threshold_minutes: Number(e.target.value)} : f)} /></FormField>
                <FormField label={t('attendance.overtimeThreshold')}><Input type="number" step="0.5" value={policyForm.overtime_threshold_hours} onChange={(e) => setPolicyForm(f => f ? {...f, overtime_threshold_hours: Number(e.target.value)} : f)} /></FormField>
              </div>
              <Button onClick={() => policyForm && policyMutation.mutate(policyForm)} loading={policyMutation.isPending} className="mt-4">{t('common.save')}</Button>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
      <CrudModal open={!!editRecord} onClose={() => setEditRecord(null)} title={t('attendance.editRecord')} size="sm"
        footer={<><Button variant="outline" onClick={() => setEditRecord(null)}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editRecord && updateMutation.mutate({ id: editRecord.id, data: { clock_in: d.clock_in, clock_out: d.clock_out, notes: d.notes } as Partial<AttendanceRecord> }))} loading={updateMutation.isPending}>{t('common.save')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('attendance.clockInTime')}><Input type="datetime-local" {...register('clock_in')} /></FormField>
          <FormField label={t('attendance.clockOutTime')}><Input type="datetime-local" {...register('clock_out')} /></FormField>
          <FormField label={t('common.notes')}><Input {...register('notes')} /></FormField>
        </div>
      </CrudModal>
    </div>
  )
}
