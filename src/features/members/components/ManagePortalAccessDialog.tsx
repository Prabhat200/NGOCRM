import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { usePortalRoles, useUpdatePortalStatus, useUpdatePortalRoles } from '../hooks/useMembers'
import type { MemberDetail, PortalStatus } from '../types/member.types'

interface ManagePortalAccessDialogProps {
  member: MemberDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  canDisable?: boolean
  canManageRoles?: boolean
  onSuccess?: () => void
}

export function ManagePortalAccessDialog({
  member,
  open,
  onOpenChange,
  canDisable = false,
  canManageRoles = false,
  onSuccess,
}: ManagePortalAccessDialogProps) {
  const currentRoleId = member.portal_roles?.[0]?.id || ''
  const [selectedRoleId, setSelectedRoleId] = useState<string>(currentRoleId)
  const [selectedStatus, setSelectedStatus] = useState<PortalStatus>(member.portal_status)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: roles = [] } = usePortalRoles()
  const statusMutation = useUpdatePortalStatus()
  const rolesMutation = useUpdatePortalRoles()

  const isPending = statusMutation.isPending || rolesMutation.isPending

  if (!open) return null

  const handleSave = async () => {
    if (!member.portal_user_id) return
    setErrorMsg(null)

    try {
      if (canDisable && selectedStatus !== member.portal_status) {
        if (selectedStatus === 'active' || selectedStatus === 'suspended' || selectedStatus === 'disabled') {
          await statusMutation.mutateAsync({
            userId: member.portal_user_id,
            newStatus: selectedStatus,
            memberId: member.id,
          })
        }
      }

      if (canManageRoles && selectedRoleId && selectedRoleId !== currentRoleId) {
        await rolesMutation.mutateAsync({
          userId: member.portal_user_id,
          roleIds: [selectedRoleId],
          memberId: member.id,
        })
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update portal settings.')
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
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Portal Access</h2>
              <p className="text-xs text-slate-500">
                Update account status and authorization roles for {member.full_name}.
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

        <div className="space-y-4 pt-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Account Status Control */}
          {canDisable && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Account Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as PortalStatus)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
              >
                <option value="active">Active (Access allowed)</option>
                <option value="suspended">Suspended (Temporarily blocked)</option>
                <option value="disabled">Disabled (Permanently locked)</option>
              </select>
            </div>
          )}

          {/* Role Control */}
          {canManageRoles && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Portal Role</label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Note: Non-Super Admins cannot assign Super Admin authority.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="text-xs h-9 bg-blue-600 hover:bg-blue-700 gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Changes</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
