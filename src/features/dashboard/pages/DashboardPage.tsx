import { useAuth } from '@/features/auth/context'
import { DashboardHeader } from '../components/DashboardHeader'
import { DashboardSummaryCards } from '../components/DashboardSummaryCards'
import { DashboardQuickActions } from '../components/DashboardQuickActions'
import { RecentDocumentsSection } from '../components/RecentDocumentsSection'
import { RecentOccasionsSection } from '../components/RecentOccasionsSection'
import { RecentActivitySection } from '../components/RecentActivitySection'

export function DashboardPage() {
  const { hasPermission } = useAuth()

  const canViewDocs = hasPermission('documents.view')
  const canViewOccasions = hasPermission('occasions.view')
  const canViewAudit = hasPermission('audit.view')

  return (
    <div className="space-y-6">
      {/* Timezone-aware Welcome Header */}
      <DashboardHeader />

      {/* RLS-respecting Metric Summary Cards */}
      <DashboardSummaryCards />

      {/* Permission-gated Quick Operations */}
      <DashboardQuickActions />

      {/* Recent Records Split Grid (Desktop 2-col, Mobile stacked) */}
      {(canViewDocs || canViewOccasions) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {canViewDocs && <RecentDocumentsSection />}
          {canViewOccasions && <RecentOccasionsSection />}
        </div>
      )}

      {/* Organization Audit Activity Stream (requires audit.view) */}
      {canViewAudit && <RecentActivitySection />}
    </div>
  )
}
