import { Button } from '@/components/ui/button'
import { AlertTriangle, Archive, Loader2, X } from 'lucide-react'
import { useArchiveMember } from '../hooks/useMembers'
import type { MemberDetail, MemberListItem } from '../types/member.types'

interface ArchiveMemberDialogProps {
  member: MemberDetail | MemberListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ArchiveMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: ArchiveMemberDialogProps) {
  const archiveMutation = useArchiveMember()

  if (!open) return null

  const hasActivePortal = member.portal_status === 'active'

  const handleConfirm = async () => {
    try {
      await archiveMutation.mutateAsync(member.id)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to archive member:', err)
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
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Archive {member.full_name}?</h2>
              <p className="text-xs text-slate-500">
                Remove this member from the active organizational directory.
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

        <div className="space-y-3 pt-1 text-xs text-slate-600">
          <p>
            The member will be removed from the active directory. Historical records, committee
            memberships, and document activity will remain intact.
          </p>

          {hasActivePortal && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-[11px]">Active Portal Account</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  This member currently has active portal access. Archiving their directory profile
                  does not automatically disable their portal login.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={archiveMutation.isPending}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={archiveMutation.isPending}
            className="text-xs h-9 gap-1.5"
          >
            {archiveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Archive Member</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
