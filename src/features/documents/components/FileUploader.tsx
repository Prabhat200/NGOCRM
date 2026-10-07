import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import { UploadCloud, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize, getFileTypeInfo } from '../utils/fileTypes'

const MAX_FILE_SIZE_BYTES = 52428800 // 50 MB

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'text/csv',
  'application/zip',
])

export interface FileUploaderProps {
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  disabled?: boolean
  error?: string | null
}

export function FileUploader({
  selectedFile,
  onFileSelect,
  disabled = false,
  error: externalError,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateAndSetFile = (file: File) => {
    setValidationError(null)

    // Check size limit (50 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError('This file is larger than the 50 MB upload limit.')
      return
    }

    // Check mime type if available
    if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
      setValidationError(
        'Unsupported file format. Supported formats: PDF, Word, Excel, PowerPoint, JPEG, PNG, WebP, Text, CSV, and ZIP.'
      )
      return
    }

    onFileSelect(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    setValidationError(null)
    onFileSelect(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const activeError = externalError || validationError

  // If a file is selected, show selected state
  if (selectedFile) {
    const fileInfo = getFileTypeInfo(selectedFile.type, selectedFile.name)
    const Icon = fileInfo.icon

    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${fileInfo.bgClass} ${fileInfo.colorClass}`}
              aria-hidden="true"
            >
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-sm text-slate-500 mt-0.5">
                {formatFileSize(selectedFile.size)} &bull; {fileInfo.label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="text-sm h-9 px-3.5"
            >
              Change
            </Button>
            <button
              type="button"
              disabled={disabled}
              onClick={handleRemove}
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              aria-label="Remove selected file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>
    )
  }

  // Drag and drop empty state
  return (
    <div className="space-y-2">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-9 text-center transition-all cursor-pointer select-none ${
          isDragging
            ? 'border-blue-600 bg-blue-50/60'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        role="region"
        aria-label="File upload dropzone"
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />

        <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3.5">
          <UploadCloud className="w-7 h-7" aria-hidden="true" />
        </div>

        <p className="text-base font-bold text-slate-900">
          Drop your file here, or{' '}
          <span className="text-blue-700 hover:underline">browse files</span>
        </p>
        <p className="text-sm text-slate-500 mt-1.5 max-w-sm mx-auto">
          PDF, Word, Excel, PowerPoint, images, text, CSV, and ZIP up to 50 MB
        </p>
      </div>

      {activeError && (
        <div
          role="alert"
          className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-start gap-2.5"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" aria-hidden="true" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  )
}
