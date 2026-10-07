import { Link } from 'react-router-dom'
import { Plus, FileText, ArrowRight } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { useDocuments } from '@/features/documents/hooks/useDocuments'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentAccessBadge } from '@/features/documents/components/DocumentAccessBadge'
import { getFileTypeInfo, formatFileSize } from '@/features/documents/utils/fileTypes'
import { formatDate } from '@/lib/utils/dateTime'

interface OccasionDocumentsProps {
  occasionId: string
  occasionName: string
}

export function OccasionDocuments({ occasionId, occasionName }: OccasionDocumentsProps) {
  const { hasPermission, organization } = useAuth()
  const canCreateDoc = hasPermission('documents.create')

  // Query documents specifically for this occasion (Rule 21: naturally passes document RLS)
  const { data, isLoading } = useDocuments({
    occasionId,
    viewTab: 'all',
    page: 1,
    pageSize: 50,
  })

  const documents = data?.documents || []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900">
            Associated Records & Documents
          </CardTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Files, notices, agendas, and minutes filed for this occasion.
          </p>
        </div>

        {canCreateDoc && (
          <Link
            to={`/documents/new?occasion=${occasionId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Add Document</span>
          </Link>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-slate-100 flex items-center justify-between"
              >
                <div className="space-y-1.5 flex-1 pr-4">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/4 rounded" />
                </div>
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">No documents linked yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-0.5">
                Upload notices, minutes, agendas, or attendance sheets for {occasionName}.
              </p>
            </div>
            {canCreateDoc && (
              <div className="pt-2">
                <Link
                  to={`/documents/new?occasion=${occasionId}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Document into Occasion</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => {
              const fileInfo = getFileTypeInfo(doc.mime_type, doc.title)
              const FileIcon = fileInfo.icon

              return (
                <div
                  key={doc.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${fileInfo.bgClass} ${fileInfo.colorClass}`}
                      aria-hidden="true"
                    >
                      <FileIcon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="block text-xs font-semibold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1"
                      >
                        {doc.title}
                      </Link>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        {doc.category_name && (
                          <span className="font-medium text-slate-600">
                            {doc.category_name}
                          </span>
                        )}
                        {doc.file_size && (
                          <>
                            <span>&bull;</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </>
                        )}
                        {doc.current_version_number && (
                          <>
                            <span>&bull;</span>
                            <span className="font-mono text-slate-500">
                              v{doc.current_version_number}
                            </span>
                          </>
                        )}
                        <span>&bull;</span>
                        <span>{formatDate(doc.updated_at, organization?.timezone)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    <StatusBadge status={doc.status} />
                    <DocumentAccessBadge accessMode={doc.access_mode} />
                    <Link
                      to={`/documents/${doc.id}`}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors ml-1"
                      aria-label={`View ${doc.title}`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
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
