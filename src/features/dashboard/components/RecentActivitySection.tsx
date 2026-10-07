import { Link } from 'react-router-dom'
import { Activity, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { useRecentActivity } from '../hooks/useDashboardData'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatActivityAction, extractActivityTarget } from '../utils/activityFormatter'
import { formatRelativeTime } from '@/lib/utils/dateTime'

export function RecentActivitySection() {
  const { data: activities, isLoading, isError, refetch } = useRecentActivity(6)

  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-slate-900">
            Recent Activity
          </CardTitle>
        </div>
        <Link
          to="/activity"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <span>View audit log</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-2.5">
                <div className="space-y-1.5 flex-1 pr-4">
                  <Skeleton className="h-3.5 w-1/2 rounded" />
                  <Skeleton className="h-3 w-1/4 rounded" />
                </div>
                <Skeleton className="h-3 w-14 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-6 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" aria-hidden="true" />
            <p className="text-xs text-slate-600">We couldn&apos;t load recent activity logs.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500">
            <Activity className="w-6 h-6 text-slate-300 mx-auto mb-2" aria-hidden="true" />
            No organizational activity recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activities.map((item) => {
              const actionText = formatActivityAction(item.action)
              const target = extractActivityTarget(item.metadata)

              return (
                <div
                  key={item.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 leading-relaxed">
                      <span className="font-semibold text-slate-900">
                        {item.actor_name || 'Staff Member'}
                      </span>{' '}
                      <span className="text-slate-600">{actionText}</span>
                      {target && (
                        <span className="font-medium text-slate-900 ml-1">
                          &ldquo;{target}&rdquo;
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    <span>{formatRelativeTime(item.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
