import { useState } from 'react'
import { X, UploadCloud, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FileUploader } from './FileUploader'
import { useUploadNewVersion } from '../hooks/useDocuments'

export interface UploadVersionDialogProps {
  documentId: string
  organizationId: string
  onClose: () => void
}

export function UploadVersionDialog({
  documentId,
  organizationId,
  onClose,
}: UploadVersionDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [changeNote, setChangeNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const uploadMutation = useUploadNewVersion()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file to upload.')
      return
    }

    setError(null)
    try {
      await uploadMutation.mutateAsync({
        documentId,
        file,
        organizationId,
        changeNote: changeNote.trim() || undefined,
      })
      onClose()
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || 'Failed to upload new version.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50 duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-version-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <UploadCloud className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 id="upload-version-title" className="text-base font-bold text-slate-900">
              Upload New Version
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <Label required>Updated Document File</Label>
            <div className="mt-1.5">
              <FileUploader
                selectedFile={file}
                onFileSelect={(f) => {
                  setFile(f)
                  setError(null)
                }}
                disabled={uploadMutation.isPending}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="change_note">What changed in this version? (Optional)</Label>
            <Input
              id="change_note"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="e.g., Corrected section 4.2 figures, signed copy"
              className="mt-1.5 text-xs sm:text-sm"
              disabled={uploadMutation.isPending}
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!file || uploadMutation.isPending}
              isLoading={uploadMutation.isPending}
            >
              Upload Version
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
