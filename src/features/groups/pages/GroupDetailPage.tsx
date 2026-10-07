import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Users,
  FileText,
  Edit2,
  Archive,
  RotateCcw,
  Plus,
  Calendar,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { GroupMembers } from '../components/GroupMembers'
import { EditGroupDialog } from '../components/EditGroupDialog'
import { ArchiveGroupDialog } from '../components/ArchiveGroupDialog'
import { AddGroupMemberDialog } from '../components/AddGroupMemberDialog'
import { useGroup, useGroupMembers, useRestoreGroup } from '../hooks/useGroups'
import { useDocuments } from '@/features/documents/hooks/useDocuments'
import { formatDate } from '@/lib/utils/dateTime'

export function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { hasPermission } = useAuth()

  const canEdit = hasPermission('groups.edit')
  const canManageMembers = hasPermission('groups.manage_members')
  const canCreateDoc = hasPermission('documents.create')

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'documents'>('members')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)

  const { data: group, isLoading: loadingGroup, isError, refetch: refetchGroup } = useGroup(groupId)
  const { data: members = [], refetch: refetchMembers } = useGroupMembers(groupId)

  // Query accessible documents owned by this group (Rule 41 & 42)
  const { data: docsData, isLoading: loadingDocs } = useDocuments({
    ownerGroupId: groupId,
    pageSize: 20,
  })

  const groupDocs = docsData?.documents || []
  const groupDocCount = docsData?.totalCount ?? group?.document_count ?? 0

  const restoreMutation = useRestoreGroup()

  if (loadingGroup) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !group) {
    return (
      <div className="p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50 space-y-3 max-w-md mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Group Not Found</h3>
        <p className="text-xs text-rose-700">
          The requested group or committee could not be found in your organization.
        </p>
        <Link
          to="/groups"
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to Groups
        </Link>
      </div>
    )
  }

  const isArchived = Boolean(group.archived_at)
  const typeLabels: Record<string, string> = {
    committee: 'Committee',
    department: 'Department',
    team: 'Team',
    custom: 'Custom Group',
  }

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(group.id)
      refetchGroup()
    } catch (err) {
      console.error('Failed to restore group:', err)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center gap-2">
        <Link
          to="/groups"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Groups & Committees</span>
        </Link>
      </div>

      {/* Archived Banner */}
      {isArchived && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Archive className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              This group is <strong>archived</strong>. Document access derived solely from this group is suspended.
            </span>
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              className="text-xs h-8 gap-1.5 bg-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Group</span>
            </Button>
          )}
        </div>
      )}

      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-inner">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{group.name}</h1>
                <Badge variant="secondary" className="text-[11px] uppercase font-semibold">
                  {typeLabels[group.type] || group.type}
                </Badge>
                <StatusBadge status={group.is_active ? 'active' : 'inactive'} />
              </div>
              {group.description && (
                <p className="text-xs text-slate-600 max-w-xl">{group.description}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && !isArchived && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                className="h-8 text-xs gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Button>
            )}

            {canEdit && !isArchived && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchiveDialog(true)}
                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 gap-1.5"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archive</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="w-4 h-4 text-slate-400" />
            <span>
              <strong>{members.length}</strong> {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <FileText className="w-4 h-4 text-slate-400" />
            <span>
              <strong>{groupDocCount}</strong> {groupDocCount === 1 ? 'document' : 'documents'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Created {formatDate(group.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Members</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {members.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Documents</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {groupDocCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Overview
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Members appointed to this {typeLabels[group.type]?.toLowerCase() || 'group'}.
            </p>
            {canManageMembers && !isArchived && (
              <Button
                size="sm"
                onClick={() => setShowAddMemberDialog(true)}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </Button>
            )}
          </div>

          <GroupMembers
            groupId={group.id}
            members={members}
            canManageMembers={canManageMembers && !isArchived}
            onMemberRemoved={() => {
              refetchMembers()
              refetchGroup()
            }}
          />
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Documents owned and maintained by {group.name}.
            </p>
            {canCreateDoc && !isArchived && (
              <Link
                to={`/documents/new?group=${group.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Document</span>
              </Link>
            )}
          </div>

          {loadingDocs ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : groupDocs.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">No Documents Found</h4>
              <p className="text-xs text-slate-500 mt-1">
                No accessible documents are currently linked to this group.
              </p>
              {canCreateDoc && !isArchived && (
                <Link
                  to={`/documents/new?group=${group.id}`}
                  className="inline-flex items-center mt-3 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Upload Document
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {doc.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{doc.category_name || '—'}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(doc.updated_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/documents/${doc.id}`}
                          className="inline-flex items-center px-2 py-1 rounded text-xs text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Group Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium">Name</p>
              <p className="text-slate-800 font-semibold mt-0.5">{group.name}</p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Type</p>
              <p className="text-slate-800 font-semibold mt-0.5 capitalize">
                {typeLabels[group.type] || group.type}
              </p>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Status</p>
              <div className="mt-0.5">
                <StatusBadge status={group.is_active ? 'active' : 'inactive'} />
              </div>
            </div>

            <div>
              <p className="text-slate-400 font-medium">Created Date</p>
              <p className="text-slate-800 font-semibold mt-0.5">
                {formatDate(group.created_at)}
              </p>
            </div>

            {group.creator_name && (
              <div>
                <p className="text-slate-400 font-medium">Created By</p>
                <p className="text-slate-800 font-semibold mt-0.5">{group.creator_name}</p>
              </div>
            )}
          </div>

          {group.description && (
            <div className="pt-3 border-t border-slate-100 space-y-1">
              <p className="text-xs font-semibold text-slate-700">Purpose & Mandate</p>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {group.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Group Dialog */}
      {showEditDialog && (
        <EditGroupDialog
          group={group}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => refetchGroup()}
        />
      )}

      {/* Archive Group Dialog */}
      {showArchiveDialog && (
        <ArchiveGroupDialog
          group={group}
          open={showArchiveDialog}
          onOpenChange={setShowArchiveDialog}
          onSuccess={() => refetchGroup()}
        />
      )}

      {/* Add Group Member Dialog */}
      {showAddMemberDialog && (
        <AddGroupMemberDialog
          groupId={group.id}
          existingMemberIds={members.map((m) => m.member_id)}
          open={showAddMemberDialog}
          onOpenChange={setShowAddMemberDialog}
          onSuccess={() => {
            refetchMembers()
            refetchGroup()
          }}
        />
      )}
    </div>
  )
}
