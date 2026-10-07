import { useState } from 'react'
import { Download, History, Plus, FileText, CheckCircle2 } from 'lucide-react'
import type { DocumentVersion } from '../types/document.types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { formatFileSize } from '../utils/fileTypes'
import { formatDateTime } from '@/lib/utils/dateTime'
import { documentService } from '../services/document.service'
import { UploadVersionDialog } from './UploadVersionDialog'

export interface VersionHistoryProps {
  documentId: string
  versions: DocumentVersion[]
  currentVersionId: string | null
  canUploadVersion: boolean
  organizationId: string
  timezone?: string
}

export function VersionHistory({
  documentId,
  versions,
  currentVersionId,
  canUploadVersion,
  organizationId,
  timezone,
}: VersionHistoryProps) {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [downloadingVersionId, setDownloadingVersionId] = useState<string | null>(null)

  const handleDownload = async (v: DocumentVersion) => {
    setDownloadingVersionId(v.id)
    try {
      await documentService.downloadFile(
        documentId,
        v.storage_path,
        v.original_filename,
        v.id
      )
    } catch (err) {
      console.error('Failed to download version:', err)
    } finally {
      setDownloadingVersionId(null)
    }
  }

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-500" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-slate-900">
            Version History
          </CardTitle>
        </div>

        {canUploadVersion && (
          <Button
            size="sm"
            onClick={() => setIsUploadOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Upload New Version</span>
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {versions.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">
            No physical versions available for this document.
          </p>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {versions.map((v) => {
              const isCurrent = v.id === currentVersionId
              const isDownloading = downloadingVersionId === v.id

              return (
                <div key={v.id} className="relative group">
                  {/* Timeline bullet */}
                  <div
                    className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isCurrent
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors shadow-2xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          v{v.version_number}
                        </span>
                        {isCurrent && (
                          <Badge variant="success" className="text-[10px] gap-1 px-1.5 py-0">
                            <CheckCircle2 className="w-3 h-3" />
                            Current Version
                          </Badge>
                        )}
                        <span className="text-slate-400 text-xs">&bull;</span>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(v.uploaded_at, timezone)}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isDownloading}
                        onClick={() => handleDownload(v)}
                        className="gap-1.5 text-xs h-7 self-start sm:self-auto"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isDownloading ? 'Downloading...' : 'Download'}</span>
                      </Button>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Uploaded by <strong className="text-slate-900 font-medium">{v.uploader_name}</strong></span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 font-mono text-slate-500 text-[11px]">
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        {v.original_filename} ({formatFileSize(v.file_size)})
                      </span>
                    </div>

                    {v.change_note && (
                      <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 italic">
                        &ldquo;{v.change_note}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      {/* Upload New Version Modal */}
      {isUploadOpen && (
        <UploadVersionDialog
          documentId={documentId}
          organizationId={organizationId}
          onClose={() => setIsUploadOpen(false)}
        />
      )}
    </Card>
  )
}
