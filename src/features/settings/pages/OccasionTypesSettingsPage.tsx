import { useState } from 'react'
import { useAuth } from '@/features/auth/context'
import {
  useOccasionTypes,
  useCreateOccasionType,
  useUpdateOccasionType,
} from '../hooks/useSettings'
import { OccasionType } from '../types/settings.types'
import {
  CalendarDays,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save,
} from 'lucide-react'

export function OccasionTypesSettingsPage() {
  const { hasPermission } = useAuth()
  const canManage = hasPermission('settings.manage')

  const { data: occasionTypes = [], isLoading, isError, error } = useOccasionTypes()
  const createTypeMutation = useCreateOccasionType()
  const updateTypeMutation = useUpdateOccasionType()

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingType, setEditingType] = useState<OccasionType | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formIcon, setFormIcon] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingType(null)
    setFormName('')
    setFormDescription('')
    setFormIcon('')
    setFormIsActive(true)
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (type: OccasionType) => {
    setEditingType(type)
    setFormName(type.name)
    setFormDescription(type.description || '')
    setFormIcon(type.icon || '')
    setFormIsActive(type.is_active)
    setFormError(null)
    setIsModalOpen(true)
  }

  // Handle Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Occasion type name is required')
      return
    }

    try {
      setFormError(null)
      if (editingType) {
        await updateTypeMutation.mutateAsync({
          id: editingType.id,
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          icon: formIcon.trim() || undefined,
          isActive: formIsActive,
        })
      } else {
        await createTypeMutation.mutateAsync({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          icon: formIcon.trim() || undefined,
        })
      }
      setIsModalOpen(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Operation failed.')
    }
  }

  // Quick Deactivate / Reactivate Toggle
  const handleToggleActive = async (type: OccasionType) => {
    if (!canManage) return
    try {
      await updateTypeMutation.mutateAsync({
        id: type.id,
        name: type.name,
        description: type.description || undefined,
        icon: type.icon || undefined,
        isActive: !type.is_active,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update occasion type status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Occasion Types</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure meeting and event classifications (AGMs, Executive Meetings, Workshops, Programs).
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Occasion Type</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-400">Loading occasion types...</div>
      ) : isError ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
          <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-xs text-rose-800 font-medium">
            {error instanceof Error ? error.message : 'Failed to load occasion types.'}
          </p>
        </div>
      ) : occasionTypes.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarDays className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">No occasion types yet.</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Create occasion types for meetings, programs, and other activities.
          </p>
          {canManage && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Occasion Type</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4 hidden sm:table-cell">Description</th>
                <th className="py-3 px-4">Status</th>
                {canManage && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {occasionTypes.map((type) => (
                <tr key={type.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <CalendarDays className={`w-4 h-4 ${type.is_active ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span>{type.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 hidden sm:table-cell max-w-xs truncate">
                    {type.description || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    {type.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Inactive</span>
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(type)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                          title="Edit Occasion Type"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(type)}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                            type.is_active
                              ? 'text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {type.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50"
        >
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">
                {editingType ? 'Edit Occasion Type' : 'Create Occasion Type'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Type Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Annual General Meeting, Board Meeting"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the occasion type..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {editingType && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="typeIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="typeIsActive" className="text-xs text-slate-700 cursor-pointer font-medium">
                    Active (available for new occasions)
                  </label>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTypeMutation.isPending || updateTypeMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {createTypeMutation.isPending || updateTypeMutation.isPending
                      ? 'Saving...'
                      : editingType
                      ? 'Save Changes'
                      : 'Create Occasion Type'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
