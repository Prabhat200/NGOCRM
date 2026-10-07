import { useState } from 'react'
import { useAuth } from '@/features/auth/context'
import { useActivityLogs } from '../hooks/useActivity'
import { ActivityFilters } from '../components/ActivityFilters'
import { ActivityItem } from '../components/ActivityItem'
import { ActivitySkeleton } from '../components/ActivitySkeleton'
import { ActivityFilters as ActivityFiltersType } from '../types/activity.types'
import { Activity, ChevronLeft, ChevronRight, AlertCircle, ShieldAlert } from 'lucide-react'

export function ActivityPage() {
  const { hasPermission, organization } = useAuth()
  const canViewAudit = hasPermission('audit.view')

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ActivityFiltersType>({
    category: 'all',
    search: '',
  })

  const { data, isLoading, isError, error } = useActivityLogs({
    ...filters,
    page,
    pageSize: 25,
  })

  // Permission guard check (also strictly enforced by RLS)
  if (!canViewAudit) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          You do not have the required permissions (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-rose-700">audit.view</code>) to view the organizational audit history.
        </p>
      </div>
    )
  }

  const handleFiltersChange = (newFilters: ActivityFiltersType) => {
    setFilters(newFilters)
    setPage(1) // Reset to page 1 on filter change
  }

  const timezone = organization?.timezone || 'Asia/Kathmandu'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
              <Activity className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit & Activity Log</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Organizational audit history across documents, members, events, and settings.
              </p>
            </div>
          </div>
        </div>

        {data && (
          <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shadow-2xs self-start sm:self-auto">
            Total records: <span className="font-semibold text-slate-800">{data.totalCount}</span>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <ActivityFilters filters={filters} onChange={handleFiltersChange} />

      {/* Main Content List */}
      {isLoading ? (
        <ActivitySkeleton />
      ) : isError ? (
        <div className="p-8 text-center bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-900">We couldn't load the activity history.</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'Please check your connection and try again.'}
          </p>
        </div>
      ) : !data || data.logs.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            {filters.category !== 'all' || filters.search || filters.startDate
              ? 'No matching activities found'
              : 'No activity yet'}
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {filters.category !== 'all' || filters.search || filters.startDate
              ? 'Try adjusting your filters or search keywords to find activity records.'
              : 'Important changes to documents, members and settings will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2.5">
            {data.logs.map((log) => (
              <ActivityItem key={log.id} log={log} timezone={timezone} />
            ))}
          </div>

          {/* Pagination Controls */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 text-xs text-slate-600">
              <div>
                Showing page <span className="font-medium text-slate-900">{data.page}</span> of{' '}
                <span className="font-medium text-slate-900">{data.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
