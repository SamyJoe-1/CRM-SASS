import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/authStore'
import { Button } from '../../components/ui/button'
import { Input, FormField } from '../../components/ui/input'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => { setAuth(data.user, data.access_token, data.refresh_token); navigate('/dashboard') },
    onError: () => toast.error(t('auth.loginError')),
  })
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-sidebar)] via-[oklch(0.15_0.03_250)] to-[oklch(0.08_0.02_250)] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-[var(--shadow-modal)] p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center"><span className="text-white font-bold text-lg">N</span></div>
            <div><p className="font-bold text-gray-900 text-lg">NexCRM</p><p className="text-xs text-gray-500">Enterprise Platform</p></div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-gray-500 mb-8">{t('auth.signInSubtitle')}</p>
          <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField label={t('auth.email')} error={errors.email?.message} required>
              <Input type="email" placeholder="you@company.com" error={!!errors.email} {...register('email')} />
            </FormField>
            <FormField label={t('auth.password')} error={errors.password?.message} required>
              <Input type="password" placeholder="••••••••" error={!!errors.password} {...register('password')} />
            </FormField>
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-[var(--color-primary)] hover:underline">{t('auth.forgotPassword')}</Link>
            </div>
            <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>{t('auth.login')}</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
