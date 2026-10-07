import { Link } from 'react-router-dom'
import { Users, ArrowRight } from 'lucide-react'
import type { MemberListItem } from '../types/member.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PortalAccessBadge } from './PortalAccessBadge'
import { getInitials } from '@/lib/utils/nameFormatter'

interface MemberCardProps {
  member: MemberListItem
  canViewSensitive?: boolean
}

export function MemberCard({ member, canViewSensitive = false }: MemberCardProps) {
  const initials = getInitials(member.full_name)

  return (
    <Link
      to={`/members/${member.id}`}
      className="block p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs transition-all space-y-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
              {member.full_name}
            </h2>
            {member.position_title && (
              <p className="text-xs text-slate-600 font-medium truncate">{member.position_title}</p>
            )}
            {canViewSensitive && member.membership_number && (
              <p className="text-[11px] text-slate-400 font-mono">#{member.membership_number}</p>
            )}
          </div>
        </div>

        <StatusBadge status={member.status} />
      </div>

      {/* Groups & Committees */}
      {member.groups && member.groups.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-0.5" />
          {member.groups.map((g) => (
            <span
              key={g.group_id}
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
            >
              {g.group_name}
              {g.role_in_group && (
                <span className="ml-1 text-slate-500 font-normal">({g.role_in_group})</span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Portal Access & View Details */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <PortalAccessBadge status={member.portal_status} />
        <span className="inline-flex items-center gap-1 text-slate-500 group-hover:text-blue-600 font-medium text-[11px]">
          <span>View profile</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  )
}
