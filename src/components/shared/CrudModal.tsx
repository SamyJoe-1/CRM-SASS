import React, { useCallback } from 'react'
import { Download, FileText, Table, FileSpreadsheet, Upload, X, Globe } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { cn } from '../../lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../ui/index'
import { Button } from '../ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '../ui/controls'
import { useTranslation } from 'react-i18next'
import { applyLanguage } from '../../lib/i18n'
import i18n from '../../lib/i18n'

// ─── CrudModal ────────────────────────────────────────────────────────
interface CrudModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  children: React.ReactNode
  footer?: React.ReactNode
}

export function CrudModal({ open, onClose, title, description, size = 'md', children, footer }: CrudModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">{children}</div>
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}

// ─── DeleteConfirm ────────────────────────────────────────────────────
interface DeleteConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description?: string
  loading?: boolean
}

export function DeleteConfirm({ open, onClose, onConfirm, title, description, loading }: DeleteConfirmProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title ?? t('common.confirmDelete')}</DialogTitle>
          <DialogDescription>{description ?? t('common.deleteWarning')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>{t('common.delete')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── ExportMenu ───────────────────────────────────────────────────────
interface ExportMenuProps {
  onExport: (format: 'csv' | 'excel' | 'pdf') => void
  loading?: boolean
  formats?: ('csv' | 'excel' | 'pdf')[]
}

export function ExportMenu({ onExport, loading, formats = ['csv', 'excel', 'pdf'] }: ExportMenuProps) {
  const { t } = useTranslation()
  const iconMap = { csv: <Table className="h-4 w-4" />, excel: <FileSpreadsheet className="h-4 w-4" />, pdf: <FileText className="h-4 w-4" /> }
  const labelMap = { csv: 'CSV', excel: 'Excel', pdf: 'PDF' }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={loading}>
          <Download className="h-4 w-4" />
          {t('common.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map((fmt) => (
          <DropdownMenuItem key={fmt} onClick={() => onExport(fmt)} className="gap-2">
            {iconMap[fmt]}
            {t('common.exportAs', { format: labelMap[fmt] })}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── FileUploadZone ───────────────────────────────────────────────────
interface FileUploadZoneProps {
  onFiles: (files: File[]) => void
  accept?: Record<string, string[]>
  maxFiles?: number
  maxSize?: number
  className?: string
}

export function FileUploadZone({ onFiles, accept, maxFiles = 1, maxSize = 10 * 1024 * 1024, className }: FileUploadZoneProps) {
  const { t } = useTranslation()
  const [files, setFiles] = React.useState<File[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(acceptedFiles)
      onFiles(acceptedFiles)
    },
    [onFiles]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
  })

  return (
    <div className={cn('space-y-2', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150',
          isDragActive
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-[var(--color-border-strong)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/3'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 font-medium">
          {isDragActive ? t('common.dropHere') : t('common.dragOrClick')}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {t('common.maxSize', { size: `${maxSize / (1024 * 1024)}MB` })}
        </p>
      </div>
      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
              <span className="text-gray-700 truncate">{f.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const updated = files.filter((_, j) => j !== i)
                  setFiles(updated)
                  onFiles(updated)
                }}
                className="ml-2 text-gray-400 hover:text-[var(--color-danger)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── LanguageSwitcher ─────────────────────────────────────────────────
export function LanguageSwitcher() {
  const currentLang = i18n.language?.startsWith('ar') ? 'ar' : 'en'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-[var(--color-muted-bg)] transition-colors">
          <Globe className="h-4 w-4" />
          <span className="font-medium uppercase text-xs">{currentLang}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => applyLanguage('en')} className={cn(currentLang === 'en' && 'text-[var(--color-primary)] font-medium')}>
          🇺🇸 English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => applyLanguage('ar')} className={cn(currentLang === 'ar' && 'text-[var(--color-primary)] font-medium')}>
          🇸🇦 العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
