import { Link } from 'react-router-dom'
import { FilePlus2, CalendarPlus, UserPlus } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function DashboardQuickActions() {
  const { hasPermission } = useAuth()

  const canUploadDoc = hasPermission('documents.create')
  const canCreateOccasion = hasPermission('occasions.create')
  const canAddMember = hasPermission('members.create')

  const hasAnyAction = canUploadDoc || canCreateOccasion || canAddMember
  if (!hasAnyAction) return null

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3.5">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {canUploadDoc && (
            <Link
              to="/documents/new"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FilePlus2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-base font-bold text-slate-900 group-hover:text-blue-900 leading-snug">
                  Upload Document
                </span>
                <span className="block text-sm text-slate-500 mt-0.5">
                  Add archival record
                </span>
              </div>
            </Link>
          )}

          {canCreateOccasion && (
            <Link
              to="/occasions/new"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <CalendarPlus className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-base font-bold text-slate-900 group-hover:text-emerald-900 leading-snug">
                  Create Occasion
                </span>
                <span className="block text-sm text-slate-500 mt-0.5">
                  Schedule event or meeting
                </span>
              </div>
            </Link>
          )}

          {canAddMember && (
            <Link
              to="/members/new"
              className="flex items-center gap-3.5 p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <UserPlus className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="block text-base font-bold text-slate-900 group-hover:text-purple-900 leading-snug">
                  Add Member
                </span>
                <span className="block text-sm text-slate-500 mt-0.5">
                  Register organizational member
                </span>
              </div>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
