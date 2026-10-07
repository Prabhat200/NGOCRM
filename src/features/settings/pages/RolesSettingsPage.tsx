import { useState, useId } from 'react'
import { useAuth } from '@/features/auth/context'
import {
  useRolesWithDetails,
  useSystemPermissions,
  useUpdateRolePermissions,
  useCreateCustomRole,
  useDeleteCustomRole,
} from '../hooks/useSettings'
import { RoleWithDetails, SystemPermission } from '../types/settings.types'
import { PERMISSION_CATEGORIES } from '../utils/permissionCatalog'
import {
  ShieldCheck,
  Shield,
  Users,
  Lock,
  Plus,
  Trash2,
  X,
  Save,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

export function RolesSettingsPage() {
  const { roles: userRoles, hasPermission, refreshAuth } = useAuth()
  const isSuperAdmin = userRoles.some((r) => r.slug === 'super_admin')
  const canManageRoles = hasPermission('users.manage_roles') || hasPermission('settings.manage')

  const { data: roles = [], isLoading: rolesLoading } = useRolesWithDetails()
  const { data: allPermissions = [], isLoading: permsLoading } = useSystemPermissions()

  const updatePermissionsMutation = useUpdateRolePermissions()
  const createRoleMutation = useCreateCustomRole()
  const deleteRoleMutation = useDeleteCustomRole()

  // Selected Role for Permission Editing
  const [selectedRole, setSelectedRole] = useState<RoleWithDetails | null>(null)
  const [editedPermissionIds, setEditedPermissionIds] = useState<string[]>([])
  const [isConfirmingSave, setIsConfirmingSave] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Custom Role Creation Modal
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [newRolePermissionIds, setNewRolePermissionIds] = useState<string[]>([])
  const [createError, setCreateError] = useState<string | null>(null)

  // Custom Role Deletion State
  const [roleToDelete, setRoleToDelete] = useState<RoleWithDetails | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const rawRoleId = useId()
  const uniquePrefix = rawRoleId.replace(/:/g, '')

  // Open Permission Editor for a Role
  const handleOpenEditor = (role: RoleWithDetails) => {
    setSelectedRole(role)
    setEditedPermissionIds([...role.permission_ids])
    setIsConfirmingSave(false)
    setModalError(null)
    setSaveSuccess(false)
  }

  // Toggle permission check in Editor
  const handleTogglePermission = (permissionId: string) => {
    setEditedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  // Toggle permission check in Create Modal
  const handleToggleNewRolePermission = (permissionId: string) => {
    setNewRolePermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  // Save Role Permissions
  const handleSavePermissions = async () => {
    if (!selectedRole || !canManageRoles) return

    if (selectedRole.slug === 'super_admin' && !isSuperAdmin) {
      setModalError('Only a Super Admin can modify Super Admin permissions.')
      return
    }

    if (selectedRole.slug === 'super_admin' && editedPermissionIds.length === 0) {
      setModalError('Denied: Cannot strip all permissions from Super Admin.')
      return
    }

    try {
      setModalError(null)
      await updatePermissionsMutation.mutateAsync({
        roleId: selectedRole.id,
        permissionIds: editedPermissionIds,
      })
      await refreshAuth()
      setSaveSuccess(true)
      setIsConfirmingSave(false)
      setTimeout(() => {
        setSelectedRole(null)
        setSaveSuccess(false)
      }, 1500)
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed to update permissions.')
      setIsConfirmingSave(false)
    }
  }

  // Create Custom Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoleName.trim()) {
      setCreateError('Role name is required.')
      return
    }

    try {
      setCreateError(null)
      await createRoleMutation.mutateAsync({
        name: newRoleName.trim(),
        description: newRoleDescription.trim() || undefined,
        permissionIds: newRolePermissionIds,
      })
      setIsCreateRoleOpen(false)
      setNewRoleName('')
      setNewRoleDescription('')
      setNewRolePermissionIds([])
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create role.')
    }
  }

  // Delete Custom Role
  const handleDeleteRole = async () => {
    if (!roleToDelete) return

    try {
      setDeleteError(null)
      await deleteRoleMutation.mutateAsync(roleToDelete.id)
      setRoleToDelete(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete role.')
    }
  }

  // Group permissions by category
  const permissionsByCategory = PERMISSION_CATEGORIES.map((category) => ({
    category,
    permissions: allPermissions.filter((p) => p.category === category),
  })).filter((group) => group.permissions.length > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure organizational portal roles, inspect user assignments, and manage granular feature permissions.
          </p>
        </div>

        {canManageRoles && (
          <button
            type="button"
            onClick={() => {
              setIsCreateRoleOpen(true)
              setNewRoleName('')
              setNewRoleDescription('')
              setNewRolePermissionIds([])
              setCreateError(null)
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Role</span>
          </button>
        )}
      </div>

      {/* Roles List Grid */}
      {rolesLoading || permsLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading roles and permission catalog...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => {
            const isSuper = role.slug === 'super_admin'
            return (
              <div
                key={role.id}
                className={`p-5 bg-white border rounded-xl shadow-2xs flex flex-col justify-between transition-all ${
                  isSuper
                    ? 'border-purple-200 hover:border-purple-300'
                    : 'border-slate-200/80 hover:border-blue-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSuper ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-600'
                        }`}
                      >
                        {isSuper ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{role.name}</h2>
                        <span className="text-[10px] text-slate-400 font-mono">{role.slug}</span>
                      </div>
                    </div>

                    {role.is_system_role ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                        System Role
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Custom
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[2rem]">
                    {role.description || 'Standard organizational portal role.'}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">{role.assigned_user_count}</span>{' '}
                      <span>{role.assigned_user_count === 1 ? 'user' : 'users'}</span>
                    </div>

                    <div className="text-[11px] font-medium text-slate-600">
                      {role.permission_ids.length} permissions
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditor(role)}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50/60 hover:bg-blue-100/80 transition-colors cursor-pointer text-center"
                  >
                    View & Edit Permissions
                  </button>

                  {!role.is_system_role && canManageRoles && (
                    <button
                      type="button"
                      onClick={() => {
                        setRoleToDelete(role)
                        setDeleteError(null)
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Custom Role"
                      aria-label={`Delete custom role ${role.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Permission Detail / Editor Modal */}
      {selectedRole && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50"
        >
          <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{selectedRole.name} Permissions</h2>
                    {selectedRole.is_system_role && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        System Protected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedRole.description || 'Configure authorized capabilities for this role.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRole(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Impact Banner */}
            <div className="px-6 py-2.5 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-700" />
                <span>
                  These permission changes will affect <strong>{selectedRole.assigned_user_count}</strong>{' '}
                  {selectedRole.assigned_user_count === 1 ? 'user' : 'users'} currently assigned to this role.
                </span>
              </div>
              <span className="font-semibold">{editedPermissionIds.length} active grants</span>
            </div>

            {/* Error & Success Messages */}
            {modalError && (
              <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 shrink-0">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {saveSuccess && (
              <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Role permissions successfully updated and logged to audit!</span>
              </div>
            )}

            {/* Permission Matrix Content (Grouped Vertically for Full Mobile & Desktop Usability) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {permissionsByCategory.map(({ category, permissions }) => (
                <div key={category} className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {category}
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      {permissions.filter((p) => editedPermissionIds.includes(p.id)).length} / {permissions.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {permissions.map((perm: SystemPermission) => {
                      const isChecked = editedPermissionIds.includes(perm.id)
                      const isSuperAdminRole = selectedRole.slug === 'super_admin'
                      const isEditable = canManageRoles && (!isSuperAdminRole || isSuperAdmin)
                      const checkboxId = `${uniquePrefix}-perm-${perm.id}`

                      return (
                        <label
                          key={perm.id}
                          htmlFor={checkboxId}
                          className={`p-3 rounded-xl border transition-all flex items-start gap-3 select-none ${
                            isChecked
                              ? 'bg-blue-50/30 border-blue-200 shadow-2xs'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50/50'
                          } ${isEditable ? 'cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                        >
                          <input
                            type="checkbox"
                            id={checkboxId}
                            disabled={!isEditable}
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.id)}
                            className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-900 block leading-tight">
                              {perm.label}
                            </span>
                            <span className="text-[11px] text-slate-500 block leading-normal">
                              {perm.description}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                {selectedRole.slug === 'super_admin' && !isSuperAdmin
                  ? 'Only a Super Admin can alter Super Admin permissions.'
                  : 'Changes take effect immediately upon saving.'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>

                {canManageRoles && (
                  <>
                    {isConfirmingSave ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsConfirmingSave(false)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleSavePermissions}
                          disabled={updatePermissionsMutation.isPending}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-2xs transition-colors cursor-pointer"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>
                            {updatePermissionsMutation.isPending ? 'Applying...' : 'Confirm Update'}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsConfirmingSave(true)}
                        disabled={
                          selectedRole.slug === 'super_admin' && !isSuperAdmin
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Permissions</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Custom Role Modal */}
      {isCreateRoleOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50"
        >
          <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-bold text-slate-900">Create Custom Role</h2>
              <button
                type="button"
                onClick={() => setIsCreateRoleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-5 flex-1 overflow-y-auto space-y-4">
              {createError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Role Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. Program Coordinator, Field Auditor"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Mandate and responsibilities of this custom role..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Initial Permissions</span>
                  <span className="text-[11px] text-slate-400">
                    {newRolePermissionIds.length} selected
                  </span>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                  {permissionsByCategory.map(({ category, permissions }) => (
                    <div key={category} className="space-y-2">
                      <span className="text-[11px] font-bold uppercase text-slate-400 block">
                        {category}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {permissions.map((perm) => (
                          <label
                            key={perm.id}
                            className="p-2 rounded-lg border border-slate-200 flex items-start gap-2 text-xs cursor-pointer hover:bg-slate-50"
                          >
                            <input
                              type="checkbox"
                              checked={newRolePermissionIds.includes(perm.id)}
                              onChange={() => handleToggleNewRolePermission(perm.id)}
                              className="w-3.5 h-3.5 mt-0.5 rounded text-blue-600 border-slate-300"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block leading-tight">
                                {perm.label}
                              </span>
                              <span className="text-[10px] text-slate-400 block line-clamp-1">
                                {perm.description}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateRoleOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{createRoleMutation.isPending ? 'Creating...' : 'Create Role'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Custom Role Confirmation Dialog */}
      {roleToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Delete Custom Role?</h2>
                <p className="text-xs text-slate-500">"{roleToDelete.name}"</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete this custom role? This action is permanent and will remove all
              permission mappings for this role.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRole}
                disabled={deleteRoleMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
