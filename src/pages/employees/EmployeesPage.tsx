import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Eye, UserX } from 'lucide-react'
import { employeesApi } from '../../api/employees.api'
import { departmentsApi, positionsApi } from '../../api/misc.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { useExport } from '../../hooks/useUtils'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm, ExportMenu } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Tooltip, Avatar, Select } from '../../components/ui/controls'
import { Input, FormField, Textarea } from '../../components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/index'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDate, getInitials, formatCurrency } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Employee } from '../../types'

const schema = z.object({
  first_name: z.string().min(1), last_name: z.string().min(1), email: z.string().email(),
  phone: z.string().optional(), department_id: z.string().optional(), position_id: z.string().optional(),
  employment_type: z.string().min(1), hire_date: z.string().min(1),
  salary: z.coerce.number().optional(), currency: z.string().optional(),
  gender: z.string().optional(), nationality: z.string().optional(), national_id: z.string().optional(), date_of_birth: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export default function EmployeesPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<Employee|null>(null)
  const [terminateId, setTerminateId] = useState<string|null>(null)
  const { exportData, isExporting } = useExport()

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<Employee>({ queryKey: 'employees', queryFn: employeesApi.list })
  const { data: deptData } = useQuery({ queryKey: ['departments-all'], queryFn: () => departmentsApi.list({ per_page: 100 }) })
  const { data: posData } = useQuery({ queryKey: ['positions-all'], queryFn: () => positionsApi.list({ per_page: 100 }) })

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({ mutationFn: employeesApi.create, onSuccess: () => { toast.success('Employee created'); qc.invalidateQueries({ queryKey: ['employees'] }); setModalOpen(false); reset() }, onError: () => toast.error(t('common.errorOccurred')) })
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) => employeesApi.update(id, data), onSuccess: () => { toast.success('Employee updated'); qc.invalidateQueries({ queryKey: ['employees'] }); setModalOpen(false); setEditing(null) }, onError: () => toast.error(t('common.errorOccurred')) })
  const deleteMutation = useMutation({ mutationFn: employeesApi.delete, onSuccess: () => { toast.success('Employee deleted'); qc.invalidateQueries({ queryKey: ['employees'] }); setDeleteId(null) }, onError: () => toast.error(t('common.errorOccurred')) })

  function openCreate() { setEditing(null); reset({ employment_type: 'full_time', currency: 'USD', hire_date: new Date().toISOString().split('T')[0] }); setModalOpen(true) }
  function openEdit(emp: Employee) { setEditing(emp); reset({ first_name: emp.first_name, last_name: emp.last_name, email: emp.email, phone: emp.phone, department_id: emp.department_id, position_id: emp.position_id, employment_type: emp.employment_type, hire_date: emp.hire_date, salary: emp.salary, currency: emp.currency, gender: emp.gender, nationality: emp.nationality, national_id: emp.national_id, date_of_birth: emp.date_of_birth }); setModalOpen(true) }
  function onSubmit(d: FormData) { if (editing) updateMutation.mutate({ id: editing.id, data: d as Partial<Employee> }); else createMutation.mutate(d as unknown as Partial<Employee>) }

  const deptOptions = [{ value: '', label: '— None —' }, ...(deptData?.data?.map((d) => ({ value: d.id, label: d.name })) ?? [])]
  const posOptions = [{ value: '', label: '— None —' }, ...(posData?.data?.map((p) => ({ value: p.id, label: p.title })) ?? [])]
  const empTypeOptions = [{ value:'full_time',label:t('employees.full_time') },{ value:'part_time',label:t('employees.part_time') },{ value:'contract',label:t('employees.contract') },{ value:'intern',label:t('employees.intern') }]
  const genderOptions = [{ value:'',label:'— None —' },{ value:'male',label:t('employees.male') },{ value:'female',label:t('employees.female') },{ value:'other',label:t('employees.other') }]

  const columns: Column<Employee>[] = [
    { key: 'full_name', header: t('employees.fullName'), sortable: true, render: (e) => <div className="flex items-center gap-3"><Avatar src={e.avatar} fallback={getInitials(e.full_name)} size="sm" /><div><p className="font-medium text-gray-900">{e.full_name}</p><p className="text-xs text-gray-500">{e.employee_number}</p></div></div> },
    { key: 'email', header: t('common.email'), sortable: true, render: (e) => <span className="text-gray-600 text-xs">{e.email}</span> },
    { key: 'department', header: t('employees.department'), render: (e) => e.department?.name ?? '—' },
    { key: 'position', header: t('employees.position'), render: (e) => e.position?.title ?? '—' },
    { key: 'employment_type', header: t('employees.employmentType'), render: (e) => t(`employees.${e.employment_type}`) },
    { key: 'hire_date', header: t('employees.hireDate'), sortable: true, render: (e) => formatDate(e.hire_date) },
    { key: 'salary', header: t('employees.salary'), render: (e) => e.salary ? formatCurrency(e.salary, e.currency) : '—' },
    { key: 'status', header: t('common.status'), render: (e) => <StatusBadge status={e.status} /> },
    { key: 'actions', header: t('common.actions'), width: '120px', render: (e) => (
      <div className="flex items-center gap-1" onClick={(ev) => ev.stopPropagation()}>
        <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)}><Edit className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('employees.terminateEmployee')}><Button variant="ghost" size="icon-sm" onClick={() => setTerminateId(e.id)}><UserX className="h-4 w-4 text-[var(--color-warning)]" /></Button></Tooltip>
        <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(e.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('employees.title')} description={`${total} total`} actions={
        <div className="flex gap-2">
          <ExportMenu onExport={() => exportData(() => employeesApi.export(), 'employees.csv')} loading={isExporting} />
          <Button onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" />{t('employees.addEmployee')}</Button>
        </div>
      } />
      <FilterBar search={search} onSearch={handleSearch} placeholder={`${t('employees.fullName')}...`} />
      <DataTable<Employee> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(e) => e.id} emptyTitle={t('common.noData')} emptyAction={{ label: t('employees.addEmployee'), onClick: openCreate }} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('employees.editEmployee') : t('employees.addEmployee')} size="2xl"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending || updateMutation.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <Tabs defaultValue="personal">
          <TabsList className="mb-4 flex-wrap h-auto">
            <TabsTrigger value="personal">{t('employees.personalInfo')}</TabsTrigger>
            <TabsTrigger value="employment">{t('employees.employmentInfo')}</TabsTrigger>
            <TabsTrigger value="bank">{t('employees.bankDetails')}</TabsTrigger>
            <TabsTrigger value="emergency">{t('employees.emergencyContact')}</TabsTrigger>
          </TabsList>
          <TabsContent value="personal">
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('employees.firstName')} error={errors.first_name?.message} required><Input {...register('first_name')} error={!!errors.first_name} /></FormField>
              <FormField label={t('employees.lastName')} error={errors.last_name?.message} required><Input {...register('last_name')} error={!!errors.last_name} /></FormField>
              <FormField label={t('common.email')} error={errors.email?.message} required><Input type="email" {...register('email')} error={!!errors.email} /></FormField>
              <FormField label={t('common.phone')}><Input {...register('phone')} /></FormField>
              <FormField label={t('employees.dateOfBirth')}><Input type="date" {...register('date_of_birth')} /></FormField>
              <FormField label={t('employees.gender')}><Select value={watch('gender') ?? ''} onValueChange={(v) => setValue('gender', v)} options={genderOptions} /></FormField>
              <FormField label={t('employees.nationality')}><Input {...register('nationality')} /></FormField>
              <FormField label={t('employees.nationalId')}><Input {...register('national_id')} /></FormField>
            </div>
          </TabsContent>
          <TabsContent value="employment">
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('employees.department')}><Select value={watch('department_id') ?? ''} onValueChange={(v) => setValue('department_id', v)} options={deptOptions} /></FormField>
              <FormField label={t('employees.position')}><Select value={watch('position_id') ?? ''} onValueChange={(v) => setValue('position_id', v)} options={posOptions} /></FormField>
              <FormField label={t('employees.employmentType')} required error={errors.employment_type?.message}><Select value={watch('employment_type') ?? 'full_time'} onValueChange={(v) => setValue('employment_type', v)} options={empTypeOptions} /></FormField>
              <FormField label={t('employees.hireDate')} required error={errors.hire_date?.message}><Input type="date" {...register('hire_date')} error={!!errors.hire_date} /></FormField>
              <FormField label={t('employees.salary')}><Input type="number" step="0.01" {...register('salary')} /></FormField>
              <FormField label={t('employees.currency')}><Input {...register('currency')} placeholder="USD" /></FormField>
            </div>
          </TabsContent>
          <TabsContent value="bank">
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('employees.bankName')} className="col-span-2"><Input placeholder="Bank of America" /></FormField>
              <FormField label={t('employees.accountNumber')}><Input /></FormField>
              <FormField label="IBAN"><Input /></FormField>
            </div>
          </TabsContent>
          <TabsContent value="emergency">
            <div className="grid grid-cols-2 gap-4">
              <FormField label={t('common.name')}><Input /></FormField>
              <FormField label={t('employees.relationship')}><Input placeholder="Spouse, Parent..." /></FormField>
              <FormField label={t('common.phone')}><Input /></FormField>
            </div>
          </TabsContent>
        </Tabs>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteMutation.mutate(deleteId)} loading={deleteMutation.isPending} />
      <TerminateModal open={!!terminateId} onClose={() => setTerminateId(null)} employeeId={terminateId ?? ''} onSuccess={() => { setTerminateId(null); qc.invalidateQueries({ queryKey: ['employees'] }) }} />
    </div>
  )
}

function TerminateModal({ open, onClose, employeeId, onSuccess }: { open: boolean; onClose: () => void; employeeId: string; onSuccess: () => void }) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const mutation = useMutation({ mutationFn: () => employeesApi.terminate(employeeId, { termination_date: date, reason }), onSuccess: () => { toast.success(t('employees.terminateSuccess')); onSuccess() }, onError: () => toast.error(t('common.errorOccurred')) })
  return (
    <CrudModal open={open} onClose={onClose} title={t('employees.terminateEmployee')} size="sm"
      footer={<><Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button><Button variant="destructive" onClick={() => mutation.mutate()} loading={mutation.isPending}>{t('employees.terminateEmployee')}</Button></>}>
      <div className="space-y-4">
        <FormField label={t('employees.terminationDate')} required><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></FormField>
        <FormField label={t('employees.terminateReason')} required><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} /></FormField>
      </div>
    </CrudModal>
  )
}
