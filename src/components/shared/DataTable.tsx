import React from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Select } from '../ui/controls'
import { Skeleton } from '../ui/index'
import { EmptyState, ErrorState } from './StatusBadge'
import { useTranslation } from 'react-i18next'

export interface Column<T> {
  key: string
  header: string
  sortable?: boolean
  width?: string
  className?: string
  render?: (row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  page?: number
  perPage?: number
  total?: number
  lastPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: { label: string; onClick: () => void }
  rowKey?: (row: T) => string
  onRowClick?: (row: T) => void
  className?: string
  compact?: boolean
}

const PER_PAGE_OPTIONS = [
  { value: '10', label: '10' },
  { value: '20', label: '20' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  error,
  onRetry,
  sortBy,
  sortDir,
  onSort,
  page = 1,
  perPage = 20,
  total = 0,
  lastPage = 1,
  onPageChange,
  onPerPageChange,
  emptyTitle,
  emptyDescription,
  emptyAction,
  rowKey,
  onRowClick,
  className,
  compact = false,
}: DataTableProps<T>) {
  const { t } = useTranslation()

  const SKELETON_ROWS = perPage > 10 ? 8 : perPage

  if (error) {
    return <ErrorState onRetry={onRetry} />
  }

  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full data-table">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-semibold text-[var(--color-muted)] text-xs uppercase tracking-wide whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-gray-700',
                    col.width && `w-[${col.width}]`,
                    col.className
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (
                      <span className="flex flex-col">
                        <ChevronUp
                          className={cn('h-3 w-3', sortBy === col.key && sortDir === 'asc' ? 'text-[var(--color-primary)]' : 'text-gray-300')}
                        />
                        <ChevronDown
                          className={cn('h-3 w-3 -mt-1', sortBy === col.key && sortDir === 'desc' ? 'text-[var(--color-primary)]' : 'text-gray-300')}
                        />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-4', compact ? 'py-2.5' : 'py-3.5')}>
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  className={cn(
                    'border-b border-[var(--color-border)] last:border-0 bg-white',
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-[var(--color-surface-2)]'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 text-sm text-gray-700',
                        compact ? 'py-2.5' : 'py-3.5',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, i) : (String(row[col.key] ?? '—'))}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(onPageChange || onPerPageChange) && (
        <div className="flex items-center justify-between px-1 py-3 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {loading ? t('common.loading') : t('common.showing', { from, to, total })}
            </span>
            {onPerPageChange && (
              <Select
                value={String(perPage)}
                onValueChange={(v) => onPerPageChange(Number(v))}
                options={PER_PAGE_OPTIONS}
                className="w-20 h-8 text-xs"
              />
            )}
          </div>
          {onPageChange && lastPage > 1 && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" onClick={() => onPageChange(1)} disabled={page === 1}>
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-gray-600 px-2 min-w-[60px] text-center">
                {t('common.pageOf', { page, lastPage })}
              </span>
              <Button variant="outline" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page === lastPage}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="icon-sm" onClick={() => onPageChange(lastPage)} disabled={page === lastPage}>
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
