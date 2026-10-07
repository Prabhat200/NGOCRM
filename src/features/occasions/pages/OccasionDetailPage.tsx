import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Edit,
  Archive,
  RotateCcw,
  Plus,
  AlertCircle,
  FileText,
  Users,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { OccasionDocuments } from '../components/OccasionDocuments'
import { OccasionMembers } from '../components/OccasionMembers'
import { EditOccasionDialog } from '../components/EditOccasionDialog'
import { ArchiveOccasionDialog, RestoreOccasionDialog } from '../components/ArchiveOccasionDialog'
import {
  useOccasion,
  useOccasionTypes,
  useUpdateOccasion,
  useArchiveOccasion,
  useRestoreOccasion,
} from '../hooks/useOccasions'
import type { EditOccasionFormValues } from '../schemas/occasion.schema'
import { formatDate } from '@/lib/utils/dateTime'

type ActiveTab = 'overview' | 'documents' | 'people'

export function OccasionDetailPage() {
  const { occasionId } = useParams<{ occasionId: string }>()
  const { organization, hasPermission } = useAuth()

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isRestoreOpen, setIsRestoreOpen] = useState(false)

  const { data: occasion, isLoading, isError } = useOccasion(occasionId)
  const { data: types = [] } = useOccasionTypes()

  const updateMutation = useUpdateOccasion()
  const archiveMutation = useArchiveOccasion()
  const restoreMutation = useRestoreOccasion()

  const canEdit = hasPermission('occasions.edit')
  const canArchive = hasPermission('occasions.archive') && !occasion?.archived_at
  const canRestore =
    (hasPermission('occasions.archive') || hasPermission('occasions.edit')) &&
    Boolean(occasion?.archived_at)
  const canCreateDoc = hasPermission('documents.create')

  const handleEditSubmit = async (values: EditOccasionFormValues) => {
    if (!occasion) return
    await updateMutation.mutateAsync({ id: occasion.id, values })
    setIsEditOpen(false)
  }

  const handleArchive = async () => {
    if (!occasion) return
    await archiveMutation.mutateAsync(occasion.id)
    setIsArchiveOpen(false)
  }

  const handleRestore = async () => {
    if (!occasion) return
    await restoreMutation.mutateAsync(occasion.id)
    setIsRestoreOpen(false)
  }

  const formatDates = (start: string | null, end: string | null) => {
    if (!start && !end) return null
    if (start && !end) return formatDate(start, organization?.timezone)
    if (!start && end) return formatDate(end, organization?.timezone)
    if (start === end) return formatDate(start, organization?.timezone)
    return `${formatDate(start, organization?.timezone)} – ${formatDate(end, organization?.timezone)}`
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <Skeleton className="h-5 w-32 rounded" />
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <Skeleton className="h-7 w-1/2 rounded" />
          <Skeleton className="h-4 w-1/3 rounded" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !occasion) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900">Occasion Unavailable</h1>
          <p className="text-xs text-slate-500 mt-1">
            You don&apos;t have access to this occasion, or it does not exist in your organization.
          </p>
        </div>
        <Link
          to="/occasions"
          className="inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 transition-colors"
        >
          Back to Occasions
        </Link>
      </div>
    )
  }

  const dateStr = formatDates(occasion.start_date, occasion.end_date)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/occasions"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to occasions</span>
        </Link>
      </div>

      {/* Archived Notice Banner */}
      {occasion.archived_at && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span>
              This occasion was archived on{' '}
              <strong>{formatDate(occasion.archived_at, organization?.timezone)}</strong>.
            </span>
          </div>
          {canRestore && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRestoreOpen(true)}
              className="text-xs h-7 gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Occasion</span>
            </Button>
          )}
        </div>
      )}

      {/* Main Occasion Header Card (Rule 18) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                {occasion.name}
              </h1>
              <StatusBadge status={occasion.status} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
              {occasion.type_name && (
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{occasion.type_name}</span>
                </span>
              )}

              {dateStr && (
                <>
                  <span>&bull;</span>
                  <span>{dateStr}</span>
                </>
              )}

              {occasion.location && (
                <>
                  <span>&bull;</span>
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{occasion.location}</span>
                  </span>
                </>
              )}
            </div>

            {occasion.description && (
              <p className="text-xs text-slate-600 max-w-3xl pt-1 leading-relaxed">
                {occasion.description}
              </p>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {canCreateDoc && (
              <Link
                to={`/documents/new?occasion=${occasion.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 h-9"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Document</span>
              </Link>
            )}

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="gap-1.5 text-xs h-9"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
            )}

            {canArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsArchiveOpen(true)}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-9"
                aria-label="Archive occasion"
              >
                <Archive className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs navigation: Overview / Documents / People (Rule 19) */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Calendar },
          {
            id: 'documents',
            label: `Documents (${occasion.document_count})`,
            icon: FileText,
          },
          {
            id: 'people',
            label: `People (${occasion.member_count})`,
            icon: Users,
          },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                isActive
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Occasion Overview</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                {occasion.type_name && (
                  <div>
                    <dt className="text-slate-400 font-medium text-[11px]">Occasion Type</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{occasion.type_name}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-slate-400 font-medium text-[11px]">Status</dt>
                  <dd className="mt-1">
                    <StatusBadge status={occasion.status} />
                  </dd>
                </div>

                {occasion.start_date && (
                  <div>
                    <dt className="text-slate-400 font-medium text-[11px]">Start Date</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">
                      {formatDate(occasion.start_date, organization?.timezone)}
                    </dd>
                  </div>
                )}

                {occasion.end_date && (
                  <div>
                    <dt className="text-slate-400 font-medium text-[11px]">End Date</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">
                      {formatDate(occasion.end_date, organization?.timezone)}
                    </dd>
                  </div>
                )}

                {occasion.location && (
                  <div>
                    <dt className="text-slate-400 font-medium text-[11px]">Location</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">{occasion.location}</dd>
                  </div>
                )}

                {occasion.fiscal_year && (
                  <div>
                    <dt className="text-slate-400 font-medium text-[11px]">Fiscal Year</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">{occasion.fiscal_year}</dd>
                  </div>
                )}

                {occasion.creator_name && (
                  <div>
                    <dt className="text-slate-400 font-medium text-[11px]">Created By</dt>
                    <dd className="font-medium text-slate-800 mt-0.5">{occasion.creator_name}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-slate-400 font-medium text-[11px]">Recorded On</dt>
                  <dd className="font-medium text-slate-800 mt-0.5">
                    {formatDate(occasion.created_at, organization?.timezone)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'documents' && (
        <OccasionDocuments occasionId={occasion.id} occasionName={occasion.name} />
      )}

      {activeTab === 'people' && (
        <OccasionMembers occasionId={occasion.id} canEdit={canEdit} />
      )}

      {/* Modal Dialogs */}
      {isEditOpen && (
        <EditOccasionDialog
          occasion={occasion}
          types={types}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditSubmit}
          isSubmitting={updateMutation.isPending}
        />
      )}

      <ArchiveOccasionDialog
        title={occasion.name}
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchive}
        isPending={archiveMutation.isPending}
      />

      <RestoreOccasionDialog
        title={occasion.name}
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        onConfirm={handleRestore}
        isPending={restoreMutation.isPending}
      />
    </div>
  )
}
