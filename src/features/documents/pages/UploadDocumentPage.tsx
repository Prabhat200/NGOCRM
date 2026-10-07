import { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ChevronDown, AlertCircle } from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { FileUploader } from '../components/FileUploader'
import {
  createDocumentSchema,
  type CreateDocumentFormValues,
} from '../schemas/document.schema'
import { documentService } from '../services/document.service'
import { useDocumentTaxonomy } from '../hooks/useDocuments'

export function UploadDocumentPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedOccasionId = searchParams.get('occasion') || ''
  const preselectedGroupId = searchParams.get('group') || ''

  const { organization } = useAuth()
  const { data: taxonomy } = useDocumentTaxonomy()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [showMoreDetails, setShowMoreDetails] = useState(
    Boolean(preselectedOccasionId || preselectedGroupId)
  )
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateDocumentFormValues>({
    resolver: zodResolver(createDocumentSchema),
    defaultValues: {
      title: '',
      description: '',
      document_number: '',
      category_id: '',
      occasion_id: preselectedOccasionId,
      owner_group_id: preselectedGroupId,
      document_date: '',
      fiscal_year: '',
      status: 'draft',
      access_mode: 'restricted',
      confidentiality: 'internal',
      expires_at: '',
      change_note: '',
    },
  })

  const accessMode = useWatch({ control, name: 'access_mode' })

  // When a file is dropped or selected, suggest a title if not already provided (Rule 20)
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    setUploadError(null)
    if (file) {
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .trim()
      // Prefill title if empty
      setValue('title', cleanName, { shouldValidate: true })
    }
  }

  const onSubmit = async (values: CreateDocumentFormValues) => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload.')
      return
    }

    if (!organization?.id) {
      setUploadError('Active organization context is missing.')
      return
    }

    setUploadError(null)
    setIsSubmitting(true)

    try {
      const newDocId = await documentService.createDocumentWithFile(
        values,
        selectedFile,
        organization.id
      )
      navigate(`/documents/${newDocId}`, { replace: true })
    } catch (err: unknown) {
      const e = err as Error
      setUploadError(e.message || 'Upload failed. Your document details have been preserved.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header with back link */}
      <PageHeader
        title="Upload Document"
        description="Add a new record to your organization's archive."
        breadcrumbs={
          <Link
            to="/documents"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to documents</span>
          </Link>
        }
      />

      {uploadError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 shadow-xs"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
          <div>
            <p className="font-semibold text-rose-900">Upload Incomplete</p>
            <p className="mt-0.5">{uploadError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* 1. File Upload Dropzone (Rule 17, 18, 19) */}
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-3">
            <Label required className="text-sm font-semibold">
              Document File
            </Label>
            <FileUploader
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        {/* 2. Primary Required Information (Rule 20) */}
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="title" required>
                Document Title
              </Label>
              <Input
                id="title"
                placeholder="e.g., Annual General Meeting Minutes 2026"
                className="mt-1.5 text-sm"
                error={!!errors.title}
                disabled={isSubmitting}
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-600" role="alert">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category_id">Category</Label>
                <select
                  id="category_id"
                  className="mt-1.5 w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={isSubmitting}
                  {...register('category_id')}
                >
                  <option value="">Select Category</option>
                  {taxonomy?.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="occasion_id">Linked Occasion</Label>
                <select
                  id="occasion_id"
                  className="mt-1.5 w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  disabled={isSubmitting}
                  {...register('occasion_id')}
                >
                  <option value="">None / Not linked</option>
                  {taxonomy?.occasions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Access Scope (Rule 22, 23) */}
            <div className="pt-2">
              <Label required>Who can see this document?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
                {[
                  {
                    value: 'organization',
                    title: 'Everyone',
                    desc: 'All active members in organization',
                  },
                  {
                    value: 'restricted',
                    title: 'Selected Groups',
                    desc: 'Creator and permitted groups/people',
                  },
                  {
                    value: 'private',
                    title: 'Private',
                    desc: 'Only creator and managers',
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      accessMode === opt.value
                        ? 'border-blue-600 bg-blue-50/50 text-blue-950 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        value={opt.value}
                        disabled={isSubmitting}
                        {...register('access_mode')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-semibold text-xs">{opt.title}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 pl-5">
                      {opt.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Additional Metadata Collapsible (Rule 21) */}
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <button
              type="button"
              onClick={() => setShowMoreDetails((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 focus-visible:outline-none cursor-pointer"
            >
              <span>More details (Document number, dates, description)</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showMoreDetails ? 'rotate-180' : ''}`}
              />
            </button>

            {showMoreDetails && (
              <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in-50 duration-150">
                <div>
                  <Label htmlFor="description">Description or Summary</Label>
                  <textarea
                    id="description"
                    rows={3}
                    placeholder="Brief background or purpose of this record..."
                    className="mt-1.5 w-full text-xs rounded-lg border border-slate-200 bg-white p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    disabled={isSubmitting}
                    {...register('description')}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="document_number">Document Number / Reference</Label>
                    <Input
                      id="document_number"
                      placeholder="e.g., DOC-2026-001"
                      className="mt-1.5 text-xs"
                      disabled={isSubmitting}
                      {...register('document_number')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="document_date">Official Document Date</Label>
                    <Input
                      id="document_date"
                      type="date"
                      className="mt-1.5 text-xs"
                      disabled={isSubmitting}
                      {...register('document_date')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fiscal_year">Fiscal Year</Label>
                    <Input
                      id="fiscal_year"
                      placeholder="e.g., 2082/83 or 2026/27"
                      className="mt-1.5 text-xs"
                      disabled={isSubmitting}
                      {...register('fiscal_year')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="owner_group_id">Owner Committee / Group</Label>
                    <select
                      id="owner_group_id"
                      className="mt-1.5 w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={isSubmitting}
                      {...register('owner_group_id')}
                    >
                      <option value="">None / General Organization</option>
                      {taxonomy?.groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="confidentiality">Confidentiality Level</Label>
                    <select
                      id="confidentiality"
                      className="mt-1.5 w-full text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      disabled={isSubmitting}
                      {...register('confidentiality')}
                    >
                      <option value="internal">Internal (Default)</option>
                      <option value="confidential">Confidential</option>
                      <option value="strictly_confidential">Strictly Confidential</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="expires_at">Expiration Date</Label>
                    <Input
                      id="expires_at"
                      type="date"
                      className="mt-1.5 text-xs"
                      disabled={isSubmitting}
                      {...register('expires_at')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="change_note">Initial Version Note</Label>
                  <Input
                    id="change_note"
                    placeholder="e.g., Initial finalized upload"
                    className="mt-1.5 text-xs"
                    disabled={isSubmitting}
                    {...register('change_note')}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => navigate('/documents')}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!selectedFile || isSubmitting}
            className="min-w-32"
          >
            Save & Upload
          </Button>
        </div>
      </form>
    </div>
  )
}
