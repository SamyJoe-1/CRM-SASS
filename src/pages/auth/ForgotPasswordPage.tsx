import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth.api'
import { Button } from '../../components/ui/button'
import { Input, FormField } from '../../components/ui/input'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
const schema = z.object({ email: z.string().email() })
type FormData = z.infer<typeof schema>
export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({ mutationFn: authApi.forgotPassword, onSuccess: () => toast.success('Reset link sent'), onError: () => toast.error(t('common.errorOccurred')) })
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-sidebar)] to-[oklch(0.08_0.02_250)] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-[var(--shadow-modal)] p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.forgotPassword')}</h1>
        <p className="text-sm text-gray-500 mb-8">Enter your email and we will send a reset link.</p>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <FormField label={t('auth.email')} error={errors.email?.message} required>
            <Input type="email" placeholder="you@company.com" {...register('email')} />
          </FormField>
          <Button type="submit" className="w-full" size="lg" loading={mutation.isPending}>{t('auth.sendResetLink')}</Button>
        </form>
        <Link to="/login" className="mt-4 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" />{t('auth.backToLogin')}</Link>
      </div>
    </div>
  )
}
