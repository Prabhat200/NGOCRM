import { useState } from 'react'
import { X, Shield, User, Users, Trash2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { DocumentAccessMode, DocumentAccessData } from '../types/document.types'
import { useUpdateDocumentAccess } from '../hooks/useDocuments'

export interface ManageAccessDialogProps {
  documentId: string
  currentAccessMode: DocumentAccessMode
  accessData: DocumentAccessData | undefined
  onClose: () => void
}

export function ManageAccessDialog({
  documentId,
  currentAccessMode,
  accessData,
  onClose,
}: ManageAccessDialogProps) {
  const [accessMode, setAccessMode] = useState<DocumentAccessMode>(currentAccessMode)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const updateAccessMutation = useUpdateDocumentAccess()

  const handleModeChange = async (newMode: DocumentAccessMode) => {
    setAccessMode(newMode)
    setError(null)
    setSuccess(null)
    try {
      await updateAccessMutation.mutateAsync({
        documentId,
        accessMode: newMode,
      })
      setSuccess(`Access scope updated to ${newMode}.`)
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Failed to update access mode.')
    }
  }

  const handleRevokeUser = async (userId: string) => {
    setError(null)
    setSuccess(null)
    try {
      await updateAccessMutation.mutateAsync({
        documentId,
        userGrants: [{ user_id: userId, access_level: 'view', action: 'revoke' }],
      })
      setSuccess('Access grant removed.')
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Failed to revoke access.')
    }
  }

  const handleRevokeGroup = async (groupId: string) => {
    setError(null)
    setSuccess(null)
    try {
      await updateAccessMutation.mutateAsync({
        documentId,
        groupGrants: [{ group_id: groupId, access_level: 'view', action: 'revoke' }],
      })
      setSuccess('Group access removed.')
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Failed to revoke group access.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50 duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-access-title"
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Shield className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 id="manage-access-title" className="text-base font-bold text-slate-900">
              Manage Document Access
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
            >
              {success}
            </div>
          )}

          {/* Access Scope Radio (Rule 23 & 42) */}
          <div className="space-y-2">
            <Label>Who can access this document?</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {[
                { id: 'organization', label: 'Everyone', desc: 'All active members' },
                { id: 'restricted', label: 'Restricted', desc: 'Selected people & groups' },
                { id: 'private', label: 'Private', desc: 'Creator & managers only' },
              ].map((opt) => (
                <label
                  key={opt.id}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    accessMode === opt.id
                      ? 'border-blue-600 bg-blue-50/50 text-blue-950 ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="access_mode"
                      value={opt.id}
                      checked={accessMode === opt.id}
                      onChange={() => handleModeChange(opt.id as DocumentAccessMode)}
                      className="text-blue-600 focus:ring-blue-500"
                      disabled={updateAccessMutation.isPending}
                    />
                    <span className="font-semibold text-xs">{opt.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 pl-5">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Current Grants List */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <Label>People & Groups with explicit access</Label>

            {(!accessData || (accessData.users.length === 0 && accessData.groups.length === 0)) ? (
              <p className="text-xs text-slate-500 italic py-3">
                No explicit grants assigned. Document access is governed by the access scope.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-1">
                {/* User Grants */}
                {accessData.users.map((u) => (
                  <div key={u.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="font-medium text-slate-900 block truncate">{u.display_name}</span>
                        {u.position_title && (
                          <span className="text-[10px] text-slate-500 block truncate">{u.position_title}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Can {u.access_level}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRevokeUser(u.user_id)}
                        disabled={updateAccessMutation.isPending}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        aria-label={`Revoke access for ${u.display_name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Group Grants */}
                {accessData.groups.map((g) => (
                  <div key={g.id} className="p-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-slate-900 truncate">{g.group_name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Can {g.access_level}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRevokeGroup(g.group_id)}
                        disabled={updateAccessMutation.isPending}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        aria-label={`Revoke access for ${g.group_name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button type="button" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
