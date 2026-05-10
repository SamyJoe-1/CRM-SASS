import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Eye } from 'lucide-react'
import { payslipsApi } from '../../api/payslips.api'
import { usePaginatedQuery } from '../../hooks/usePaginatedQuery'
import { usePermission } from '../../hooks/usePermission'
import { useExport } from '../../hooks/useUtils'
import { PageHeader, FilterBar } from '../../components/shared/PageHeader'
import { DataTable, type Column } from '../../components/shared/DataTable'
import { StatusBadge } from '../../components/shared/StatusBadge'
import { CrudModal } from '../../components/shared/CrudModal'
import { Button } from '../../components/ui/button'
import { Tooltip } from '../../components/ui/controls'
import { Card, CardContent, Separator } from '../../components/ui/index'
import { formatDate, formatCurrency } from '../../lib/utils'
import { useTranslation } from 'react-i18next'
import { downloadBlob } from '../../lib/utils'
import { toast } from 'sonner'
import type { Payslip } from '../../types'

export default function PayslipsPage() {
  const { t } = useTranslation()
  const { isHR } = usePermission()
  const [viewPayslip, setViewPayslip] = useState<Payslip|null>(null)

  const { data, isLoading, isError, refetch, page, perPage, search, sortBy, sortDir, setPage, setPerPage, handleSort, handleSearch, total, lastPage } = usePaginatedQuery<Payslip>({
    queryKey: 'payslips', queryFn: isHR ? payslipsApi.list : payslipsApi.mine,
  })

  async function handleDownload(id: string) {
    try { const blob = await payslipsApi.download(id); downloadBlob(blob, `payslip-${id}.pdf`) }
    catch { toast.error('Download failed') }
  }

  const columns: Column<Payslip>[] = [
    { key: 'employee', header: t('employees.fullName'), render: (p) => p.employee?.full_name ?? '—' },
    { key: 'period', header: t('payslips.period'), render: (p) => p.payroll ? `${formatDate(p.payroll.period_start)} — ${formatDate(p.payroll.period_end)}` : '—' },
    { key: 'payment_date', header: t('payslips.paymentDate'), sortable: true, render: (p) => formatDate(p.payment_date) },
    { key: 'gross_salary', header: 'Gross', render: (p) => formatCurrency(p.gross_salary, p.currency) },
    { key: 'total_deductions', header: t('payslips.deductions'), render: (p) => formatCurrency(p.total_deductions, p.currency) },
    { key: 'net_salary', header: t('payslips.netPay'), render: (p) => <span className="font-bold text-[var(--color-success)]">{formatCurrency(p.net_salary, p.currency)}</span> },
    { key: 'status', header: t('common.status'), render: (p) => <StatusBadge status={p.status} /> },
    { key: 'actions', header: t('common.actions'), width: '80px', render: (p) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Tooltip content={t('common.view')}><Button variant="ghost" size="icon-sm" onClick={() => setViewPayslip(p)}><Eye className="h-4 w-4" /></Button></Tooltip>
        <Tooltip content={t('payslips.download')}><Button variant="ghost" size="icon-sm" onClick={() => handleDownload(p.id)}><Download className="h-4 w-4" /></Button></Tooltip>
      </div>
    )},
  ]

  return (
    <div className="space-y-6">
      <PageHeader title={isHR ? t('payslips.title') : t('payslips.myPayslips')} />
      <FilterBar search={search} onSearch={handleSearch} />
      <DataTable<Payslip> columns={columns} data={data?.data ?? []} loading={isLoading} error={isError} onRetry={refetch} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} page={page} perPage={perPage} total={total} lastPage={lastPage} onPageChange={setPage} onPerPageChange={setPerPage} rowKey={(p) => p.id} />
      <CrudModal open={!!viewPayslip} onClose={() => setViewPayslip(null)} title={t('payslips.title')} size="md"
        footer={<><Button variant="outline" onClick={() => setViewPayslip(null)}>{t('common.close')}</Button><Button onClick={() => viewPayslip && handleDownload(viewPayslip.id)} className="gap-2"><Download className="h-4 w-4" />{t('payslips.download')}</Button></>}>
        {viewPayslip && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm"><span className="text-gray-500">Employee</span><span className="font-medium">{viewPayslip.employee?.full_name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t('payslips.period')}</span><span className="font-medium">{viewPayslip.payroll ? `${formatDate(viewPayslip.payroll.period_start)} — ${formatDate(viewPayslip.payroll.period_end)}` : '—'}</span></div>
            <div className="flex justify-between text-sm"><span className="text-gray-500">{t('payslips.paymentDate')}</span><span className="font-medium">{formatDate(viewPayslip.payment_date)}</span></div>
            <Separator />
            <p className="text-xs font-semibold text-gray-500 uppercase">{t('payslips.earnings')}</p>
            {[['Basic Salary', viewPayslip.basic_salary],['Allowances', viewPayslip.allowances],['Overtime', viewPayslip.overtime_pay],['Bonuses', viewPayslip.bonuses]].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm"><span className="text-gray-600">{label}</span><span>{formatCurrency(Number(val), viewPayslip.currency)}</span></div>
            ))}
            <div className="flex justify-between text-sm font-semibold border-t border-[var(--color-border)] pt-2"><span>Gross</span><span>{formatCurrency(viewPayslip.gross_salary, viewPayslip.currency)}</span></div>
            <Separator />
            <p className="text-xs font-semibold text-gray-500 uppercase">{t('payslips.deductions')}</p>
            {[['Tax', viewPayslip.tax],['Insurance', viewPayslip.insurance],['Other', viewPayslip.other_deductions]].map(([label, val]) => (
              <div key={String(label)} className="flex justify-between text-sm"><span className="text-gray-600">{label}</span><span className="text-[var(--color-danger)]">-{formatCurrency(Number(val), viewPayslip.currency)}</span></div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span>{t('payslips.netPay')}</span><span className="text-[var(--color-success)]">{formatCurrency(viewPayslip.net_salary, viewPayslip.currency)}</span></div>
          </div>
        )}
      </CrudModal>
    </div>
  )
}
