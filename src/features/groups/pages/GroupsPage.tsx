import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Search, AlertCircle, RotateCcw } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { GroupTable } from '../components/GroupTable'
import { GroupCard } from '../components/GroupCard'
import { CreateGroupDialog } from '../components/CreateGroupDialog'
import { useGroups } from '../hooks/useGroups'
import type { GroupFiltersState } from '../types/group.types'

export function GroupsPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('groups.create')

  const [filters, setFilters] = useState<GroupFiltersState>({
    viewTab: 'all',
    page: 1,
    pageSize: 20,
    search: '',
  })

  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const { data, isLoading, isError, refetch } = useGroups(filters)
  const groups = data?.groups || []

  const isFiltered = Boolean(filters.search || filters.type)

  return (
    <div className="space-y-6">
      {/* Header (Rule 29) */}
      <PageHeader
        title="Groups & Committees"
        description="Organize members into committees, departments and teams."
        primaryAction={
          canCreate ? (
            <Button
              type="button"
              onClick={() => setShowCreateDialog(true)}
              className="h-9 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Group</span>
            </Button>
          ) : undefined
        }
      />

      {/* View Tabs: Active vs Archived */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setFilters((f) => ({ ...f, viewTab: 'all', page: 1 }))}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            filters.viewTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Active Groups & Committees
        </button>
        <button
          type="button"
          onClick={() => setFilters((f) => ({ ...f, viewTab: 'archived', page: 1 }))}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            filters.viewTab === 'archived'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Archived Groups
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search groups by name or description..."
            value={filters.search || ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
            className="pl-9 text-xs h-9 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filters.type || 'all'}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                type: e.target.value === 'all' ? undefined : (e.target.value as any),
                page: 1,
              }))
            }
            aria-label="Filter by Type"
            className="h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="committee">Committee</option>
            <option value="department">Department</option>
            <option value="team">Team</option>
            <option value="custom">Custom Group</option>
          </select>

          {isFiltered && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setFilters({
                  viewTab: filters.viewTab,
                  page: 1,
                  pageSize: 20,
                  search: '',
                })
              }
              className="h-9 px-2 text-xs text-slate-500 hover:text-slate-900 gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-rose-800">We couldn't load the groups.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-8">
            Retry
          </Button>
        </div>
      ) : groups.length === 0 ? (
        isFiltered ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">No groups match your search</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try changing your search query or type filter.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFilters((f) => ({ ...f, search: '', type: undefined, page: 1 }))}
              className="text-xs h-8"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          /* Empty Groups State (Rule 61) */
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <div>
              <h3 className="text-base font-bold text-slate-900">No groups or committees yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Create a committee, department or team to organize members.
              </p>
            </div>
            {canCreate && (
              <Button
                type="button"
                onClick={() => setShowCreateDialog(true)}
                className="h-9 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Group</span>
              </Button>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <GroupTable groups={groups} />
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateDialog && (
        <CreateGroupDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={(newId) => {
            setShowCreateDialog(false)
            navigate(`/groups/${newId}`)
          }}
        />
      )}
    </div>
  )
}
