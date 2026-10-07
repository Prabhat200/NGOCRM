import { useState, useCallback, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { ToastContext, type ToastItem } from './useToast'



export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9)
      const newItem: ToastItem = { id, type, title, message, duration }

      setToasts((prev) => [...prev, newItem])

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id)
        }, duration)
      }
    },
    [dismiss]
  )

  const success = useCallback(
    (message: string, title?: string) => toast({ type: 'success', title, message }),
    [toast]
  )
  const error = useCallback(
    (message: string, title?: string) => toast({ type: 'error', title, message }),
    [toast]
  )
  const info = useCallback(
    (message: string, title?: string) => toast({ type: 'info', title, message }),
    [toast]
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      <aside
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-start gap-3 p-4 rounded-lg bg-white border border-slate-200 shadow-sm transition-all"
          >
            {item.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            {item.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            {item.type === 'info' && (
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="flex-1 min-w-0">
              {item.title && (
                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              )}
              <p className="text-sm text-slate-600 leading-snug">{item.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </aside>
    </ToastContext.Provider>
  )
}
