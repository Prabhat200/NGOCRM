import { Link } from 'react-router-dom'
import { Users, FileText, ArrowRight } from 'lucide-react'
import type { GroupListItem } from '../types/group.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'

interface GroupTableProps {
  groups: GroupListItem[]
}

export function GroupTable({ groups }: GroupTableProps) {
  const typeLabels: Record<string, string> = {
    committee: 'Committee',
    department: 'Department',
    team: 'Team',
    custom: 'Custom Group',
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-3 px-4">Group / Committee</th>
            <th className="py-3 px-4">Type</th>
            <th className="py-3 px-4">Members</th>
            <th className="py-3 px-4">Documents</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {groups.map((group) => (
            <tr
              key={group.id}
              className="hover:bg-slate-50/80 transition-colors group focus-within:bg-slate-50/80"
            >
              {/* Group Name & Description */}
              <td className="py-3 px-4">
                <Link
                  to={`/groups/${group.id}`}
                  className="block group-hover:text-blue-600 focus-visible:outline-none"
                >
                  <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {group.name}
                  </p>
                  {group.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {group.description}
                    </p>
                  )}
                </Link>
              </td>

              {/* Type */}
              <td className="py-3 px-4">
                <Badge variant="outline" className="text-[11px] font-medium bg-slate-50">
                  {typeLabels[group.type] || group.type}
                </Badge>
              </td>

              {/* Members Count */}
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{group.member_count}</span>
                </span>
              </td>

              {/* Documents Count */}
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>{group.document_count}</span>
                </span>
              </td>

              {/* Status */}
              <td className="py-3 px-4">
                <StatusBadge status={group.is_active ? 'active' : 'inactive'} />
              </td>

              {/* Actions */}
              <td className="py-3 px-4 text-right">
                <Link
                  to={`/groups/${group.id}`}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <span>View</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
