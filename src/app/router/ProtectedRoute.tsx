import { type ReactNode } from 'react'
import { Navigate, useLocation, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/context'
import { AuthLoadingScreen } from '@/features/auth/components/AuthLoadingScreen'
import { AccountStatusScreen } from '@/features/auth/components/AccountStatusScreen'
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage'

export interface ProtectedRouteProps {
  requiredPermission?: string
  children?: ReactNode
}

export function ProtectedRoute({ requiredPermission, children }: ProtectedRouteProps) {
  const { isLoading, session, user, accountStatus, hasPermission } = useAuth()
  const location = useLocation()

  // 1. Initial application bootstrap loading state
  if (isLoading) {
    return <AuthLoadingScreen />
  }

  // 2. Unauthenticated user redirect to login with safe return target
  if (!session || !user) {
    const returnTarget = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirectTo=${returnTarget}`} replace />
  }

  // 3. Authenticated user but inactive account state (invited, suspended, disabled, missing_profile)
  if (accountStatus !== 'active') {
    return <AccountStatusScreen status={accountStatus || 'missing_profile'} />
  }

  // 4. Permission-restricted route guard
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedPage />
  }

  // 5. User authorized: render content or sub-routes
  return children ? <>{children}</> : <Outlet />
}
