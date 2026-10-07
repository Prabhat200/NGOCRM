import { useState } from 'react'
import {
  useNotifications,
  useUnreadNotificationsCount,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../hooks/useNotifications'
import { NotificationItem } from '../components/NotificationItem'
import { Bell, CheckCheck, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)

  const { data: unreadCount = 0 } = useUnreadNotificationsCount()
  const { data, isLoading, isError, error } = useNotifications({
    page,
    pageSize: 20,
    unreadOnly,
  })

  const markReadMutation = useMarkNotificationAsRead()
  const markAllReadMutation = useMarkAllNotificationsAsRead()

  const handleMarkRead = (id: string) => {
    markReadMutation.mutate(id)
  }

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
            <Bell className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personal alerts, document access notices, and organizational updates.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600" />
            <span>Mark all as read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        <button
          type="button"
          onClick={() => {
            setUnreadOnly(false)
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            !unreadOnly
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications
        </button>
        <button
          type="button"
          onClick={() => {
            setUnreadOnly(true)
            setPage(1)
          }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
            unreadOnly
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Unread Only</span>
          {unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                unreadOnly ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-4 bg-white border border-slate-200/80 rounded-xl animate-pulse flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-48" />
                  <div className="h-3 bg-slate-100 rounded w-80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-900">We couldn't load your notifications.</h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            {error instanceof Error ? error.message : 'Please check your connection and try again.'}
          </p>
        </div>
      ) : !data || data.notifications.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200/80 rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">You're all caught up.</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2.5">
            {data.notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/80 text-xs text-slate-600">
              <div>
                Showing page <span className="font-medium text-slate-900">{data.page}</span> of{' '}
                <span className="font-medium text-slate-900">{data.totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  disabled={data.page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
