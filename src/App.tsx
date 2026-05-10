import React, { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router'
import { queryClient } from './lib/queryClient'
import { applyLanguage } from './lib/i18n'
import './lib/i18n'

export default function App() {
  useEffect(() => {
    const lang = localStorage.getItem('i18nextLng') ?? 'en'
    applyLanguage(lang.startsWith('ar') ? 'ar' : 'en')
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sans)',
            fontSize: '14px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          },
          duration: 3500,
        }}
        richColors
      />
    </QueryClientProvider>
  )
}
