import React, { useState } from 'react'
import { Eye } from 'lucide-react'
import { auditApi } from '../../api/misc.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { useExport } from '../../hooks/useUtils'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { CrudModal, ExportMenu } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Tooltip } from '../../components/ui/controls'
import { formatDateTime } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import type { AuditLog } from '../../types'

export default function AuditPage() {
  const { t } = useTranslation()
  const [viewing, setViewing] = useState<AuditLog|null>(null)
  const { exportData, isExporting } = useExport()

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<AuditLog>({ queryKey: 'audit', queryFn: auditApi.list })

  const columns: Column<AuditLog>[] = [
    { key: 'user', header: 'User', render: (a) => a.user?.name ?? a.user_id },
    { key: 'action', header: t('audit.action'), sortable: true, render: (a) => <span className="font-mono text-xs bg-[var(--color-muted-bg)] px-2 py-0.5 rounded">{a.action}</span> },
    { key: 'module', header: t('audit.module'), sortable: true, render: (a) => a.module },
    { key: 'resource_type', header: t('audit.resource'), render: (a) => a.resource_type ?? '—' },
    { key: 'ip_address', header: t('audit.ipAddress'), render: (a) => a.ip_address ?? '—' },
    { key: 'created_at', header: t('common.date'), sortable: true, render: (a) => formatDateTime(a.created_at) },
    { key: 'actions', header: '', width: '60px', render: (a) => (a.before || a.after) ? <Tooltip content={t('audit.changes')}><Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setViewing(a) }}><Eye className="h-4 w-4" /></Button></Tooltip> : null },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={t('audit.title')} actions={<ExportMenu onExport={() => exportData(() => auditApi.export(), 'audit-logs.csv')} loading={isExporting} />} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<AuditLog> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(a) => a.id} />
      <CrudModal open={!!viewing} onClose={() => setViewing(null)} title={t('audit.changes')} size="xl"
        footer={<Button variant="outline" onClick={() => setViewing(null)}>{t('common.close')}</Button>}>
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('audit.before')}</p><pre className="bg-[var(--color-muted-bg)] rounded-lg p-3 text-xs overflow-auto max-h-60 font-mono">{viewing.before ? JSON.stringify(viewing.before, null, 2) : 'null'}</pre></div>
              <div><p className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('audit.after')}</p><pre className="bg-[var(--color-muted-bg)] rounded-lg p-3 text-xs overflow-auto max-h-60 font-mono">{viewing.after ? JSON.stringify(viewing.after, null, 2) : 'null'}</pre></div>
            </div>
          </div>
        )}
      </CrudModal>
    </div>
  )
}
