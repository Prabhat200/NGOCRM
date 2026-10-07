import { Link } from 'react-router-dom'
import { Star, Calendar, ChevronRight } from 'lucide-react'
import type { DocumentListItem } from '../types/document.types'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentAccessBadge } from './DocumentAccessBadge'
import { getFileTypeInfo, formatFileSize } from '../utils/fileTypes'
import { formatDate } from '@/lib/utils/dateTime'

export interface DocumentCardProps {
  document: DocumentListItem
  onToggleFavorite: (id: string) => void
  timezone?: string
}

export function DocumentCard({
  document: doc,
  onToggleFavorite,
  timezone,
}: DocumentCardProps) {
  const fileInfo = getFileTypeInfo(doc.mime_type, doc.title)
  const Icon = fileInfo.icon

  return (
    <Card className="hover:border-slate-300 transition-colors shadow-xs">
      <CardContent className="p-4 space-y-3">
        {/* Top Header: File Icon, Title, and Star */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${fileInfo.bgClass} ${fileInfo.colorClass} mt-0.5`}
              aria-hidden="true"
            >
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <Link
                to={`/documents/${doc.id}`}
                className="font-semibold text-slate-900 hover:text-blue-700 text-sm block leading-snug line-clamp-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 rounded"
              >
                {doc.title}
              </Link>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                {doc.category_name && (
                  <span className="font-medium text-slate-600 truncate max-w-[140px]">
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
                    <span className="font-mono text-[10px]">v{doc.current_version_number}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(doc.id)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
              doc.is_favorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 hover:text-slate-500'
            }`}
            aria-label={doc.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={`w-4 h-4 ${doc.is_favorite ? 'fill-amber-400' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Middle: Linked Occasion if any */}
        {doc.occasion_name && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="truncate">{doc.occasion_name}</span>
          </div>
        )}

        {/* Bottom Row: Status, Access, Date, and Detail link */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={doc.status} />
            <DocumentAccessBadge accessMode={doc.access_mode} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {formatDate(doc.document_date || doc.updated_at, timezone)}
            </span>
            <Link
              to={`/documents/${doc.id}`}
              className="p-1 text-slate-400 hover:text-blue-700 transition-colors"
              aria-label={`View details for ${doc.title}`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
