import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Mail, X } from 'lucide-react'
import { usePortalRoles, useInvitePortalUser } from '../hooks/useMembers'
import type { MemberDetail, MemberListItem } from '../types/member.types'

interface GivePortalAccessDialogProps {
  member: MemberDetail | MemberListItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function GivePortalAccessDialog({
  member,
  open,
  onOpenChange,
  onSuccess,
}: GivePortalAccessDialogProps) {
  const [email, setEmail] = useState((member as any).email || '')
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: roles = [], isLoading: rolesLoading } = usePortalRoles()
  const inviteMutation = useInvitePortalUser()

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim()) {
      setErrorMsg('Email address is required.')
      return
    }

    if (!selectedRoleId) {
      setErrorMsg('Please select a portal role.')
      return
    }

    try {
      await inviteMutation.mutateAsync({
        memberId: member.id,
        email: email.trim(),
        roleId: selectedRoleId,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send portal invitation.')
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
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Give Portal Access</h2>
              <p className="text-xs text-slate-500">
                Send an invitation to join the authenticated NGO operations portal.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Member</label>
            <p className="text-xs text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              {member.full_name}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. member@ngo.org"
              required
              className="text-xs h-9 bg-white"
            />
            <p className="text-[11px] text-slate-500">
              The invitation link will be sent to this address.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Portal Role <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={rolesLoading}
              required
              className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer disabled:bg-slate-50"
            >
              <option value="">
                {rolesLoading ? 'Loading roles...' : 'Select a portal role...'}
              </option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Determines system-wide portal permissions and dashboard access.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={inviteMutation.isPending}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={inviteMutation.isPending || !selectedRoleId}
              className="text-xs h-9 bg-blue-600 hover:bg-blue-700 gap-1.5"
            >
              {inviteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Send Invitation</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
