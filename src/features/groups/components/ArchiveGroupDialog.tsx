import { Button } from '@/components/ui/button'
import { Archive, Loader2, X } from 'lucide-react'
import { useArchiveGroup } from '../hooks/useGroups'
import type { GroupDetail, GroupListItem } from '../types/group.types'

interface ArchiveGroupDialogProps {
  group: GroupDetail | GroupListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ArchiveGroupDialog({
  group,
  open,
  onOpenChange,
  onSuccess,
}: ArchiveGroupDialogProps) {
  const archiveMutation = useArchiveGroup()

  if (!open) return null

  const handleConfirm = async () => {
    try {
      await archiveMutation.mutateAsync(group.id)
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to archive group:', err)
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
              <h2 className="text-base font-bold text-slate-900">Archive {group.name}?</h2>
              <p className="text-xs text-slate-500">
                The group will be removed from normal views and member directories.
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
            Members and historical document relationships will remain intact. Active document
            access derived solely from this group will be suspended while the group is archived.
          </p>
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
            <span>Archive Group</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
