import React from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'

// ─── PageHeader ───────────────────────────────────────────────────────
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

// ─── FilterBar ────────────────────────────────────────────────────────
interface FilterBarProps {
  search: string
  onSearch: (val: string) => void
  placeholder?: string
  filters?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function FilterBar({ search, onSearch, placeholder, filters, actions, className }: FilterBarProps) {
  const { t } = useTranslation()
  return (
    <div className={cn('flex items-center gap-3 flex-wrap', className)}>
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder ?? t('common.search')}
          className="pl-9 h-9"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {filters}
      {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
    </div>
  )
}

// ─── ActiveFilters ────────────────────────────────────────────────────
interface ActiveFiltersProps {
  filters: { key: string; label: string; value: string }[]
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function ActiveFilters({ filters, onRemove, onClearAll }: ActiveFiltersProps) {
  const { t } = useTranslation()
  if (filters.length === 0) return null
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500 flex items-center gap-1">
        <SlidersHorizontal className="h-3 w-3" />
        {t('common.filters')}:
      </span>
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs px-2.5 py-1 font-medium"
        >
          {f.label}: {f.value}
          <button onClick={() => onRemove(f.key)} className="ml-0.5 hover:text-[var(--color-primary-hover)]">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <Button variant="ghost" size="sm" onClick={onClearAll} className="text-xs text-gray-500 h-7 px-2">
        {t('common.clearAll')}
      </Button>
    </div>
  )
}
