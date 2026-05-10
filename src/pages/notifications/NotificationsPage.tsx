import React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCheck } from 'lucide-react'
import { notificationsApi } from '../../api/misc.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { useNotificationStore } from '../../stores/notificationStore'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { Button } from '../../components/ui/button'
import { cn, formatDateTime } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { Notification } from '../../types'

export default function NotificationsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { clearUnread } = useNotificationStore()

  const { data, isLoading, isError, refetch, page, perPage, setPage, setPerPage, total, lastPage } = usePaginatedQuery<Notification>({ queryKey: 'notifications', queryFn: notificationsApi.list })

  const markRead = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }) })
  const markAllRead = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }); clearUnread() } })

  const columns: Column<Notification>[] = [
    { key: 'status', header: '', width: '24px', render: (n) => <div className={cn('h-2 w-2 rounded-full', !n.read_at ? 'bg-[var(--color-primary)]' : 'bg-transparent')} /> },
    { key: 'title', header: 'Title', render: (n) => <span className={cn('font-medium', !n.read_at ? 'text-gray-900' : 'text-gray-500')}>{n.title}</span> },
    { key: 'message', header: 'Message', render: (n) => <span className="text-sm text-gray-500 line-clamp-1">{n.message}</span> },
    { key: 'type', header: 'Type', render: (n) => <span className="text-xs text-gray-400 capitalize">{n.type.replace(/_/g,' ')}</span> },
    { key: 'created_at', header: t('common.date'), render: (n) => formatDateTime(n.created_at) },
    { key: 'actions', header: '', width: '60px', render: (n) => !n.read_at ? <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id) }}><CheckCheck className="h-4 w-4 text-[var(--color-primary)]" /></Button> : null },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('notifications.title')} actions={<Button variant="outline" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending} className="gap-2"><CheckCheck className="h-4 w-4" />{t('notifications.markAllRead')}</Button>} />
      <DataTable<Notification> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(n) => n.id} onRowClick={(n) => { if (!n.read_at) markRead.mutate(n.id) }} />
    </div>
  )
}
