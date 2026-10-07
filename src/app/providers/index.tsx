import { type ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { ToastProvider } from '@/components/ui/toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { AuthProvider } from '@/features/auth/context'

export interface AppProvidersProps {
  children: ReactNode
}

/**
 * Top-level application providers composition.
 *
 * Includes:
 * - ErrorBoundary (Application-wide error fallback)
 * - QueryClientProvider (TanStack Query server-state management)
 * - ToastProvider (Action feedback system)
 * - AuthProvider (Supabase session, profile, organization, permissions)
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
