import { useState, useEffect } from 'react'
import { Eye, Maximize2, ExternalLink, Download, FileText, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { documentService } from '../services/document.service'
import { formatFileSize, getFileTypeInfo } from '../utils/fileTypes'
import type { DocumentDetail } from '../types/document.types'

export interface DocumentInlinePreviewProps {
  document: DocumentDetail
  onExpand: () => void
  onDownload?: () => void
}

export function DocumentInlinePreview({
  document,
  onExpand,
  onDownload,
}: DocumentInlinePreviewProps) {
  const version = document.current_version
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (!version?.storage_path) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setHasError(false)

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
          console.error('Failed to load inline preview URL:', err)
          setHasError(true)
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [version?.storage_path])

  if (!version) return null

  const fileInfo = getFileTypeInfo(version.mime_type, version.original_filename)
  const isImage =
    version.mime_type?.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(
      version.file_extension?.toLowerCase() || ''
    )
  const isPdf =
    version.mime_type === 'application/pdf' ||
    version.file_extension?.toLowerCase() === 'pdf'

  return (
    <Card className="overflow-hidden border-slate-200 shadow-xs mb-6">
      <CardHeader className="py-3 px-5 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4.5 h-4.5 text-blue-700" />
          <CardTitle className="text-base font-bold text-slate-900">
            Document File Preview
          </CardTitle>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-800">
            v{version.version_number} &bull; {version.file_extension?.toUpperCase() || fileInfo.label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onExpand}
            className="gap-1.5 text-xs font-semibold h-8 px-3"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Fullscreen View</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 bg-slate-100/50 flex items-center justify-center min-h-[300px] max-h-[500px] overflow-hidden relative">
        {isLoading ? (
          <div className="py-12 text-center space-y-2">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500">Loading document preview...</p>
          </div>
        ) : hasError ? (
          <div className="py-12 text-center space-y-2">
            <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
            <p className="text-sm font-medium text-slate-600">Preview couldn&apos;t be loaded.</p>
            {onDownload && (
              <Button size="sm" variant="outline" onClick={onDownload} className="mt-2 text-xs">
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download File
              </Button>
            )}
          </div>
        ) : isImage && previewUrl ? (
          <div
            onClick={onExpand}
            className="w-full h-full p-4 flex items-center justify-center cursor-pointer group relative"
            title="Click to expand fullscreen"
          >
            <img
              src={previewUrl}
              alt={document.title}
              className="max-h-[460px] max-w-full object-contain rounded-lg shadow-sm transition-transform group-hover:scale-[1.01]"
            />
            <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Click to enlarge</span>
            </div>
          </div>
        ) : isPdf && previewUrl ? (
          <div className="w-full h-[480px]">
            <iframe
              src={previewUrl}
              title={document.title}
              className="w-full h-full border-0 bg-white"
            />
          </div>
        ) : (
          <div className="py-12 text-center space-y-3 p-6">
            <div
              className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${fileInfo.bgClass} ${fileInfo.colorClass}`}
            >
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">{version.original_filename}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {version.file_size ? formatFileSize(version.file_size) : ''} &bull; {fileInfo.label}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button size="sm" onClick={onExpand} className="gap-1.5 text-xs font-semibold">
                <Eye className="w-3.5 h-3.5" />
                <span>View Full Details</span>
              </Button>
              {onDownload && (
                <Button size="sm" variant="outline" onClick={onDownload} className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
