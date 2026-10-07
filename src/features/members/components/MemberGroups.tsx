import { Link } from 'react-router-dom'
import { Users, ArrowRight, Shield } from 'lucide-react'
import type { MemberGroupAssociation } from '../types/member.types'

interface MemberGroupsProps {
  groups: MemberGroupAssociation[]
}

export function MemberGroups({ groups }: MemberGroupsProps) {
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <h4 className="text-xs font-semibold text-slate-700">No Committee Memberships</h4>
        <p className="text-xs text-slate-400 mt-1">
          This member is not currently assigned to any committees, departments, or teams.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {groups.map((g) => (
        <div
          key={g.group_id}
          className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {g.group_name}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <Shield className="w-3 h-3 text-slate-400" />
                <span>{g.role_in_group || 'Member'}</span>
              </div>
            </div>
          </div>

          <Link
            to={`/groups/${g.group_id}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <span>View Group</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      ))}
    </div>
  )
}
