import { Link } from 'react-router-dom'
import { Calendar, MapPin, FileText, Users, ArrowUpRight } from 'lucide-react'
import type { OccasionListItem } from '../types/occasion.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatDate } from '@/lib/utils/dateTime'

interface OccasionTableProps {
  occasions: OccasionListItem[]
  timezone?: string
}

export function OccasionTable({ occasions, timezone }: OccasionTableProps) {
  const formatDates = (start: string | null, end: string | null) => {
    if (!start && !end) return '—'
    if (start && !end) return formatDate(start, timezone)
    if (!start && end) return formatDate(end, timezone)
    if (start === end) return formatDate(start, timezone)
    return `${formatDate(start, timezone)} – ${formatDate(end, timezone)}`
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <th scope="col" className="py-3 px-4">
              Occasion
            </th>
            <th scope="col" className="py-3 px-4">
              Type
            </th>
            <th scope="col" className="py-3 px-4">
              Date
            </th>
            <th scope="col" className="py-3 px-4">
              Location
            </th>
            <th scope="col" className="py-3 px-4">
              Status
            </th>
            <th scope="col" className="py-3 px-4 text-center">
              Docs
            </th>
            <th scope="col" className="py-3 px-4 text-center">
              People
            </th>
            <th scope="col" className="py-3 px-4 text-right">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {occasions.map((occ) => (
            <tr
              key={occ.id}
              className="hover:bg-slate-50/75 transition-colors group cursor-pointer"
            >
              {/* Name & description */}
              <td className="py-3.5 px-4 font-medium text-slate-900 max-w-xs">
                <Link
                  to={`/occasions/${occ.id}`}
                  className="block group-hover:text-blue-700 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
                >
                  <span className="line-clamp-1">{occ.name}</span>
                  {occ.description && (
                    <span className="block text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                      {occ.description}
                    </span>
                  )}
                </Link>
              </td>

              {/* Type */}
              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                {occ.type_name ? (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{occ.type_name}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>

              {/* Date */}
              <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                {formatDates(occ.start_date, occ.end_date)}
              </td>

              {/* Location */}
              <td className="py-3.5 px-4 text-slate-600 max-w-[160px] truncate">
                {occ.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{occ.location}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>

              {/* Status */}
              <td className="py-3.5 px-4 whitespace-nowrap">
                <StatusBadge status={occ.status} />
              </td>

              {/* Documents count (Rule 21 & 22) */}
              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{occ.document_count}</span>
                </span>
              </td>

              {/* Participants count */}
              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{occ.member_count}</span>
                </span>
              </td>

              {/* Action */}
              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                <Link
                  to={`/occasions/${occ.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 rounded p-1"
                >
                  <span>Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
