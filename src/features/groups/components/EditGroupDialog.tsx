import { X } from 'lucide-react'
import { GroupForm } from './GroupForm'
import { useUpdateGroup } from '../hooks/useGroups'
import type { GroupDetail } from '../types/group.types'
import type { GroupFormValues } from '../schemas/group.schema'

interface EditGroupDialogProps {
  group: GroupDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditGroupDialog({
  group,
  open,
  onOpenChange,
  onSuccess,
}: EditGroupDialogProps) {
  const updateMutation = useUpdateGroup()

  if (!open) return null

  const handleSubmit = async (values: GroupFormValues) => {
    try {
      await updateMutation.mutateAsync({
        groupId: group.id,
        values,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to update group:', err)
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
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Group Details</h2>
            <p className="text-xs text-slate-500">
              Update name, type, and mandate for {group.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <GroupForm
            initialValues={{
              name: group.name,
              type: group.type,
              description: group.description || '',
            }}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={updateMutation.isPending}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </div>
  )
}
