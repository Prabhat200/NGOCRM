import { X } from 'lucide-react'
import { MemberForm } from './MemberForm'
import { useUpdateMember } from '../hooks/useMembers'
import type { MemberDetail } from '../types/member.types'
import type { MemberFormValues } from '../schemas/member.schema'

interface EditMemberDialogProps {
  member: MemberDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: EditMemberDialogProps) {
  const updateMutation = useUpdateMember()

  if (!open) return null

  const handleSubmit = async (values: MemberFormValues) => {
    try {
      await updateMutation.mutateAsync({
        memberId: member.id,
        values,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err) {
      console.error('Failed to update member:', err)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Edit Member Details</h2>
            <p className="text-xs text-slate-500">
              Update organizational information for {member.full_name}.
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
          <MemberForm
            initialValues={{
              first_name: member.first_name,
              middle_name: member.middle_name || '',
              last_name: member.last_name,
              membership_number: member.membership_number || '',
              email: member.email || '',
              phone: member.phone || '',
              address: member.address || '',
              position_title: member.position_title || '',
              joined_at: member.joined_at || '',
              left_at: member.left_at || '',
              status: member.status,
              notes: member.notes || '',
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
