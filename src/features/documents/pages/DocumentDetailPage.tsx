import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Download,
  Star,
  UploadCloud,
  Shield,
  Edit,
  Archive,
  Calendar,
  FileText,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DocumentAccessBadge } from '../components/DocumentAccessBadge'
import { VersionHistory } from '../components/VersionHistory'
import { UploadVersionDialog } from '../components/UploadVersionDialog'
import { ManageAccessDialog } from '../components/ManageAccessDialog'
import { EditMetadataDialog } from '../components/EditMetadataDialog'
import { ArchiveConfirmDialog, RestoreConfirmDialog } from '../components/ArchiveConfirmDialog'
import type { EditDocumentMetadataFormValues } from '../schemas/document.schema'
import {
  useDocument,
  useDocumentVersions,
  useDocumentAccess,
  useToggleFavorite,
  useArchiveDocument,
  useRestoreDocument,
  useUpdateDocumentMetadata,
  useDocumentTaxonomy,
} from '../hooks/useDocuments'
import { documentService } from '../services/document.service'
import { formatDate, formatDateTime } from '@/lib/utils/dateTime'
import { formatFileSize, getFileTypeInfo } from '../utils/fileTypes'
import { formatActivityAction } from '@/features/dashboard/utils/activityFormatter'
import { useRecentActivity } from '@/features/dashboard/hooks/useDashboardData'

