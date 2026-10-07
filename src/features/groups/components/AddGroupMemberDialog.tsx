import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, UserPlus, Search, X } from 'lucide-react'
import { useSafeMemberDirectory } from '@/features/members/hooks/useMembers'
import { useAddGroupMember } from '../hooks/useGroups'

interface AddGroupMemberDialogProps {
  groupId: string
  existingMemberIds?: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const COMMON_ROLES = [
  'Chair',
  'Vice Chair',
  'Secretary',
  'Treasurer',
  'Coordinator',
  'Lead',
  'Member',
  'Advisor',
]

export function AddGroupMemberDialog({
  groupId,
  existingMemberIds = [],
  open,
  onOpenChange,
  onSuccess,
}: AddGroupMemberDialogProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('')
  const [roleInGroup, setRoleInGroup] = useState<string>('Member')
  const [customRole, setCustomRole] = useState<string>('')
  const [joinedAt, setJoinedAt] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [searchMember, setSearchMember] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: directoryMembers = [], isLoading: loadingMembers } = useSafeMemberDirectory()
  const addMutation = useAddGroupMember()

  if (!open) return null

  const availableMembers = directoryMembers
    .filter((m) => !existingMemberIds.includes(m.id))
    .filter((m) =>
      searchMember.trim()
        ? m.full_name.toLowerCase().includes(searchMember.toLowerCase()) ||
          m.position_title?.toLowerCase().includes(searchMember.toLowerCase())
        : true
    )

  const effectiveRole = roleInGroup === 'Other' ? customRole.trim() : roleInGroup

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!selectedMemberId) {
      setErrorMsg('Please select a member to add.')
      return
    }

    try {
      await addMutation.mutateAsync({
        groupId,
        memberId: selectedMemberId,
        roleInGroup: effectiveRole || undefined,
        joinedAt: joinedAt || undefined,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add member to group.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Committee Member</h2>
              <p className="text-xs text-slate-500">
                Assign an existing active member to this group or committee.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Member Search & Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Select Member <span className="text-rose-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search member by name..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="pl-8 text-xs h-8 bg-white"
              />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white">
              {loadingMembers ? (
                <p className="p-3 text-xs text-slate-400 text-center">Loading members...</p>
              ) : availableMembers.length === 0 ? (
                <p className="p-3 text-xs text-slate-400 text-center">
                  No available members found.
                </p>
              ) : (
                availableMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMemberId(m.id)}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                      selectedMemberId === m.id
                        ? 'bg-blue-50/80 text-blue-700 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p>{m.full_name}</p>
                      {m.position_title && (
                        <p className="text-[11px] text-slate-400 font-normal">{m.position_title}</p>
                      )}
                    </div>
                    {selectedMemberId === m.id && (
                      <span className="text-[10px] font-bold text-blue-600 uppercase">Selected</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Role In Group (Section 40) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Role in Group / Committee</label>
            <select
              value={roleInGroup}
              onChange={(e) => setRoleInGroup(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
            >
              {COMMON_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
              <option value="Other">Other (Custom title)</option>
            </select>

            {roleInGroup === 'Other' && (
              <Input
                type="text"
                placeholder="Enter custom role title..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="text-xs h-9 bg-white mt-1.5"
                required
              />
            )}
            <p className="text-[11px] text-slate-500">
              Organizational title in this committee (e.g. Chair, Coordinator). Distinct from portal RBAC roles.
            </p>
          </div>

          {/* Joined Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Joined Date</label>
            <Input
              type="date"
              value={joinedAt}
              onChange={(e) => setJoinedAt(e.target.value)}
              className="text-xs h-9 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={addMutation.isPending}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={addMutation.isPending || !selectedMemberId}
              className="text-xs h-9 bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              {addMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Add Member</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
