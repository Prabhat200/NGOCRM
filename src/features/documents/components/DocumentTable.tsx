import { Link } from 'react-router-dom'
import { Star, ChevronRight } from 'lucide-react'
import type { DocumentListItem } from '../types/document.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentAccessBadge } from './DocumentAccessBadge'
import { getFileTypeInfo, formatFileSize } from '../utils/fileTypes'
import { formatDate } from '@/lib/utils/dateTime'

export interface DocumentTableProps {
  documents: DocumentListItem[]
  onToggleFavorite: (id: string) => void
  timezone?: string
}

export function DocumentTable({
  documents,
  onToggleFavorite,
  timezone,
}: DocumentTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left text-xs" aria-label="Documents Archive Table">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th scope="col" className="w-8 py-3.5 pl-4 pr-1 text-center">
              <span className="sr-only">Favorite</span>
            </th>
            <th scope="col" className="py-3.5 px-3">
              Document
            </th>
            <th scope="col" className="py-3.5 px-3">
              Category
            </th>
            <th scope="col" className="py-3.5 px-3">
              Occasion
            </th>
            <th scope="col" className="py-3.5 px-3">
              Document Date
            </th>
            <th scope="col" className="py-3.5 px-3">
              Status
            </th>
            <th scope="col" className="py-3.5 px-3">
              Access
            </th>
            <th scope="col" className="py-3.5 px-3">
              Updated
            </th>
            <th scope="col" className="py-3.5 pr-4 pl-2 text-right">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {documents.map((doc) => {
            const fileInfo = getFileTypeInfo(doc.mime_type, doc.title)
            const Icon = fileInfo.icon

            return (
              <tr
                key={doc.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Favorite Star Button */}
                <td className="py-3 pl-4 pr-1 text-center align-middle">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(doc.id)
                    }}
                    className={`p-1 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
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
                </td>

                {/* Title & Metadata */}
                <td className="py-3 px-3 max-w-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${fileInfo.bgClass} ${fileInfo.colorClass}`}
                      aria-hidden="true"
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/documents/${doc.id}`}
                        className="font-semibold text-slate-900 group-hover:text-blue-700 hover:underline truncate block text-xs"
                      >
                        {doc.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        {doc.document_number && <span>#{doc.document_number}</span>}
                        {doc.file_size && (
                          <>
                            {doc.document_number && <span>&bull;</span>}
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
                </td>

                {/* Category */}
                <td className="py-3 px-3 text-slate-700 font-medium">
                  {doc.category_name || <span className="text-slate-400">—</span>}
                </td>

                {/* Occasion */}
                <td className="py-3 px-3 text-slate-600 truncate max-w-[160px]">
                  {doc.occasion_name || <span className="text-slate-400">—</span>}
                </td>

                {/* Document Date */}
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  {doc.document_date ? formatDate(doc.document_date, timezone) : <span className="text-slate-400">—</span>}
                </td>

                {/* Status */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <StatusBadge status={doc.status} />
                </td>

                {/* Access Mode */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <DocumentAccessBadge accessMode={doc.access_mode} />
                </td>

                {/* Updated Date */}
                <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                  {formatDate(doc.updated_at, timezone)}
                </td>

                {/* Detail Chevron Link */}
                <td className="py-3 pr-4 pl-2 text-right">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="p-1 rounded-md text-slate-400 hover:text-blue-700 group-hover:translate-x-0.5 transition-all inline-flex items-center"
                    aria-label={`View details for ${doc.title}`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
