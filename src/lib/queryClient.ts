import { QueryClient } from '@tanstack/react-query'
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const e = error as { response?: { status?: number } }
        if (e?.response?.status === 401 || e?.response?.status === 403) return false
        return failureCount < 2
      },
      staleTime: 30_000, gcTime: 5 * 60_000, refetchOnWindowFocus: false,
    },
    mutations: { retry: 0 },
  },
})
