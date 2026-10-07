import { useState } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OccasionFiltersState, OccasionType } from '../types/occasion.types'

interface OccasionFiltersProps {
  filters: OccasionFiltersState
  onChange: (updated: Partial<OccasionFiltersState>) => void
  onReset: () => void
  types?: OccasionType[]
}

export function OccasionFilters({
  filters,
  onChange,
  onReset,
  types = [],
}: OccasionFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Count active non-default filters
  const activeCount = [
    Boolean(filters.typeId),
    Boolean(filters.status),
    Boolean(filters.fiscalYear),
  ].filter(Boolean).length

  const selectedTypeName = types.find((t) => t.id === filters.typeId)?.name

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={`gap-2 text-xs h-9 ${
            activeCount > 0
              ? 'border-blue-300 text-blue-700 bg-blue-50/50 hover:bg-blue-50'
              : 'border-slate-200'
          }`}
          aria-expanded={isOpen}
          aria-controls="occasion-filters-panel"
        >
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center">
              {activeCount}
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filter drawer / panel */}
      {isOpen && (
        <div
          id="occasion-filters-panel"
          className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-4 animate-in fade-in-50 duration-150"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Occasion Type */}
            <div className="space-y-1">
              <label htmlFor="filter-type" className="text-xs font-medium text-slate-600 block">
                Occasion Type
              </label>
              <select
                id="filter-type"
                value={filters.typeId || ''}
                onChange={(e) => onChange({ typeId: e.target.value || undefined, page: 1 })}
                className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Types</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label htmlFor="filter-status" className="text-xs font-medium text-slate-600 block">
                Status
              </label>
              <select
                id="filter-status"
                value={filters.status || ''}
                onChange={(e) => onChange({ status: e.target.value || undefined, page: 1 })}
                className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Statuses</option>
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Fiscal Year */}
            <div className="space-y-1">
              <label htmlFor="filter-fy" className="text-xs font-medium text-slate-600 block">
                Fiscal Year
              </label>
              <input
                id="filter-fy"
                type="text"
                placeholder="e.g. 2026/27"
                value={filters.fiscalYear || ''}
                onChange={(e) => onChange({ fiscalYear: e.target.value || undefined, page: 1 })}
                className="w-full text-xs rounded-lg border border-slate-200 px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Chips (Rule 9) */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {filters.typeId && selectedTypeName && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Type: {selectedTypeName}
              <button
                type="button"
                onClick={() => onChange({ typeId: undefined, page: 1 })}
                className="hover:text-slate-900"
                aria-label="Remove type filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Status: {filters.status}
              <button
                type="button"
                onClick={() => onChange({ status: undefined, page: 1 })}
                className="hover:text-slate-900"
                aria-label="Remove status filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.fiscalYear && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              FY: {filters.fiscalYear}
              <button
                type="button"
                onClick={() => onChange({ fiscalYear: undefined, page: 1 })}
                className="hover:text-slate-900"
                aria-label="Remove fiscal year filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
