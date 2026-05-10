import React, { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../../api/misc.api'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/button'
import { Input, FormField } from '../../components/ui/input'
import { Select } from '../../components/ui/controls'
import { Card, CardContent, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/index'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { GeneralSettings, PayrollSettings } from '../../types'

export default function SettingsPage() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data: general } = useQuery({ queryKey: ['settings-general'], queryFn: settingsApi.getGeneral })
  const { data: payroll } = useQuery({ queryKey: ['settings-payroll'], queryFn: settingsApi.getPayroll })
  const [genForm, setGenForm] = useState<Partial<GeneralSettings>>({})
  const [payForm, setPayForm] = useState<Partial<PayrollSettings>>({})
  useEffect(() => { if (general) setGenForm(general) }, [general])
  useEffect(() => { if (payroll) setPayForm(payroll) }, [payroll])

  const genMutation = useMutation({ mutationFn: settingsApi.updateGeneral, onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings-general'] }) } })
  const payMutation = useMutation({ mutationFn: settingsApi.updatePayroll, onSuccess: () => { toast.success('Settings saved'); qc.invalidateQueries({ queryKey: ['settings-payroll'] }) } })

  const freqOptions = [{ value:'weekly',label:'Weekly' },{ value:'biweekly',label:'Bi-weekly' },{ value:'monthly',label:'Monthly' }]
  const tzOptions = [{ value:'UTC',label:'UTC' },{ value:'America/New_York',label:'Eastern (ET)' },{ value:'Europe/London',label:'London (GMT)' },{ value:'Asia/Riyadh',label:'Riyadh (AST)' },{ value:'Asia/Dubai',label:'Dubai (GST)' }]

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.title')} />
      <Tabs defaultValue="general">
        <div className="flex flex-col sm:flex-row gap-6">
          <TabsList className="flex-col h-auto w-full sm:w-48 gap-1 p-2 self-start">
            <TabsTrigger value="general" className="w-full justify-start">{t('settings.general')}</TabsTrigger>
            <TabsTrigger value="payroll" className="w-full justify-start">{t('settings.payroll')}</TabsTrigger>
            <TabsTrigger value="roles" className="w-full justify-start">{t('settings.roles')}</TabsTrigger>
          </TabsList>
          <div className="flex-1">
            <TabsContent value="general">
              <Card>
                <CardContent className="py-6">
                  <div className="grid grid-cols-2 gap-4 max-w-lg">
                    <FormField label={t('settings.companyName')} required className="col-span-2">
                      <Input value={genForm.company_name ?? ''} onChange={(e) => setGenForm((f) => ({ ...f, company_name: e.target.value }))} />
                    </FormField>
                    <FormField label={t('settings.companyEmail')} required>
                      <Input type="email" value={genForm.company_email ?? ''} onChange={(e) => setGenForm((f) => ({ ...f, company_email: e.target.value }))} />
                    </FormField>
                    <FormField label={t('settings.companyPhone')}>
                      <Input value={genForm.company_phone ?? ''} onChange={(e) => setGenForm((f) => ({ ...f, company_phone: e.target.value }))} />
                    </FormField>
                    <FormField label={t('settings.timezone')}>
                      <Select value={genForm.timezone ?? 'UTC'} onValueChange={(v) => setGenForm((f) => ({ ...f, timezone: v }))} options={tzOptions} />
                    </FormField>
                    <FormField label="Currency">
                      <Input value={genForm.currency ?? ''} onChange={(e) => setGenForm((f) => ({ ...f, currency: e.target.value }))} placeholder="USD" />
                    </FormField>
                  </div>
                  <Button onClick={() => genMutation.mutate(genForm as GeneralSettings)} loading={genMutation.isPending} className="mt-4">{t('common.save')}</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="payroll">
              <Card>
                <CardContent className="py-6">
                  <div className="grid grid-cols-2 gap-4 max-w-lg">
                    <FormField label={t('settings.payFrequency')} className="col-span-2">
                      <Select value={payForm.pay_frequency ?? 'monthly'} onValueChange={(v) => setPayForm((f) => ({ ...f, pay_frequency: v }))} options={freqOptions} />
                    </FormField>
                    <FormField label={t('settings.taxRate')}>
                      <Input type="number" step="0.01" value={payForm.tax_rate ?? ''} onChange={(e) => setPayForm((f) => ({ ...f, tax_rate: Number(e.target.value) }))} />
                    </FormField>
                    <FormField label={t('settings.insuranceRate')}>
                      <Input type="number" step="0.01" value={payForm.insurance_rate ?? ''} onChange={(e) => setPayForm((f) => ({ ...f, insurance_rate: Number(e.target.value) }))} />
                    </FormField>
                    <FormField label={t('settings.overtimeRate')}>
                      <Input type="number" step="0.01" value={payForm.overtime_rate ?? ''} onChange={(e) => setPayForm((f) => ({ ...f, overtime_rate: Number(e.target.value) }))} />
                    </FormField>
                    <FormField label="Currency">
                      <Input value={payForm.currency ?? ''} onChange={(e) => setPayForm((f) => ({ ...f, currency: e.target.value }))} placeholder="USD" />
                    </FormField>
                  </div>
                  <Button onClick={() => payMutation.mutate(payForm as PayrollSettings)} loading={payMutation.isPending} className="mt-4">{t('common.save')}</Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="roles">
              <RolesPanel />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

function RolesPanel() {
  const { t } = useTranslation()
  const { data: roles, isLoading } = useQuery({ queryKey: ['settings-roles'], queryFn: settingsApi.getRoles })
  if (isLoading) {
    return (
      <div className="h-40 flex items-center justify-center">
        <div className="animate-spin h-6 w-6 rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {roles?.map((role) => (
        <Card key={role.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{role.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{role.permissions.length} {t('settings.permissions')} · {role.is_system ? t('settings.systemRole') : 'Custom'}</p>
              </div>
              {!role.is_system && <Button variant="outline" size="sm">{t('common.edit')}</Button>}
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {role.permissions.slice(0, 8).map((p) => (
                <span key={p} className="text-[10px] bg-[var(--color-muted-bg)] text-gray-600 px-2 py-0.5 rounded font-mono">{p}</span>
              ))}
              {role.permissions.length > 8 && (
                <span className="text-[10px] text-gray-400">+{role.permissions.length - 8} more</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
