import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, Clock, Calendar, DollarSign, TrendingUp, UserCheck, Briefcase, AlertCircle } from 'lucide-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { analyticsApi } from '../../api/analytics.api'
import { leaveApi } from '../../api/leave.api'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard, StatusBadge } from '../../components/shared/StatusBadge'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/index'
import { Avatar } from '../../components/ui/controls'
import { formatCurrency, formatDate, getInitials } from '../../lib/utils'
import { useTranslation } from 'react-i18next'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { data: overview, isLoading } = useQuery({ queryKey: ['analytics-overview'], queryFn: analyticsApi.overview })
  const { data: attTrends } = useQuery({ queryKey: ['analytics-att-trends'], queryFn: () => analyticsApi.attendanceTrends() })
  const { data: payTrends } = useQuery({ queryKey: ['analytics-pay-trends'], queryFn: () => analyticsApi.payrollTrends() })
  const { data: leaveReqs } = useQuery({ queryKey: ['leave-requests-recent'], queryFn: () => leaveApi.listRequests({ per_page: 5, sort_by: 'created_at', sort_dir: 'desc' }) })

  const stats = [
    { title: t('dashboard.totalEmployees'), value: overview?.total_employees ?? 0, icon: <Users className="h-5 w-5" />, color: 'var(--color-primary)' },
    { title: t('dashboard.activeEmployees'), value: overview?.active_employees ?? 0, icon: <UserCheck className="h-5 w-5" />, color: 'oklch(0.58 0.16 145)' },
    { title: t('dashboard.onLeaveToday'), value: overview?.on_leave_today ?? 0, icon: <Calendar className="h-5 w-5" />, color: 'var(--color-warning)' },
    { title: t('dashboard.pendingLeave'), value: overview?.pending_leave_requests ?? 0, icon: <AlertCircle className="h-5 w-5" />, color: 'var(--color-danger)' },
    { title: t('dashboard.attendanceRate'), value: `${overview?.attendance_rate ?? 0}%`, icon: <Clock className="h-5 w-5" />, color: 'oklch(0.58 0.16 220)' },
    { title: t('dashboard.monthlyPayroll'), value: formatCurrency(overview?.total_payroll_this_month ?? 0), icon: <DollarSign className="h-5 w-5" />, color: 'oklch(0.52 0.19 250)' },
    { title: t('dashboard.newHires'), value: overview?.new_hires_this_month ?? 0, icon: <TrendingUp className="h-5 w-5" />, color: 'oklch(0.72 0.17 75)' },
    { title: t('dashboard.openPositions'), value: overview?.open_positions ?? 0, icon: <Briefcase className="h-5 w-5" />, color: 'oklch(0.58 0.16 300)' },
  ]
  const attData = Array.isArray(attTrends) ? attTrends as Record<string, unknown>[] : []
  const payData = Array.isArray(payTrends) ? payTrends as Record<string, unknown>[] : []

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.overview')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.title} {...s} loading={isLoading} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{t('dashboard.attendanceTrend')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 250)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="present" name="Present" fill="oklch(0.58 0.16 145)" radius={[4,4,0,0]} />
                <Bar dataKey="absent" name="Absent" fill="oklch(0.54 0.22 25)" radius={[4,4,0,0]} />
                <Bar dataKey="late" name="Late" fill="oklch(0.72 0.17 75)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('dashboard.payrollTrend')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={payData}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 250)" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} formatter={(v: unknown) => formatCurrency(Number(v))} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="total_net" name="Net Payroll" stroke="oklch(0.52 0.19 250)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="total_gross" name="Gross Payroll" stroke="oklch(0.58 0.16 145)" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>{t('dashboard.recentLeave')}</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!leaveReqs?.data?.length && <p className="text-sm text-gray-500 text-center py-4">{t('common.noData')}</p>}
            {leaveReqs?.data?.map((req) => (
              <div key={req.id} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0">
                <div className="flex items-center gap-3">
                  <Avatar src={req.employee?.avatar} fallback={getInitials(req.employee?.full_name ?? 'E')} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{req.employee?.full_name}</p>
                    <p className="text-xs text-gray-500">{req.leave_type?.name} · {req.days} {t('leave.days')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-gray-500 hidden sm:block">{formatDate(req.start_date)} — {formatDate(req.end_date)}</p>
                  <StatusBadge status={req.status} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
