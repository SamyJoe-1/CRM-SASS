import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { analyticsApi } from '../../api/analytics.api'
import { useExport } from '../../hooks/useUtils'
import { PageHeader } from '../../components/shared/PageHeader'
import { ExportMenu } from '../../components/shared/CrudModal'
import { PageLoader } from '../../components/shared/StatusBadge'
import { Card, CardHeader, CardTitle, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/index'
import { formatCurrency } from '../../lib/utils'
import { useTranslation } from 'react-i18next'

const COLORS = ['oklch(0.52 0.19 250)','oklch(0.58 0.16 145)','oklch(0.54 0.22 25)','oklch(0.72 0.17 75)','oklch(0.58 0.16 220)','oklch(0.58 0.16 300)']

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { exportData, isExporting } = useExport()
  const { data: att, isLoading: attLoading } = useQuery({ queryKey: ['analytics-att'], queryFn: () => analyticsApi.attendanceTrends() })
  const { data: pay, isLoading: payLoading } = useQuery({ queryKey: ['analytics-pay'], queryFn: () => analyticsApi.payrollTrends() })
  const { data: leave, isLoading: leaveLoading } = useQuery({ queryKey: ['analytics-leave'], queryFn: () => analyticsApi.leaveUsage() })
  const { data: perf, isLoading: perfLoading } = useQuery({ queryKey: ['analytics-perf'], queryFn: () => analyticsApi.performance() })
  const { data: kpi } = useQuery({ queryKey: ['analytics-kpi'], queryFn: () => analyticsApi.kpiAchievement() })
  const { data: headcount } = useQuery({ queryKey: ['analytics-headcount'], queryFn: () => analyticsApi.headcount() })

  const attData = Array.isArray(att) ? att as Record<string,unknown>[] : []
  const payData = Array.isArray(pay) ? pay as Record<string,unknown>[] : []
  const leaveData = Array.isArray(leave) ? leave as Record<string,unknown>[] : []
  const perfData = Array.isArray(perf) ? perf as Record<string,unknown>[] : []
  const kpiData = Array.isArray(kpi) ? kpi as Record<string,unknown>[] : []
  const hcData = Array.isArray(headcount) ? headcount as Record<string,unknown>[] : []

  return (
    <div className="space-y-6">
      <PageHeader title={t('analytics.title')} actions={
        <ExportMenu onExport={(fmt) => exportData(() => analyticsApi.export({ type: 'all', format: fmt }), `analytics.${fmt}`)} loading={isExporting} />
      } />
      <Tabs defaultValue="attendance">
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="attendance">{t('analytics.attendanceTrends')}</TabsTrigger>
          <TabsTrigger value="payroll">{t('analytics.payrollTrends')}</TabsTrigger>
          <TabsTrigger value="leave">{t('analytics.leaveUsage')}</TabsTrigger>
          <TabsTrigger value="performance">{t('analytics.performance')}</TabsTrigger>
          <TabsTrigger value="kpi">{t('analytics.kpiAchievement')}</TabsTrigger>
          <TabsTrigger value="headcount">{t('analytics.headcount')}</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card><CardHeader><CardTitle>{t('analytics.attendanceTrends')}</CardTitle></CardHeader><CardContent>
            {attLoading ? <PageLoader /> : <ResponsiveContainer width="100%" height={320}><BarChart data={attData}><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 250)" /><XAxis dataKey="date" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px'}} /><Legend wrapperStyle={{fontSize:'12px'}} /><Bar dataKey="present" name="Present" fill={COLORS[1]} radius={[4,4,0,0]} /><Bar dataKey="absent" name="Absent" fill={COLORS[2]} radius={[4,4,0,0]} /><Bar dataKey="late" name="Late" fill={COLORS[3]} radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card><CardHeader><CardTitle>{t('analytics.payrollTrends')}</CardTitle></CardHeader><CardContent>
            {payLoading ? <PageLoader /> : <ResponsiveContainer width="100%" height={320}><LineChart data={payData}><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 250)" /><XAxis dataKey="period" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px'}} formatter={(v:unknown)=>formatCurrency(Number(v))} /><Legend wrapperStyle={{fontSize:'12px'}} /><Line type="monotone" dataKey="total_net" name="Net" stroke={COLORS[0]} strokeWidth={2} dot={{r:4}} /><Line type="monotone" dataKey="total_gross" name="Gross" stroke={COLORS[1]} strokeWidth={2} dot={{r:4}} strokeDasharray="5 5" /></LineChart></ResponsiveContainer>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card><CardHeader><CardTitle>{t('analytics.leaveUsage')}</CardTitle></CardHeader><CardContent>
            {leaveLoading ? <PageLoader /> : <ResponsiveContainer width="100%" height={320}><PieChart><Pie data={leaveData} dataKey="count" nameKey="leave_type" cx="50%" cy="50%" outerRadius={120} label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`}>{leaveData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}</Pie><Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px'}} /><Legend wrapperStyle={{fontSize:'12px'}} /></PieChart></ResponsiveContainer>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card><CardHeader><CardTitle>{t('analytics.performance')}</CardTitle></CardHeader><CardContent>
            {perfLoading ? <PageLoader /> : <ResponsiveContainer width="100%" height={320}><BarChart data={perfData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 250)" /><XAxis type="number" tick={{fontSize:11}} domain={[0,10]} /><YAxis type="category" dataKey="employee" tick={{fontSize:11}} width={120} /><Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px'}} /><Bar dataKey="score" name="Score" fill={COLORS[0]} radius={[0,4,4,0]} /></BarChart></ResponsiveContainer>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="kpi">
          <Card><CardHeader><CardTitle>{t('analytics.kpiAchievement')}</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={320}><BarChart data={kpiData}><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 250)" /><XAxis dataKey="category" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} unit="%" /><Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px'}} /><Legend wrapperStyle={{fontSize:'12px'}} /><Bar dataKey="achievement_rate" name="Achievement %" fill={COLORS[4]} radius={[4,4,0,0]} /></BarChart></ResponsiveContainer>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="headcount">
          <Card><CardHeader><CardTitle>{t('analytics.headcount')}</CardTitle></CardHeader><CardContent>
            <ResponsiveContainer width="100%" height={320}><LineChart data={hcData}><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 250)" /><XAxis dataKey="month" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip contentStyle={{borderRadius:'8px',fontSize:'12px'}} /><Legend wrapperStyle={{fontSize:'12px'}} /><Line type="monotone" dataKey="headcount" name="Headcount" stroke={COLORS[0]} strokeWidth={2} dot={{r:4}} /><Line type="monotone" dataKey="new_hires" name="New Hires" stroke={COLORS[1]} strokeWidth={2} dot={{r:4}} /><Line type="monotone" dataKey="terminations" name="Terminations" stroke={COLORS[2]} strokeWidth={2} dot={{r:4}} /></LineChart></ResponsiveContainer>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
