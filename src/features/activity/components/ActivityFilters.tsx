import { ActionCategory, ActivityFilters as ActivityFiltersType } from '../types/activity.types'
import { Search, RotateCcw } from 'lucide-react'

interface ActivityFiltersProps {
  filters: ActivityFiltersType
  onChange: (filters: ActivityFiltersType) => void
}

const CATEGORIES: { label: string; value: ActionCategory }[] = [
  { label: 'All Activities', value: 'all' },
  { label: 'Documents', value: 'documents' },
  { label: 'Occasions', value: 'occasions' },
  { label: 'Members', value: 'members' },
  { label: 'Groups & Teams', value: 'groups' },
  { label: 'Users & Roles', value: 'users' },
  { label: 'Settings', value: 'settings' },
]

export function ActivityFilters({ filters, onChange }: ActivityFiltersProps) {
  const handleCategoryChange = (category: ActionCategory) => {
    onChange({ ...filters, category })
  }

  const handleSearchChange = (search: string) => {
    onChange({ ...filters, search })
  }

  const handleStartDateChange = (startDate: string) => {
    onChange({ ...filters, startDate })
  }

  const handleEndDateChange = (endDate: string) => {
    onChange({ ...filters, endDate })
  }

  const handleReset = () => {
    onChange({ category: 'all', search: '', startDate: '', endDate: '' })
  }

  const hasActiveFilters =
    filters.category !== 'all' ||
    Boolean(filters.search) ||
    Boolean(filters.startDate) ||
    Boolean(filters.endDate)

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategoryChange(cat.value)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Search & Date Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1 border-t border-slate-100">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search activities by title, actor, or action..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Start Date */}
        <div className="sm:col-span-3">
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => handleStartDateChange(e.target.value)}
            aria-label="Start Date"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* End Date */}
        <div className="sm:col-span-3 flex items-center gap-2">
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => handleEndDateChange(e.target.value)}
            aria-label="End Date"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Reset filters"
              aria-label="Reset filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
