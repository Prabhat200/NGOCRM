import { type ReactNode } from 'react'
import { Navigate, useSearchParams, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context'
import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen'

export interface PublicRouteProps {
  children?: ReactNode
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isLoading, isAuthenticated } = useAuth()
  const [searchParams] = useSearchParams()

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  // If already authenticated and active, redirect away from public auth pages
  if (isAuthenticated) {
    const rawRedirect = searchParams.get('redirectTo')
    const safeRedirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/'

    return <Navigate to={safeRedirect} replace />
  }

  return children ? <>{children}</> : <Outlet />
}
