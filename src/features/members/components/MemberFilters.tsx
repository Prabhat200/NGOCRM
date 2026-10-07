import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MemberFiltersState, PortalStatus } from '../types/member.types'

interface MemberFiltersProps {
  filters: MemberFiltersState
  onChange: (filters: MemberFiltersState) => void
  groups?: Array<{ id: string; name: string }>
  className?: string
}

export function MemberFilters({ filters, onChange, groups = [], className }: MemberFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.status) ||
    Boolean(filters.groupId) ||
    Boolean(filters.portalStatus) ||
    Boolean(filters.position)

  const handleReset = () => {
    onChange({
      ...filters,
      status: undefined,
      groupId: undefined,
      portalStatus: undefined,
      position: undefined,
      page: 1,
    })
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className || ''}`}>
      {/* Status Filter */}
      <select
        value={filters.status || 'all'}
        onChange={(e) =>
          onChange({
            ...filters,
            status: e.target.value === 'all' ? undefined : (e.target.value as any),
            page: 1,
          })
        }
        aria-label="Filter by Status"
        className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
      >
        <option value="all">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="suspended">Suspended</option>
        <option value="former">Former Member</option>
      </select>

      {/* Group / Committee Filter */}
      {groups.length > 0 && (
        <select
          value={filters.groupId || 'all'}
          onChange={(e) =>
            onChange({
              ...filters,
              groupId: e.target.value === 'all' ? undefined : e.target.value,
              page: 1,
            })
          }
          aria-label="Filter by Group"
          className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent max-w-[180px] truncate cursor-pointer"
        >
          <option value="all">All Groups</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      )}

      {/* Portal Access Filter */}
      <select
        value={filters.portalStatus || 'all'}
        onChange={(e) =>
          onChange({
            ...filters,
            portalStatus: e.target.value === 'all' ? undefined : (e.target.value as PortalStatus),
            page: 1,
          })
        }
        aria-label="Filter by Portal Access"
        className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
      >
        <option value="all">All Portal Access</option>
        <option value="active">Portal Active</option>
        <option value="invited">Invited</option>
        <option value="no_access">No Portal Access</option>
        <option value="suspended">Portal Suspended</option>
        <option value="disabled">Portal Disabled</option>
      </select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-9 px-2.5 text-xs text-slate-500 hover:text-slate-900 gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </Button>
      )}
    </div>
  )
}
