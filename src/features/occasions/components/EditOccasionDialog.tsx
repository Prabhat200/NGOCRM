import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X, Loader2 } from 'lucide-react'
import {
  editOccasionSchema,
  type EditOccasionFormValues,
} from '../schemas/occasion.schema'
import type { OccasionDetail, OccasionType } from '../types/occasion.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface EditOccasionDialogProps {
  occasion: OccasionDetail
  types?: OccasionType[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: EditOccasionFormValues) => Promise<void>
  isSubmitting: boolean
}

export function EditOccasionDialog({
  occasion,
  types = [],
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: EditOccasionDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditOccasionFormValues>({
    resolver: zodResolver(editOccasionSchema),
    defaultValues: {
      name: occasion.name || '',
      occasion_type_id: occasion.occasion_type_id || '',
      start_date: occasion.start_date || '',
      end_date: occasion.end_date || '',
      location: occasion.location || '',
      status: occasion.status || 'planned',
      fiscal_year: occasion.fiscal_year || '',
      description: occasion.description || '',
    },
  })

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-occasion-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 id="edit-occasion-title" className="text-base font-bold text-slate-900">
              Edit Occasion Details
            </h2>
            <p className="text-xs text-slate-500">
              Update scheduling, location, and metadata for this event.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-occ-name">Occasion Name *</Label>
            <Input id="edit-occ-name" {...register('name')} placeholder="e.g. Annual General Meeting 2026" />
            {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-occ-type">Occasion Type</Label>
              <select
                id="edit-occ-type"
                {...register('occasion_type_id')}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">None</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-occ-status">Status</Label>
              <select
                id="edit-occ-status"
                {...register('status')}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="planned">Planned</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Dates (Rule 14) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-occ-start-date">Start Date</Label>
              <Input id="edit-occ-start-date" type="date" {...register('start_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-occ-end-date">End Date</Label>
              <Input id="edit-occ-end-date" type="date" {...register('end_date')} />
              {errors.end_date && (
                <p className="text-xs text-rose-600">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Location & Fiscal Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-occ-location">Location / Venue</Label>
              <Input
                id="edit-occ-location"
                {...register('location')}
                placeholder="e.g. Kathmandu Hall / Zoom"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-occ-fy">Fiscal Year</Label>
              <Input id="edit-occ-fy" {...register('fiscal_year')} placeholder="e.g. 2026/27" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-occ-desc">Description & Purpose</Label>
            <textarea
              id="edit-occ-desc"
              rows={3}
              {...register('description')}
              placeholder="Background, agenda outline, or purpose of this program..."
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
