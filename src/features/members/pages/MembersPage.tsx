import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, AlertCircle, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MemberSearch } from '../components/MemberSearch'
import { MemberFilters } from '../components/MemberFilters'
import { MemberTable } from '../components/MemberTable'
import { MemberCard } from '../components/MemberCard'
import { GivePortalAccessDialog } from '../components/GivePortalAccessDialog'
import { useMembers } from '../hooks/useMembers'
import { useGroups } from '@/features/groups/hooks/useGroups'
import type { MemberFiltersState, MemberListItem } from '../types/member.types'

export function MembersPage() {
  const { hasPermission } = useAuth()
  const canCreate = hasPermission('members.create')
  const canEdit = hasPermission('members.edit')
  const canInvite = hasPermission('users.invite')

  const [filters, setFilters] = useState<MemberFiltersState>({
    viewTab: 'all',
    page: 1,
    pageSize: 20,
    search: '',
  })

  const [invitingMember, setInvitingMember] = useState<MemberListItem | null>(null)

  // Query members with privacy scoping (Rule 10, 11, 48)
  const { data, isLoading, isError, refetch } = useMembers(filters, canEdit)

  // Query active groups for filter dropdown
  const { data: groupsData } = useGroups({ viewTab: 'all', pageSize: 100 })
  const activeGroups = (groupsData?.groups || []).map((g) => ({ id: g.id, name: g.name }))

  const members = data?.members || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / (filters.pageSize || 20)) || 1

  const isFiltered = Boolean(
    filters.search || filters.status || filters.groupId || filters.portalStatus || filters.position
  )

  return (
    <div className="space-y-6">
      {/* Page Header (Rule 5) */}
      <PageHeader
        title="Members"
        description="Manage the organization's member directory."
        primaryAction={
          canCreate ? (
            <Link
              to="/members/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </Link>
          ) : undefined
        }
      />

      {/* Directory Tabs: Active vs Archived */}
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
          Active Directory
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
          Archived Members
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <MemberSearch
          value={filters.search || ''}
          onChange={(search) => setFilters((f) => ({ ...f, search, page: 1 }))}
          canViewSensitive={canEdit}
          className="flex-1 max-w-md"
        />
        <MemberFilters
          filters={filters}
          onChange={(newFilters) => setFilters(newFilters)}
          groups={activeGroups}
        />
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50 space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-semibold text-rose-800">We couldn't load the members.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-8">
            Retry
          </Button>
        </div>
      ) : members.length === 0 ? (
        isFiltered ? (
          /* No Search Results (Rule 62) */
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">No members match your search</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try changing your search query or clearing active filters.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFilters({
                  viewTab: filters.viewTab,
                  page: 1,
                  pageSize: 20,
                  search: '',
                })
              }
              className="text-xs h-8"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          /* Empty Members State (Rule 60) */
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-200 bg-white space-y-3">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <div>
              <h3 className="text-base font-bold text-slate-900">No members yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Add the organization's first member to start building the directory.
              </p>
            </div>
            {canCreate && (
              <Link
                to="/members/new"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Member</span>
              </Link>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <MemberTable
              members={members}
              canViewSensitive={canEdit}
              canInvite={canInvite}
              onGivePortalAccess={(m) => setInvitingMember(m)}
            />
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                canViewSensitive={canEdit}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-500">
              <p>
                Showing <span className="font-semibold text-slate-700">{members.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalCount}</span> members
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
                  className="h-8 px-2 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Previous</span>
                </Button>
                <span className="text-xs font-medium text-slate-600">
                  Page {filters.page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
                  className="h-8 px-2 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Give Portal Access Dialog */}
      {invitingMember && (
        <GivePortalAccessDialog
          member={invitingMember}
          open={Boolean(invitingMember)}
          onOpenChange={(open) => !open && setInvitingMember(null)}
          onSuccess={() => {
            setInvitingMember(null)
            refetch()
          }}
        />
      )}
    </div>
  )
}
