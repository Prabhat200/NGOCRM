import { Archive, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ArchiveDialogProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function ArchiveConfirmDialog({
  title,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ArchiveDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50 duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-dialog-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Archive className="w-5 h-5" aria-hidden="true" />
        </div>

        <div>
          <h2 id="archive-dialog-title" className="text-base font-bold text-slate-900">
            Archive &ldquo;{title}&rdquo;?
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            The document will disappear from normal views, but its versions and history will remain available in the Archived archive.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isPending}
            disabled={isPending}
          >
            Archive Document
          </Button>
        </div>
      </div>
    </div>
  )
}

export interface RestoreDialogProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function RestoreConfirmDialog({
  title,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: RestoreDialogProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-50 duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-dialog-title"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <RotateCcw className="w-5 h-5" aria-hidden="true" />
        </div>

        <div>
          <h2 id="restore-dialog-title" className="text-base font-bold text-slate-900">
            Restore &ldquo;{title}&rdquo;?
          </h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            The document will be returned to normal active views with its full version history, tags, and permissions intact.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            isLoading={isPending}
            disabled={isPending}
          >
            Restore Document
          </Button>
        </div>
      </div>
    </div>
  )
}
