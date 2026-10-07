import { Link } from 'react-router-dom'
import { Users, FileText, ArrowRight } from 'lucide-react'
import type { GroupListItem } from '../types/group.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'

interface GroupCardProps {
  group: GroupListItem
}

export function GroupCard({ group }: GroupCardProps) {
  const typeLabels: Record<string, string> = {
    committee: 'Committee',
    department: 'Department',
    team: 'Team',
    custom: 'Custom Group',
  }

  return (
    <Link
      to={`/groups/${group.id}`}
      className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
            {group.name}
          </h2>
          <Badge variant="secondary" className="text-[10px] uppercase font-semibold tracking-wider">
            {typeLabels[group.type] || group.type}
          </Badge>
        </div>
        <StatusBadge status={group.is_active ? 'active' : 'inactive'} />
      </div>

      {group.description && (
        <p className="text-xs text-slate-600 line-clamp-2">{group.description}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{group.member_count} {group.member_count === 1 ? 'member' : 'members'}</span>
          </span>

          <span className="inline-flex items-center gap-1 text-slate-500">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{group.document_count} {group.document_count === 1 ? 'doc' : 'docs'}</span>
          </span>
        </div>

        <span className="inline-flex items-center gap-1 text-slate-500 group-hover:text-blue-600 font-medium text-[11px]">
          <span>View group</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  )
}
