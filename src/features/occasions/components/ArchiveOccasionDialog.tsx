import { Button } from '@/components/ui/button'
import { Archive, RotateCcw, Loader2, AlertTriangle } from 'lucide-react'

interface ArchiveOccasionDialogProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function ArchiveOccasionDialog({
  title,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: ArchiveOccasionDialogProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-occ-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Archive className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <h2 id="archive-occ-title" className="text-base font-bold text-slate-900">
            Archive &ldquo;{title}&rdquo;?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            The occasion will disappear from normal views. Its documents and history will remain
            unchanged and accessible according to their own rules.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-600 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            Associated documents will <strong>not</strong> be deleted or archived automatically.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Archive Occasion</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

interface RestoreOccasionDialogProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isPending: boolean
}

export function RestoreOccasionDialog({
  title,
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: RestoreOccasionDialogProps) {
  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-occ-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <RotateCcw className="w-5 h-5" />
        </div>

        <div className="space-y-1.5">
          <h2 id="restore-occ-title" className="text-base font-bold text-slate-900">
            Restore &ldquo;{title}&rdquo;?
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            This occasion will return to the active occasions list with all its participants,
            documents, and scheduling details intact.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onConfirm}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Restore Occasion</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
