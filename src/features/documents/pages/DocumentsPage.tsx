import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, FileText, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DocumentSearch } from '../components/DocumentSearch'
import { DocumentFilters } from '../components/DocumentFilters'
import { DocumentTable } from '../components/DocumentTable'
import { DocumentCard } from '../components/DocumentCard'
import {
  useDocuments,
  useDocumentTaxonomy,
  useToggleFavorite,
} from '../hooks/useDocuments'
import type { DocumentFilterParams } from '../types/document.types'

export function DocumentsPage() {
  const { hasPermission, organization } = useAuth()
  const canCreate = hasPermission('documents.create')

  const [filters, setFilters] = useState<DocumentFilterParams>({
    search: '',
    categoryId: undefined,
    occasionId: undefined,
    status: undefined,
    accessMode: undefined,
    viewTab: 'all',
    page: 1,
    pageSize: 20,
  })

  const { data, isLoading, isError, refetch } = useDocuments(filters)
  const { data: taxonomy } = useDocumentTaxonomy()
  const toggleFavoriteMutation = useToggleFavorite()

  const documents = data?.documents || []
  const totalCount = data?.totalCount || 0
  const totalPages = Math.ceil(totalCount / (filters.pageSize || 20)) || 1
  const currentPage = filters.page || 1

  const handleFilterChange = (updated: Partial<DocumentFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated, page: updated.page || 1 }))
  }

  const handleResetFilters = () => {
    setFilters((prev) => ({
      ...prev,
      categoryId: undefined,
      occasionId: undefined,
      status: undefined,
      accessMode: undefined,
      search: '',
      page: 1,
    }))
  }

  const handleToggleFavorite = (documentId: string) => {
    if (organization?.id) {
      toggleFavoriteMutation.mutate({
        documentId,
        organizationId: organization.id,
      })
    }
  }

  const isFiltered = Boolean(
    filters.search ||
    filters.categoryId ||
    filters.occasionId ||
    filters.status ||
    filters.accessMode
  )

  return (
    <div className="space-y-6">
      {/* Page Header (Rule 5) */}
      <PageHeader
        title="Documents"
        description="Find and manage organizational records."
        primaryAction={
          canCreate ? (
            <Link
              to="/documents/new"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Upload Document</span>
            </Link>
          ) : undefined
        }
      />

      {/* Tabs navigation: All / Favorites / Archived (Rule 15) */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: 'all', label: 'All Documents' },
          { id: 'favorites', label: 'Favorites' },
          { id: 'archived', label: 'Archived' },
        ].map((tab) => {
          const isActive = filters.viewTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleFilterChange({ viewTab: tab.id as 'all' | 'favorites' | 'archived', page: 1 })}
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
        <DocumentSearch
          value={filters.search || ''}
          onChange={(search) => handleFilterChange({ search, page: 1 })}
        />

        <DocumentFilters
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          taxonomy={taxonomy}
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
          <p className="text-sm font-semibold text-slate-900">We couldn&apos;t load the documents.</p>
          <p className="text-xs text-slate-500">Please try refreshing or check your connection.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : documents.length === 0 ? (
        // Empty states (Rule 65 & 66)
        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            {isFiltered ? <Search className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
          </div>

          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {isFiltered ? 'No documents match your search.' : 'No documents yet'}
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {isFiltered
                ? 'Try changing your search keywords or clearing your active filters.'
                : 'Upload your first document to start building the organization archive.'}
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
                  to="/documents/new"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Upload Document
                </Link>
              )
            )}
          </div>
        </div>
      ) : (
        // Records List / Table (Rule 10, 11, 12)
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DocumentTable
              documents={documents}
              onToggleFavorite={handleToggleFavorite}
              timezone={organization?.timezone}
            />
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onToggleFavorite={handleToggleFavorite}
                timezone={organization?.timezone}
              />
            ))}
          </div>

          {/* Pagination Controls (Rule 13) */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-600">
              <p>
                Showing <span className="font-semibold">{documents.length}</span> of{' '}
                <span className="font-semibold">{totalCount}</span> documents
              </p>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => handleFilterChange({ page: currentPage - 1 })}
                  className="h-8 gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </Button>

                <span className="text-xs font-medium px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => handleFilterChange({ page: currentPage + 1 })}
                  className="h-8 gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
