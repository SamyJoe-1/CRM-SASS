import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, UserCheck, UserX } from 'lucide-react'
import { usersApi } from '../../api/misc.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal, DeleteConfirm } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Input, FormField } from '../../components/ui/input'
import { Select, Tooltip } from '../../components/ui/controls'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { formatDateTime } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { UserRecord } from '../../types'

const schema = z.object({ name: z.string().min(1), email: z.string().email(), role: z.string().min(1), password: z.string().min(8).optional() })
type FormData = z.infer<typeof schema>

export default function UsersPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string|null>(null)
  const [editing, setEditing] = useState<UserRecord|null>(null)

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<UserRecord>({ queryKey: 'users', queryFn: usersApi.list })
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const createM = useMutation({ mutationFn: usersApi.create, onSuccess: () => { toast.success('User created'); qc.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false); reset() } })
  const updateM = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<UserRecord> }) => usersApi.update(id, data), onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['users'] }); setModalOpen(false) } })
  const deleteM = useMutation({ mutationFn: usersApi.delete, onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['users'] }); setDeleteId(null) } })
  const activateM = useMutation({ mutationFn: usersApi.activate, onSuccess: () => { toast.success('Activated'); qc.invalidateQueries({ queryKey: ['users'] }) } })
  const deactivateM = useMutation({ mutationFn: usersApi.deactivate, onSuccess: () => { toast.success('Deactivated'); qc.invalidateQueries({ queryKey: ['users'] }) } })

  const roleOptions = [{ value:'admin',label:'Admin' },{ value:'hr_manager',label:'HR Manager' },{ value:'manager',label:'Manager' },{ value:'employee',label:'Employee' }]

  const columns: Column<UserRecord>[] = [
    { key: 'name', header: t('common.name'), sortable: true, render: (u) => <span className="font-medium text-gray-900">{u.name}</span> },
    { key: 'email', header: t('common.email'), render: (u) => <span className="text-gray-600 text-xs">{u.email}</span> },
    { key: 'role', header: t('users.role'), render: (u) => <span className="capitalize text-sm">{u.role.replace('_',' ')}</span> },
    { key: 'last_login', header: t('users.lastLogin'), render: (u) => u.last_login ? formatDateTime(u.last_login) : '—' },
    { key: 'is_active', header: t('common.status'), render: (u) => <StatusBadge status={u.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions', header: t('common.actions'), width: '120px', render: (u) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {u.is_active
          ? <Tooltip content={t('users.deactivate')}><Button variant="ghost" size="icon-sm" onClick={() => deactivateM.mutate(u.id)}><UserX className="h-4 w-4 text-[var(--color-warning)]" /></Button></Tooltip>
          : <Tooltip content={t('users.activate')}><Button variant="ghost" size="icon-sm" onClick={() => activateM.mutate(u.id)}><UserCheck className="h-4 w-4 text-[var(--color-success)]" /></Button></Tooltip>}
        <Tooltip content={t('common.edit')}><Button variant="ghost" size="icon-sm" onClick={() => { setEditing(u); reset({ name: u.name, email: u.email, role: u.role }); setModalOpen(true) }}><Edit className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('common.delete')}><Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4 text-[var(--color-danger)]" /></Button></Tooltip>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('users.title')} actions={<Button onClick={() => { setEditing(null); reset(); setModalOpen(true) }} className="gap-2"><Plus className="h-4 w-4" />{t('users.addUser')}</Button>} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<UserRecord> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(u) => u.id} />
      <CrudModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} title={editing ? t('common.edit') : t('users.addUser')} size="md"
        footer={<><Button variant="outline" onClick={() => { setModalOpen(false); setEditing(null) }}>{t('common.cancel')}</Button><Button onClick={handleSubmit((d) => editing ? updateM.mutate({ id: editing.id, data: d as Partial<UserRecord> }) : createM.mutate(d as Partial<UserRecord>))} loading={createM.isPending || updateM.isPending}>{editing ? t('common.save') : t('common.create')}</Button></>}>
        <div className="space-y-4">
          <FormField label={t('common.name')} required error={errors.name?.message}><Input {...register('name')} /></FormField>
          <FormField label={t('common.email')} required error={errors.email?.message}><Input type="email" {...register('email')} /></FormField>
          <FormField label={t('users.role')} required error={errors.role?.message}><Select value={watch('role') ?? ''} onValueChange={(v) => setValue('role', v)} options={roleOptions} /></FormField>
          {!editing && <FormField label="Password" required error={errors.password?.message}><Input type="password" {...register('password')} /></FormField>}
        </div>
      </CrudModal>
      <DeleteConfirm open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && deleteM.mutate(deleteId)} loading={deleteM.isPending} />
    </div>
  )
}
