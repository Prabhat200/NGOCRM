import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  editDocumentMetadataSchema,
  type EditDocumentMetadataFormValues,
} from '../schemas/document.schema'
import type { DocumentDetail } from '../types/document.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Loader2 } from 'lucide-react'

interface EditMetadataDialogProps {
  document: DocumentDetail
  taxonomy?: {
    categories: Array<{ id: string; name: string }>
    occasions: Array<{ id: string; name: string }>
    groups: Array<{ id: string; name: string }>
  }
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: EditDocumentMetadataFormValues) => Promise<void>
  isSubmitting: boolean
}

export function EditMetadataDialog({
  document,
  taxonomy,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: EditMetadataDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EditDocumentMetadataFormValues>({
    resolver: zodResolver(editDocumentMetadataSchema),
    defaultValues: {
      title: document.title || '',
      description: document.description || '',
      document_number: document.document_number || '',
      category_id: document.category_id || '',
      occasion_id: document.occasion_id || '',
      owner_group_id: document.owner_group_id || '',
      document_date: document.document_date || '',
      fiscal_year: document.fiscal_year || '',
      status: (document.status as 'draft' | 'final' | 'under_review' | 'archived') || 'draft',
      confidentiality: document.confidentiality || 'internal',
      expires_at: document.expires_at || '',
    },
  })

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-8">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 id="edit-dialog-title" className="text-base font-bold text-slate-900">
              Edit Document Details
            </h2>
            <p className="text-xs text-slate-500">Update descriptive metadata for this record.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title *</Label>
            <Input id="edit-title" {...register('title')} placeholder="Document title" />
            {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <textarea
              id="edit-description"
              {...register('description')}
              rows={2}
              placeholder="Summary or purpose of this document..."
              className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Category & Occasion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-category">Category</Label>
              <select
                id="edit-category"
                {...register('category_id')}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">None</option>
                {taxonomy?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-occasion">Occasion</Label>
              <select
                id="edit-occasion"
                {...register('occasion_id')}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">None</option>
                {taxonomy?.occasions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Owner Group & Document Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-group">Owner Group</Label>
              <select
                id="edit-group"
                {...register('owner_group_id')}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">None</option>
                {taxonomy?.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-doc-num">Doc Number</Label>
              <Input id="edit-doc-num" {...register('document_number')} placeholder="e.g. DOC-2026-001" />
            </div>
          </div>

          {/* Date & Fiscal Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-doc-date">Document Date</Label>
              <Input id="edit-doc-date" type="date" {...register('document_date')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-fiscal-year">Fiscal Year</Label>
              <Input id="edit-fiscal-year" {...register('fiscal_year')} placeholder="e.g. FY 2026/27" />
            </div>
          </div>

          {/* Status & Confidentiality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                {...register('status')}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="draft">Draft</option>
                <option value="final">Final</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-confidentiality">Confidentiality</Label>
              <select
                id="edit-confidentiality"
                {...register('confidentiality')}
                className="w-full text-xs rounded-lg border border-slate-200 px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="general">General</option>
                <option value="internal">Internal</option>
                <option value="restricted">Restricted</option>
                <option value="confidential">Confidential</option>
              </select>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-expires-at">Expiration Date</Label>
            <Input id="edit-expires-at" type="date" {...register('expires_at')} />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
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