type ActiveTab = 'overview' | 'versions' | 'access' | 'activity'

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const { organization, hasPermission } = useAuth()

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [isUploadVersionOpen, setIsUploadVersionOpen] = useState(false)
  const [isManageAccessOpen, setIsManageAccessOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isRestoreOpen, setIsRestoreOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: document, isLoading, isError } = useDocument(documentId)
  const { data: versions = [] } = useDocumentVersions(documentId)
  const { data: accessData } = useDocumentAccess(documentId)
  const { data: taxonomy } = useDocumentTaxonomy()
  const { data: activities = [] } = useRecentActivity(20)

  const toggleFavoriteMutation = useToggleFavorite()
  const archiveMutation = useArchiveDocument()
  const restoreMutation = useRestoreDocument()
  const updateMetadataMutation = useUpdateDocumentMetadata()

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

  if (isError || !document) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900">Document Unavailable</h1>
          <p className="text-xs text-slate-500 mt-1">
            You don&apos;t have access to this document, or it does not exist in your organization.
          </p>
        </div>
        <Link
          to="/documents"
          className="inline-flex items-center justify-center rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 transition-colors"
        >
          Back to Documents
        </Link>
      </div>
    )
  }

  // Permission evaluation (Rule 71)
  const canDownload = hasPermission('documents.download')
  const canUploadVersion = hasPermission('documents.upload_version')
  const canManageAccess = hasPermission('documents.manage_access')
  const canEdit = hasPermission('documents.edit')
  const canArchive = hasPermission('documents.archive') && !document.archived_at
  const canRestore = hasPermission('documents.restore') && Boolean(document.archived_at)
  const canViewAudit = hasPermission('audit.view')

  const handleDownloadCurrent = async () => {
    if (!document.current_version) return
    setIsDownloading(true)
    try {
      await documentService.downloadFile(
        document.id,
        document.current_version.storage_path,
        document.current_version.original_filename,
        document.current_version.id
      )
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleToggleFav = () => {
    if (organization?.id) {
      toggleFavoriteMutation.mutate({
        documentId: document.id,
        organizationId: organization.id,
      })
    }
  }

  const handleArchive = async () => {
    await archiveMutation.mutateAsync(document.id)
    setIsArchiveOpen(false)
  }

  const handleRestore = async () => {
    await restoreMutation.mutateAsync(document.id)
    setIsRestoreOpen(false)
  }

  const handleEditSubmit = async (values: EditDocumentMetadataFormValues) => {
    if (!document) return
    await updateMetadataMutation.mutateAsync({
      documentId: document.id,
      values,
    })
    setIsEditOpen(false)
  }

  // Filter activity logs matching this document
  const docActivities = activities.filter(
    (a) => a.entity_type === 'document' && a.entity_id === document.id
  )

  const fileInfo = getFileTypeInfo(document.mime_type, document.title)
  const FileIcon = fileInfo.icon

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to documents</span>
        </Link>
      </div>

      {/* Archived Notice Banner if applicable */}
      {document.archived_at && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
            <span>
              This document was archived on{' '}
              <strong>{formatDate(document.archived_at, organization?.timezone)}</strong>.
            </span>
          </div>
          {canRestore && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsRestoreOpen(true)}
              className="text-xs h-7"
            >
              Restore Document
            </Button>
          )}
        </div>
      )}

      {/* Main Document Header Card (Rule 34) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${fileInfo.bgClass} ${fileInfo.colorClass}`}
              aria-hidden="true"
            >
              <FileIcon className="w-6 h-6" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  {document.title}
                </h1>
                <StatusBadge status={document.status} />
                <DocumentAccessBadge accessMode={document.access_mode} />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {document.category_name && (
                  <span className="font-medium text-slate-700">{document.category_name}</span>
                )}
                {document.occasion_name && (
                  <>
                    <span>&bull;</span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{document.occasion_name}</span>
                    </span>
                  </>
                )}
                {document.current_version_number && (
                  <>
                    <span>&bull;</span>
                    <span className="font-mono text-slate-600">v{document.current_version_number}</span>
                  </>
                )}
                <span>&bull;</span>
                <span>Updated {formatDate(document.updated_at, organization?.timezone)}</span>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            {/* Favorite Star */}
            <button
              type="button"
              onClick={handleToggleFav}
              className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                document.is_favorite
                  ? 'border-amber-200 bg-amber-50 text-amber-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
              }`}
              aria-label={document.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${document.is_favorite ? 'fill-amber-400' : ''}`} />
            </button>

            {/* Download Button */}
            {canDownload && document.current_version && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCurrent}
                disabled={isDownloading}
                className="gap-1.5 text-xs h-9"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
              </Button>
            )}

            {/* Upload New Version */}
            {canUploadVersion && (
              <Button
                size="sm"
                onClick={() => setIsUploadVersionOpen(true)}
                className="gap-1.5 text-xs h-9"
              >
                <UploadCloud className="w-4 h-4" />
                <span>New Version</span>
              </Button>
            )}

            {/* Manage Access */}
            {canManageAccess && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsManageAccessOpen(true)}
                className="gap-1.5 text-xs h-9"
              >
                <Shield className="w-4 h-4" />
                <span>Access</span>
              </Button>
            )}

            {/* Edit Metadata */}
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

            {/* Archive */}
            {canArchive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsArchiveOpen(true)}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-9"
              >
                <Archive className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation (Rule 35) */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'versions', label: `Versions (${versions.length})` },
          ...(canManageAccess ? [{ id: 'access', label: 'Access' }] : []),
          ...(canViewAudit ? [{ id: 'activity', label: 'Activity' }] : []),
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
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

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Card (Rule 36) */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold">Document Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4 text-xs">
                {document.description && (
                  <div>
                    <span className="text-slate-400 block text-[11px] mb-1">Description</span>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {document.description}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {document.document_number && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Document Number</span>
                      <span className="font-semibold text-slate-900">#{document.document_number}</span>
                    </div>
                  )}

                  {document.document_date && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Official Date</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(document.document_date, organization?.timezone)}
                      </span>
                    </div>
                  )}

                  {document.fiscal_year && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Fiscal Year</span>
                      <span className="font-medium text-slate-900">{document.fiscal_year}</span>
                    </div>
                  )}

                  {document.expires_at && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Expires On</span>
                      <span className="font-medium text-slate-900">
                        {formatDate(document.expires_at, organization?.timezone)}
                      </span>
                    </div>
                  )}

                  {document.owner_group_name && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Owner Committee</span>
                      <span className="font-medium text-slate-900">{document.owner_group_name}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[11px]">Confidentiality</span>
                    <span className="font-medium text-slate-900 capitalize">
                      {document.confidentiality.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Governance & Origin */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base font-semibold">Governance Archive</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Added By</span>
                    <span className="font-medium text-slate-900">{document.creator_name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">First Uploaded</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(document.created_at, organization?.timezone)}
                    </span>
                  </div>
                </div>

                {document.current_version && (
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[11px]">Physical File</span>
                      <span className="font-medium text-slate-900 block truncate max-w-[200px]">
                        {document.current_version.original_filename}
                      </span>
                      <span className="text-slate-500 text-[10px]">
                        {formatFileSize(document.current_version.file_size)} &bull; {fileInfo.label}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'versions' && (
        <VersionHistory
          documentId={document.id}
          versions={versions}
          currentVersionId={document.current_version_id}
          canUploadVersion={canUploadVersion}
          organizationId={document.organization_id}
          timezone={organization?.timezone}
        />
      )}

      {activeTab === 'access' && canManageAccess && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold">Access Permissions</CardTitle>
            <Button size="sm" onClick={() => setIsManageAccessOpen(true)} className="text-xs">
              Configure Access
            </Button>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-4">
            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Access Scope</span>
              <DocumentAccessBadge accessMode={document.access_mode} />
            </div>

            {accessData && (
              <div className="space-y-2">
                <span className="text-slate-400 block text-[11px]">Assigned User Grants</span>
                {accessData.users.length === 0 ? (
                  <p className="text-slate-500 italic">No direct individual grants.</p>
                ) : (
                  <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                    {accessData.users.map((u) => (
                      <div key={u.id} className="p-2.5 flex items-center justify-between">
                        <span className="font-medium text-slate-900">{u.display_name}</span>
                        <span className="text-[10px] font-semibold uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {u.access_level}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && canViewAudit && (
        <Card>
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold">Document Activity Trail</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {docActivities.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center italic">
                No activity logs recorded for this document.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {docActivities.map((act) => (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-slate-800">
                        <strong className="text-slate-900 font-semibold">{act.actor_name}</strong>{' '}
                        <span>{formatActivityAction(act.action)}</span>
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {formatDateTime(act.created_at, organization?.timezone)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Dialogs */}
      {isUploadVersionOpen && (
        <UploadVersionDialog
          documentId={document.id}
          organizationId={document.organization_id}
          onClose={() => setIsUploadVersionOpen(false)}
        />
      )}

      {isManageAccessOpen && (
        <ManageAccessDialog
          documentId={document.id}
          currentAccessMode={document.access_mode}
          accessData={accessData}
          onClose={() => setIsManageAccessOpen(false)}
        />
      )}

      {isEditOpen && (
        <EditMetadataDialog
          document={document}
          taxonomy={taxonomy}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          onSubmit={handleEditSubmit}
          isSubmitting={updateMetadataMutation.isPending}
        />
      )}

      <ArchiveConfirmDialog
        title={document.title}
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchive}
        isPending={archiveMutation.isPending}
      />

      <RestoreConfirmDialog
        title={document.title}
        isOpen={isRestoreOpen}
        onClose={() => setIsRestoreOpen(false)}
        onConfirm={handleRestore}
        isPending={restoreMutation.isPending}
      />
    </div>
  )
}
