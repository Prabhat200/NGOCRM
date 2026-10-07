import { Link } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Mail } from 'lucide-react'
import type { MemberListItem } from '../types/member.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PortalAccessBadge } from './PortalAccessBadge'
import { getInitials } from '@/lib/utils/nameFormatter'
import { Button } from '@/components/ui/button'

interface MemberTableProps {
  members: MemberListItem[]
  canViewSensitive?: boolean
  canInvite?: boolean
  onGivePortalAccess?: (member: MemberListItem) => void
}

export function MemberTable({
  members,
  canViewSensitive = false,
  canInvite = false,
  onGivePortalAccess,
}: MemberTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-3 px-4">Member</th>
            {canViewSensitive && <th className="py-3 px-4">Membership No.</th>}
            <th className="py-3 px-4">Position</th>
            <th className="py-3 px-4">Groups / Committees</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Portal Access</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {members.map((member) => {
            const initials = getInitials(member.full_name)
            return (
              <tr
                key={member.id}
                className="hover:bg-slate-50/80 transition-colors group focus-within:bg-slate-50/80"
              >
                {/* Member Info */}
                <td className="py-3 px-4">
                  <Link
                    to={`/members/${member.id}`}
                    className="flex items-center gap-3 group-hover:text-blue-600 focus-visible:outline-none"
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                        {member.full_name}
                      </p>
                      {canViewSensitive && member.email && (
                        <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                      )}
                    </div>
                  </Link>
                </td>

                {/* Membership No. (admin only) */}
                {canViewSensitive && (
                  <td className="py-3 px-4 font-mono text-slate-600">
                    {member.membership_number ? `#${member.membership_number}` : '—'}
                  </td>
                )}

                {/* Position */}
                <td className="py-3 px-4 text-slate-700 font-medium">
                  {member.position_title || '—'}
                </td>

                {/* Groups / Committees */}
                <td className="py-3 px-4">
                  {member.groups && member.groups.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                      {member.groups.map((g) => (
                        <span
                          key={g.group_id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {g.group_name}
                          {g.role_in_group && (
                            <span className="ml-1 text-slate-500 font-normal">
                              ({g.role_in_group})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <StatusBadge status={member.status} />
                </td>

                {/* Portal Access */}
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <PortalAccessBadge status={member.portal_status} />
                    {member.portal_roles && member.portal_roles.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>{member.portal_roles.map((r) => r.name).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canInvite && member.portal_status === 'no_access' && onGivePortalAccess && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onGivePortalAccess(member)}
                        className="h-8 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
                        title="Give Portal Access"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Invite</span>
                      </Button>
                    )}

                    <Link
                      to={`/members/${member.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
