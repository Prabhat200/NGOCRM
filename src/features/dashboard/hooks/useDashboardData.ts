import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/context'
import { dashboardService } from '../services/dashboard.service'

export function useDashboardCounts() {
  const { permissions, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['dashboard', 'counts', Array.from(permissions).sort()],
    queryFn: () => dashboardService.fetchCounts(permissions),
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useRecentDocuments(limit = 5) {
  const { isAuthenticated, hasPermission } = useAuth()
  const canView = hasPermission('documents.view')

  return useQuery({
    queryKey: ['dashboard', 'recent-documents', limit],
    queryFn: () => dashboardService.fetchRecentDocuments(limit),
    enabled: isAuthenticated && canView,
    staleTime: 45 * 1000,
  })
}

export function useRecentOccasions(limit = 5) {
  const { isAuthenticated, hasPermission } = useAuth()
  const canView = hasPermission('occasions.view')

  return useQuery({
    queryKey: ['dashboard', 'recent-occasions', limit],
    queryFn: () => dashboardService.fetchRecentOccasions(limit),
    enabled: isAuthenticated && canView,
    staleTime: 45 * 1000,
  })
}

export function useRecentActivity(limit = 6) {
  const { isAuthenticated, hasPermission } = useAuth()
  const canView = hasPermission('audit.view')

  return useQuery({
    queryKey: ['dashboard', 'recent-activity', limit],
    queryFn: () => dashboardService.fetchRecentActivity(limit),
    enabled: isAuthenticated && canView,
    staleTime: 30 * 1000,
  })
}

export function useUnreadNotificationsCount() {
  const { user, isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: () => dashboardService.fetchUnreadNotificationsCount(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Background refresh
  })
}
