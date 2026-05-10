import React from 'react'
import { AlertTriangle, Inbox, RefreshCw, Loader2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn, capitalize, STATUS_COLORS } from '../../lib/utils'
import { Badge } from '../ui/index'
import { Button } from '../ui/button'
import { useTranslation } from 'react-i18next'

// ─── StatusBadge ──────────────────────────────────────────────────────
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const color = STATUS_COLORS[status] ?? 'default'
  const variantMap: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default' | 'primary'> = {
    success: 'success',
    danger: 'danger',
    warning: 'warning',
    info: 'info',
    muted: 'default',
    primary: 'primary',
  }
  return (
    <Badge variant={variantMap[color] ?? 'default'} className={className}>
      {capitalize(status.replace(/_/g, ' '))}
    </Badge>
  )
}

// ─── StatCard ────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; label?: string }
  color?: string
  className?: string
  loading?: boolean
}

export function StatCard({ title, value, icon, trend, color = 'var(--color-primary)', className, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 stat-card', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-7 w-16 rounded" />
          </div>
          <div className="skeleton h-10 w-10 rounded-xl" />
        </div>
      </div>
    )
  }
  return (
    <div className={cn('bg-white rounded-xl border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6 stat-card', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wide">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={cn('mt-1 flex items-center gap-1 text-xs font-medium', trend.value >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
              {trend.value >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}% {trend.label ?? 'vs last period'}
            </p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

// ─── EmptyState ───────────────────────────────────────────────────────
interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-muted-bg)] text-[var(--color-muted)] mb-4">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title ?? t('common.noData')}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// ─── ErrorState ───────────────────────────────────────────────────────
interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-danger-subtle)] text-[var(--color-danger)] mb-4">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{t('common.errorOccurred')}</h3>
      {message && <p className="mt-1 text-sm text-gray-500 max-w-sm">{message}</p>}
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}

// ─── LoadingSpinner ───────────────────────────────────────────────────
export function LoadingSpinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <Loader2 className={cn('animate-spin text-[var(--color-primary)]', sizeMap[size], className)} />
  )
}

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[200px] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )
}
