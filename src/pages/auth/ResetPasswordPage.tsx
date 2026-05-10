import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth.api'
import { Button } from '../../components/ui/button'
import { Input, FormField } from '../../components/ui/input'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
const schema = z.object({ password: z.string().min(8), password_confirmation: z.string() }).refine((d) => d.password === d.password_confirmation, { message: 'Passwords must match', path: ['password_confirmation'] })
type FormData = z.infer<typeof schema>
export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.resetPassword({ ...d, token: params.get('token') ?? '', email: params.get('email') ?? '' }),
    onSuccess: () => { toast.success(t('auth.resetSuccess')); navigate('/login') },
    onError: () => toast.error(t('common.errorOccurred')),
  })
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-sidebar)] to-[oklch(0.08_0.02_250)] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[var(--shadow-modal)] p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('auth.resetPassword')}</h1>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <FormField label={t('auth.newPassword')} error={errors.password?.message} required><Input type="password" {...register('password')} /></FormField>
          <FormField label={t('auth.confirmPassword')} error={errors.password_confirmation?.message} required><Input type="password" {...register('password_confirmation')} /></FormField>
          <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>{t('auth.resetPassword')}</Button>
        </form>
      </div>
    </div>
  )
}
