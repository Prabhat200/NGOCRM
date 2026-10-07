import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, AlertCircle, Search } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OccasionSearch } from '../components/OccasionSearch'
import { OccasionFilters } from '../components/OccasionFilters'
import { OccasionTable } from '../components/OccasionTable'
import { OccasionCard } from '../components/OccasionCard'
import { useOccasions, useOccasionTypes } from '../hooks/useOccasions'
import type { OccasionFiltersState } from '../types/occasion.types'

export function OccasionsPage() {
  const { hasPermission, organization } = useAuth()
  const canCreate = hasPermission('occasions.create')

  const [filters, setFilters] = useState<OccasionFiltersState>({
    viewTab: 'all',
    page: 1,
    pageSize: 20,
    search: '',
  })

  const { data, isLoading, isError, refetch } = useOccasions(filters)
  const { data: types = [] } = useOccasionTypes()

  const occasions = data?.occasions || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / filters.pageSize) || 1

  const handleFilterChange = (updated: Partial<OccasionFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...updated }))
  }

  const handleResetFilters = () => {
    setFilters({
      viewTab: 'all',
      page: 1,
      pageSize: 20,
      search: '',
    })
  }

  const isFiltered = Boolean(
    filters.search || filters.typeId || filters.status || filters.fiscalYear
  )

  return (
    <div className="space-y-6">
      {/* Page Header (Rule 5) */}
      <PageHeader
        title="Occasions"
        description="Organize meetings, programs and activities."
        primaryAction={
          canCreate ? (
            <Link
              to="/occasions/new"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Create Occasion</span>
            </Link>
          ) : undefined
        }
      />

      {/* Navigation Tabs (Rule 2 & 9) */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Occasions' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed' },
          { id: 'archived', label: 'Archived' },
        ].map((tab) => {
          const isActive = filters.viewTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                handleFilterChange({
                  viewTab: tab.id as 'all' | 'upcoming' | 'completed' | 'archived',
                  page: 1,
                })
              }
              className={`px-3.5 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Search and Filters Controls */}
      <div className="space-y-3">
        <OccasionSearch
          value={filters.search || ''}
          onChange={(search) => handleFilterChange({ search, page: 1 })}
        />

        <OccasionFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          types={types}
        />
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="space-y-3 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between"
            >
              <div className="space-y-2 flex-1 pr-4">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-3 w-1/4 rounded" />
              </div>
              <Skeleton className="h-6 w-20 rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center space-y-3 rounded-xl border border-slate-200 bg-white">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-900">We couldn&apos;t load the occasions.</p>
          <p className="text-xs text-slate-500">Please try refreshing or check your connection.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : occasions.length === 0 ? (
        // Empty states (Rule 38 & 39)
        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            {isFiltered ? <Search className="w-6 h-6" /> : <Calendar className="w-6 h-6" />}
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isFiltered ? 'No occasions match your search.' : 'No occasions yet'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isFiltered
                ? 'Try changing your search terms or clearing your active filters.'
                : 'Create meetings, programs and other activities to organize their records.'}
            </p>
          </div>

          <div>
            {isFiltered ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Clear Filters
              </Button>
            ) : (
              canCreate && (
                <Link
                  to="/occasions/new"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Occasion
                </Link>
              )
            )}
          </div>
        </div>
      ) : (
        // Responsive Presentation (Rule 6 & 7: Desktop table, Mobile cards)
        <div className="space-y-4">
          <div className="hidden md:block">
            <OccasionTable occasions={occasions} timezone={organization?.timezone} />
          </div>

          <div className="md:hidden space-y-3">
            {occasions.map((occ) => (
              <OccasionCard key={occ.id} occasion={occ} timezone={organization?.timezone} />
            ))}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
              <div>
                Showing {(filters.page - 1) * filters.pageSize + 1} to{' '}
                {Math.min(filters.page * filters.pageSize, totalCount)} of {totalCount} occasions
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() => handleFilterChange({ page: filters.page - 1 })}
                  className="text-xs h-8 px-2.5"
                >
                  Previous
                </Button>
                <span className="px-2 font-medium">
                  {filters.page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= totalPages}
                  onClick={() => handleFilterChange({ page: filters.page + 1 })}
                  className="text-xs h-8 px-2.5"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
