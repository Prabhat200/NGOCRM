import { useState } from 'react'
import { Filter, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { DocumentFilterParams } from '../types/document.types'
import type { TaxonomyOptions } from '../services/document.service'

export interface DocumentFiltersProps {
  filters: DocumentFilterParams
  onChange: (updated: Partial<DocumentFilterParams>) => void
  onReset: () => void
  taxonomy?: TaxonomyOptions
}

export function DocumentFilters({
  filters,
  onChange,
  onReset,
  taxonomy,
}: DocumentFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate active filter count (excluding pagination, search, viewTab)
  const activeCount = [
    filters.categoryId,
    filters.occasionId,
    filters.status,
    filters.accessMode,
  ].filter(Boolean).length

  // Find active label names for filter chips
  const activeCategory = taxonomy?.categories.find((c) => c.id === filters.categoryId)
  const activeOccasion = taxonomy?.occasions.find((o) => o.id === filters.occasionId)

  return (
    <div className="space-y-3">
      {/* Filter Toggle and Active Chips Row */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`gap-1.5 text-xs ${activeCount > 0 ? 'border-blue-300 bg-blue-50/50 text-blue-700' : ''}`}
          aria-expanded={isOpen}
        >
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Filters</span>
          {activeCount > 0 && (
            <Badge variant="default" className="ml-1 px-1.5 py-0 h-4 text-[10px] bg-blue-700">
              {activeCount}
            </Badge>
          )}
          <ChevronDown
            className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </Button>

        {/* Active filter chips (Rule 9) */}
        {activeCategory && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
            <span>Category: {activeCategory.name}</span>
            <button
              type="button"
              onClick={() => onChange({ categoryId: undefined })}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label={`Remove category filter ${activeCategory.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {activeOccasion && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200">
            <span>Occasion: {activeOccasion.name}</span>
            <button
              type="button"
              onClick={() => onChange({ occasionId: undefined })}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label={`Remove occasion filter ${activeOccasion.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {filters.status && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            <span>Status: {filters.status.replace('_', ' ')}</span>
            <button
              type="button"
              onClick={() => onChange({ status: undefined })}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Remove status filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {filters.accessMode && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200 capitalize">
            <span>Access: {filters.accessMode}</span>
            <button
              type="button"
              onClick={() => onChange({ accessMode: undefined })}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label="Remove access mode filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        )}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-blue-700 hover:underline cursor-pointer py-1 px-1.5"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Expanded Filter Drawer / Panel */}
      {isOpen && (
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in-50 duration-150">
          {/* Category Dropdown */}
          <div>
            <label htmlFor="filter-category" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Document Category
            </label>
            <select
              id="filter-category"
              value={filters.categoryId || ''}
              onChange={(e) => onChange({ categoryId: e.target.value || undefined, page: 1 })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Categories</option>
              {taxonomy?.categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Occasion Dropdown */}
          <div>
            <label htmlFor="filter-occasion" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Linked Occasion
            </label>
            <select
              id="filter-occasion"
              value={filters.occasionId || ''}
              onChange={(e) => onChange({ occasionId: e.target.value || undefined, page: 1 })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Occasions</option>
              {taxonomy?.occasions.map((occ) => (
                <option key={occ.id} value={occ.id}>
                  {occ.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div>
            <label htmlFor="filter-status" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lifecycle Status
            </label>
            <select
              id="filter-status"
              value={filters.status || ''}
              onChange={(e) => onChange({ status: e.target.value || undefined, page: 1 })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="final">Final</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Access Mode Dropdown */}
          <div>
            <label htmlFor="filter-access" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Access Scope
            </label>
            <select
              id="filter-access"
              value={filters.accessMode || ''}
              onChange={(e) => onChange({ accessMode: e.target.value || undefined, page: 1 })}
              className="w-full text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Scopes</option>
              <option value="organization">Organization-wide</option>
              <option value="restricted">Restricted</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
