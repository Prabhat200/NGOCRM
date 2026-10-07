import { Link } from 'react-router-dom'
import { Calendar, MapPin, FileText, Users } from 'lucide-react'
import type { OccasionListItem } from '../types/occasion.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/dateTime'

interface OccasionCardProps {
  occasion: OccasionListItem
  timezone?: string
}

export function OccasionCard({ occasion, timezone }: OccasionCardProps) {
  const formatDates = (start: string | null, end: string | null) => {
    if (!start && !end) return null
    if (start && !end) return formatDate(start, timezone)
    if (!start && end) return formatDate(end, timezone)
    if (start === end) return formatDate(start, timezone)
    return `${formatDate(start, timezone)} – ${formatDate(end, timezone)}`
  }

  const dateStr = formatDates(occasion.start_date, occasion.end_date)

  return (
    <Link
      to={`/occasions/${occasion.id}`}
      className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1">
            {occasion.name}
          </h2>
          {occasion.type_name && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{occasion.type_name}</span>
            </span>
          )}
        </div>
        <StatusBadge status={occasion.status} />
      </div>

      {occasion.description && (
        <p className="text-xs text-slate-600 line-clamp-2">{occasion.description}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1 border-t border-slate-100">
        {dateStr && (
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <span>{dateStr}</span>
          </span>
        )}

        {occasion.location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[140px]">{occasion.location}</span>
          </span>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{occasion.document_count}</span>
          </span>

          <span className="inline-flex items-center gap-1 font-medium text-slate-600">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{occasion.member_count}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
