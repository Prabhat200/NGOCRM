import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Sensible caching: keep data fresh for 2 minutes to prevent hammering Supabase
      staleTime: 1000 * 60 * 2,
      // Retain unused cache for 10 minutes
      gcTime: 1000 * 60 * 10,
      // Avoid excessive refetching on window focus for calm administrative UX
      refetchOnWindowFocus: false,
      // Retry once on failure, but don't loop endlessly on 401/403 RLS rejections
      retry: (failureCount, error) => {
        if (failureCount >= 1) return false
        // Don't retry client-side unauthorized / permission errors
        const message = error instanceof Error ? error.message.toLowerCase() : ''
        if (message.includes('401') || message.includes('403') || message.includes('permission')) {
          return false
        }
        return true
      },
    },
    mutations: {
      retry: false,
    },
  },
})
