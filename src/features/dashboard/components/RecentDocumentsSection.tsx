import { Link } from 'react-router-dom'
import { FileText, ArrowRight, Upload, Calendar, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { useRecentDocuments } from '../hooks/useDashboardData'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/dateTime'

export function RecentDocumentsSection() {
  const { hasPermission, organization } = useAuth()
  const { data: documents, isLoading, isError, refetch } = useRecentDocuments(5)

  const canUpload = hasPermission('documents.create')

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-5 h-5 text-slate-500" aria-hidden="true" />
          <CardTitle className="text-lg font-bold text-slate-900">
            Recent Documents
          </CardTitle>
        </div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          <span>View all</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="space-y-3 py-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100">
                <div className="space-y-1.5 flex-1 pr-4">
                  <Skeleton className="h-5 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/3 rounded" />
                </div>
                <Skeleton className="h-6 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-6 text-center space-y-2">
            <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" aria-hidden="true" />
            <p className="text-sm text-slate-600">We couldn&apos;t load recent documents.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : !documents || documents.length === 0 ? (
          <div className="py-8 text-center space-y-3.5 my-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">No documents yet</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Upload your first document to start building the organization archive.
              </p>
            </div>
            {canUpload && (
              <div className="pt-1.5">
                <Link
                  to="/documents/new"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Upload className="w-4 h-4 mr-2" aria-hidden="true" />
                  Upload Document
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="block text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 rounded"
                  >
                    {doc.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                    {doc.category_name && (
                      <span className="font-medium text-slate-600">
                        {doc.category_name}
                      </span>
                    )}
                    {doc.occasion_name && (
                      <span className="inline-flex items-center gap-1 text-slate-400 truncate max-w-[150px]">
                        <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">{doc.occasion_name}</span>
                      </span>
                    )}
                    <span>&bull;</span>
                    <span>{formatDate(doc.updated_at, organization?.timezone)}</span>
                  </div>
                </div>
                <div className="shrink-0 mt-0.5">
                  <StatusBadge status={doc.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
