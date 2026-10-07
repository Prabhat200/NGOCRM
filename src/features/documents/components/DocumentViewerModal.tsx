import { useState, useEffect } from 'react'
import {
  X,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize, getFileTypeInfo } from '../utils/fileTypes'
import { documentService } from '../services/document.service'
import type { DocumentDetail, DocumentVersion } from '../types/document.types'

export interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: DocumentDetail
  version?: DocumentVersion | null
  onDownload?: () => void
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  version: propVersion,
  onDownload,
}: DocumentViewerModalProps) {
  const version = propVersion || document.current_version
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  // Fetch signed preview URL when modal opens or version changes
  useEffect(() => {
    let isMounted = true
    if (!isOpen || !version?.storage_path) {
      setPreviewUrl(null)
      return
    }

    setIsLoading(true)
    setLoadError(null)
    setZoom(100)
    setRotation(0)

    documentService
      .getFileViewUrl(version.storage_path)
      .then((url) => {
        if (isMounted) {
          setPreviewUrl(url)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load preview URL:', err)
          setLoadError(err.message || 'Failed to load document preview.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, version?.storage_path])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !version) return null

  const fileInfo = getFileTypeInfo(version.mime_type, version.original_filename)
  const isImage =
    version.mime_type?.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(
      version.file_extension?.toLowerCase() || ''
    )
  const isPdf =
    version.mime_type === 'application/pdf' ||
    version.file_extension?.toLowerCase() === 'pdf'

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden text-white">
        {/* Top Action Bar */}
        <div className="h-16 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 id="viewer-title" className="text-base sm:text-lg font-bold text-white truncate">
                  {document.title}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
                  v{version.version_number}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {version.original_filename} &bull;{' '}
                {version.file_size ? formatFileSize(version.file_size) : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Image Controls */}
            {isImage && previewUrl && !isLoading && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-800/80 border border-slate-700 rounded-lg p-1 mr-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Zoom Out"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono px-1.5 text-slate-300 min-w-12 text-center">
                  {zoom}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Zoom In"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  title="Rotate"
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors ml-1 border-l border-slate-700 pl-2"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Open in New Tab */}
            {previewUrl && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new window"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Tab</span>
              </a>
            )}

            {/* Download */}
            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-white border-slate-700 h-9"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download</span>
              </Button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
              aria-label="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 bg-slate-950/60 relative overflow-auto flex items-center justify-center p-4">
          {isLoading ? (
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
              <p className="text-sm text-slate-400">Loading document preview...</p>
            </div>
          ) : loadError ? (
            <div className="text-center space-y-3 max-w-md p-6 bg-slate-900 border border-slate-800 rounded-xl">
              <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Preview Unavailable</h3>
              <p className="text-sm text-slate-400">{loadError}</p>
              {onDownload && (
                <Button size="sm" onClick={onDownload} className="mt-2">
                  <Download className="w-4 h-4 mr-2" />
                  Download File Directly
                </Button>
              )}
            </div>
          ) : isImage && previewUrl ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
              <img
                src={previewUrl}
                alt={document.title}
                style={{
                  transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-h-full max-w-full object-contain rounded-lg shadow-xl select-none"
              />
            </div>
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              title={document.title}
              className="w-full h-full rounded-lg border-0 bg-white"
            />
          ) : (
            <div className="text-center space-y-4 max-w-md p-8 bg-slate-900 border border-slate-800 rounded-2xl">
              <div
                className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${fileInfo.bgClass} ${fileInfo.colorClass}`}
              >
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{version.original_filename}</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {fileInfo.label} file ({version.file_size ? formatFileSize(version.file_size) : ''})
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  In-browser preview is optimized for PDF and image formats. You can open or download the file to inspect with desktop software.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Tab
                  </a>
                )}
                {onDownload && (
                  <Button onClick={onDownload} className="gap-2 text-sm font-semibold">
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
