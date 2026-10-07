import { FileText, Calendar, Users, Activity } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { useDashboardCounts } from '../hooks/useDashboardData'
import { StatCard } from './StatCard'

export function DashboardSummaryCards() {
  const { hasPermission } = useAuth()
  const { data: counts, isLoading } = useDashboardCounts()

  const canViewDocs = hasPermission('documents.view')
  const canViewOccasions = hasPermission('occasions.view')
  const canViewMembers = hasPermission('members.view')
  const canViewAudit = hasPermission('audit.view')

  // If user has access to no modules, don't render empty grid
  const hasAnyCard = canViewDocs || canViewOccasions || canViewMembers || canViewAudit
  if (!hasAnyCard) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {canViewDocs && (
        <StatCard
          title="Accessible Documents"
          value={counts?.documents}
          icon={FileText}
          href="/documents"
          linkLabel="View archive"
          isLoading={isLoading}
        />
      )}

      {canViewOccasions && (
        <StatCard
          title="Occasions & Events"
          value={counts?.occasions}
          icon={Calendar}
          href="/occasions"
          linkLabel="View occasions"
          isLoading={isLoading}
        />
      )}

      {canViewMembers && (
        <StatCard
          title="Organization Members"
          value={counts?.members}
          icon={Users}
          href="/members"
          linkLabel="View directory"
          isLoading={isLoading}
        />
      )}

      {canViewAudit && (
        <StatCard
          title="Logged Activities"
          value={counts?.activity}
          icon={Activity}
          href="/activity"
          linkLabel="View audit log"
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
