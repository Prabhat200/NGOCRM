import { useState } from 'react'
import { Link } from 'react-router-dom'
import { UserMinus, Shield, Users, Loader2, X } from 'lucide-react'
import type { GroupMemberItem } from '../types/group.types'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useRemoveGroupMember } from '../hooks/useGroups'
import { formatDate } from '@/lib/utils/dateTime'

interface GroupMembersProps {
  groupId: string
  members: GroupMemberItem[]
  canManageMembers?: boolean
  onMemberRemoved?: () => void
}

export function GroupMembers({
  groupId,
  members,
  canManageMembers = false,
  onMemberRemoved,
}: GroupMembersProps) {
  const [memberToRemove, setMemberToRemove] = useState<GroupMemberItem | null>(null)
  const removeMutation = useRemoveGroupMember()

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return
    try {
      await removeMutation.mutateAsync({
        groupId,
        memberId: memberToRemove.member_id,
      })
      setMemberToRemove(null)
      onMemberRemoved?.()
    } catch (err) {
      console.error('Failed to remove group member:', err)
    }
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
        <h4 className="text-sm font-semibold text-slate-800">No Members Assigned</h4>
        <p className="text-xs text-slate-500 mt-1">
          This committee currently has no members assigned to its roster.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Member</th>
              <th className="py-3 px-4">Organization Position</th>
              <th className="py-3 px-4">Role in Group</th>
              <th className="py-3 px-4">Joined</th>
              <th className="py-3 px-4">Status</th>
              {canManageMembers && <th className="py-3 px-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Member Name */}
                <td className="py-3 px-4">
                  <Link
                    to={`/members/${m.member_id}`}
                    className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {m.name}
                  </Link>
                </td>

                {/* Position */}
                <td className="py-3 px-4 text-slate-600">{m.position || '—'}</td>

                {/* Role in Group */}
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    <Shield className="w-3 h-3 text-indigo-500" />
                    <span>{m.role_in_group || 'Member'}</span>
                  </span>
                </td>

                {/* Joined */}
                <td className="py-3 px-4 text-slate-500">
                  {m.joined_at ? formatDate(m.joined_at) : '—'}
                </td>

                {/* Status */}
                <td className="py-3 px-4">
                  <StatusBadge status={m.is_active ? 'active' : 'inactive'} />
                </td>

                {/* Actions */}
                {canManageMembers && (
                  <td className="py-3 px-4 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMemberToRemove(m)}
                      className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Dialog (Rule 39) */}
      {memberToRemove && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Remove from Group?</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong>{memberToRemove.name}</strong> from this
                  group?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
              This only removes committee membership. It will <strong>NOT</strong> archive their
              member profile, disable portal access, or delete their documents.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={removeMutation.isPending}
                onClick={() => setMemberToRemove(null)}
                className="text-xs h-9"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={removeMutation.isPending}
                onClick={handleConfirmRemove}
                className="text-xs h-9 gap-1.5"
              >
                {removeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Remove Member</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
