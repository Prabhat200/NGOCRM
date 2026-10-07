import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, Plus, MapPin, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { useRecentOccasions } from '../hooks/useDashboardData'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/dateTime'

export function RecentOccasionsSection() {
  const { hasPermission, organization } = useAuth()
  const { data: occasions, isLoading, isError, refetch } = useRecentOccasions(5)

  const canCreate = hasPermission('occasions.create')

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-slate-900">
            Recent / Upcoming Occasions
          </CardTitle>
        </div>
        <Link
          to="/occasions"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <span>View all</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="space-y-3 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                <div className="space-y-1.5 flex-1 pr-4">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/3 rounded" />
                </div>
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-6 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-500 mx-auto" aria-hidden="true" />
            <p className="text-xs text-slate-600">We couldn&apos;t load recent occasions.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !occasions || occasions.length === 0 ? (
          <div className="py-8 text-center space-y-3 my-auto">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Calendar className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-700">No occasions scheduled</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">
                Record meetings, assemblies, workshops, or organizational events.
              </p>
            </div>
            {canCreate && (
              <div className="pt-1">
                <Link
                  to="/occasions/new"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
                  Create Occasion
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {occasions.map((occ) => (
              <div
                key={occ.id}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/occasions/${occ.id}`}
                    className="block text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 rounded"
                  >
                    {occ.name}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                    {occ.type_name && (
                      <span className="font-medium text-slate-600">
                        {occ.type_name}
                      </span>
                    )}
                    {occ.start_date && (
                      <span>{formatDate(occ.start_date, organization?.timezone)}</span>
                    )}
                    {occ.location && (
                      <span className="inline-flex items-center gap-1 text-slate-400 truncate max-w-[150px]">
                        <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{occ.location}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 mt-0.5">
                  <StatusBadge status={occ.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
