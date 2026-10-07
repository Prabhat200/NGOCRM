import { X } from 'lucide-react'
import { GroupForm } from './GroupForm'
import { useCreateGroup } from '../hooks/useGroups'
import { useAuth } from '@/features/auth/context'
import type { GroupFormValues } from '../schemas/group.schema'

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (newGroupId: string) => void
}

export function CreateGroupDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateGroupDialogProps) {
  const { organization } = useAuth()
  const createMutation = useCreateGroup()

  if (!open) return null

  const handleSubmit = async (values: GroupFormValues) => {
    if (!organization?.id) return
    try {
      const newGroupId = await createMutation.mutateAsync({
        values,
        organizationId: organization.id,
      })
      onOpenChange(false)
      onSuccess?.(newGroupId)
    } catch (err) {
      console.error('Failed to create group:', err)
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
            <h2 className="text-base font-bold text-slate-900">Create Committee / Group</h2>
            <p className="text-xs text-slate-500">
              Organize members into committees, departments, or initiative teams.
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
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={createMutation.isPending}
            submitLabel="Create Group"
          />
        </div>
      </div>
    </div>
  )
}
