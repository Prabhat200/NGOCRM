import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft,
  Edit2,
  Archive,
  RotateCcw,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PortalAccessBadge } from '../components/PortalAccessBadge'
import { MemberGroups } from '../components/MemberGroups'
import { EditMemberDialog } from '../components/EditMemberDialog'
import { ArchiveMemberDialog } from '../components/ArchiveMemberDialog'
import { GivePortalAccessDialog } from '../components/GivePortalAccessDialog'
import { ManagePortalAccessDialog } from '../components/ManagePortalAccessDialog'
import { useMember, useRestoreMember } from '../hooks/useMembers'
import { formatDate } from '@/lib/utils/dateTime'
import { getInitials } from '@/lib/utils/nameFormatter'

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const { hasPermission } = useAuth()

  const canEdit = hasPermission('members.edit')
  const canArchive = hasPermission('members.archive')
  const canInvite = hasPermission('users.invite')
  const canDisable = hasPermission('users.disable')
  const canManageRoles = hasPermission('users.manage_roles')

  const [activeTab, setActiveTab] = useState<'profile' | 'groups'>('profile')
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showArchiveDialog, setShowArchiveDialog] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [showManagePortalDialog, setShowManagePortalDialog] = useState(false)

  // Query member detail with sensitive field permission (Rule 15, 16, 67, 75)
  const { data: member, isLoading, isError, refetch } = useMember(memberId, canEdit)
  const restoreMutation = useRestoreMember()

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !member) {
    return (
      <div className="p-8 text-center rounded-xl border border-rose-200 bg-rose-50/50 space-y-3 max-w-md mx-auto">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h3 className="text-sm font-bold text-rose-900">Member Not Found</h3>
        <p className="text-xs text-rose-700">
          The member record could not be loaded or may not exist in your organization.
        </p>
        <Link
          to="/members"
          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Back to Directory
        </Link>
      </div>
    )
  }

  const initials = getInitials(member.full_name)
  const isArchived = Boolean(member.archived_at)

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync(member.id)
      refetch()
    } catch (err) {
      console.error('Failed to restore member:', err)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Link */}
      <div className="flex items-center gap-2">
        <Link
          to="/members"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors py-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Member Directory</span>
        </Link>
      </div>

      {/* Archived Banner */}
      {isArchived && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Archive className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              This member is <strong>archived</strong> and hidden from active directory views.
            </span>
          </div>
          {canArchive && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestore}
              disabled={restoreMutation.isPending}
              className="text-xs h-8 gap-1.5 bg-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Member</span>
            </Button>
          )}
        </div>
      )}

      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xl flex items-center justify-center shrink-0 shadow-inner">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{member.full_name}</h1>
                <StatusBadge status={member.status} />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {member.position_title || 'General Member'}
              </p>
              {member.can_view_sensitive && member.membership_number && (
                <p className="text-xs font-mono text-slate-500">
                  Membership #: {member.membership_number}
                </p>
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

            {canArchive && !isArchived && (
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

        {/* Portal Access Status Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/75 p-3.5 rounded-xl">
          <div className="flex items-center gap-3">
            <PortalAccessBadge status={member.portal_status} />
            {member.portal_roles && member.portal_roles.length > 0 && (
              <span className="text-xs text-slate-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">
                  {member.portal_roles.map((r) => r.name).join(', ')}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {member.portal_status === 'no_access' && canInvite && !isArchived && (
              <Button
                size="sm"
                onClick={() => setShowInviteDialog(true)}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 gap-1.5 shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Give Portal Access</span>
              </Button>
            )}

            {member.portal_user_id && (canDisable || canManageRoles) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowManagePortalDialog(true)}
                className="h-8 text-xs gap-1.5 bg-white"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Manage Access</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Profile vs Groups */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Profile Details
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('groups')}
          className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'groups'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Committees & Groups</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-600 font-bold">
            {member.groups?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'profile' ? (
        <div className="space-y-6">
          {/* General Information Card */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Membership Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Position / Role</p>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {member.position_title || '—'}
                </p>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Status</p>
                <div className="mt-0.5">
                  <StatusBadge status={member.status} />
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Joined Date</p>
                <p className="text-slate-800 font-semibold mt-0.5">
                  {member.joined_at ? formatDate(member.joined_at) : '—'}
                </p>
              </div>

              {member.can_view_sensitive && member.left_at && (
                <div>
                  <p className="text-slate-400 font-medium">Left Date</p>
                  <p className="text-slate-800 font-semibold mt-0.5">
                    {formatDate(member.left_at)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sensitive Contact & Admin Details (Admin only: Rule 16, 75) */}
          {member.can_view_sensitive ? (
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center justify-between">
                <span>Contact & Administrative Records</span>
                <span className="text-[11px] font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Admin Access
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">Email Address</p>
                    <p className="text-slate-800 font-medium mt-0.5">{member.email || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">Phone Number</p>
                    <p className="text-slate-800 font-medium mt-0.5">{member.phone || '—'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 sm:col-span-2">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">Physical Address</p>
                    <p className="text-slate-800 font-medium mt-0.5">{member.address || '—'}</p>
                  </div>
                </div>
              </div>

              {member.notes && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <p className="text-xs font-semibold text-slate-700">Administrative Notes</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                    {member.notes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500">
              Personal contact details and administrative notes are restricted to organization
              administrators.
            </div>
          )}
        </div>
      ) : (
        /* Groups Tab (Rule 47) */
        <MemberGroups groups={member.groups || []} />
      )}

      {/* Edit Member Dialog */}
      {showEditDialog && (
        <EditMemberDialog
          member={member}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => refetch()}
        />
      )}

      {/* Archive Member Dialog */}
      {showArchiveDialog && (
        <ArchiveMemberDialog
          member={member}
          open={showArchiveDialog}
          onOpenChange={setShowArchiveDialog}
          onSuccess={() => refetch()}
        />
      )}

      {/* Give Portal Access Dialog */}
      {showInviteDialog && (
        <GivePortalAccessDialog
          member={member}
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          onSuccess={() => refetch()}
        />
      )}

      {/* Manage Portal Access Dialog */}
      {showManagePortalDialog && (
        <ManagePortalAccessDialog
          member={member}
          open={showManagePortalDialog}
          onOpenChange={setShowManagePortalDialog}
          canDisable={canDisable}
          canManageRoles={canManageRoles}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}
