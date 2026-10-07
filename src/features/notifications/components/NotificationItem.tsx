import { Link } from 'react-router-dom'
import { Notification } from '../types/notification.types'
import { getRelativeTime } from '@/features/activity/utils/activityFormatter'
import { Bell, Check, ArrowUpRight, FileText, Calendar, Users, FolderKanban } from 'lucide-react'

interface NotificationItemProps {
  notification: Notification
  onMarkRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const relativeTime = getRelativeTime(notification.created_at)

  // Derive safe target resource link
  let resourceLink: string | undefined = undefined
  if (notification.resource_type && notification.resource_id) {
    switch (notification.resource_type.toLowerCase()) {
      case 'document':
        resourceLink = `/documents/${notification.resource_id}`
        break
      case 'occasion':
        resourceLink = `/occasions/${notification.resource_id}`
        break
      case 'member':
        resourceLink = `/members/${notification.resource_id}`
        break
      case 'group':
        resourceLink = `/groups/${notification.resource_id}`
        break
    }
  }

  const renderIcon = () => {
    switch (notification.resource_type?.toLowerCase()) {
      case 'document':
        return <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
      case 'occasion':
        return <Calendar className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      case 'member':
        return <Users className="w-4 h-4 text-purple-600" aria-hidden="true" />
      case 'group':
        return <FolderKanban className="w-4 h-4 text-amber-600" aria-hidden="true" />
      default:
        return <Bell className="w-4 h-4 text-blue-600" aria-hidden="true" />
    }
  }

  return (
    <div
      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        notification.is_read
          ? 'bg-white border-slate-200/80 hover:bg-slate-50/50'
          : 'bg-blue-50/40 border-blue-200/80 shadow-2xs hover:bg-blue-50/60'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
            notification.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'
          }`}
        >
          {renderIcon()}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {!notification.is_read && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Unread
              </span>
            )}
            <h3
              className={`text-sm tracking-tight ${
                notification.is_read ? 'font-medium text-slate-800' : 'font-bold text-slate-900'
              }`}
            >
              {notification.title}
            </h3>
          </div>

          {notification.message && (
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{notification.message}</p>
          )}

          <div className="flex items-center gap-2 pt-0.5 text-xs text-slate-500">
            <span>{relativeTime}</span>
            {resourceLink && (
              <>
                <span className="text-slate-300">•</span>
                <Link
                  to={resourceLink}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {!notification.is_read && (
        <div className="self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={() => onMarkRead(notification.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Mark as read"
          >
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mark read</span>
          </button>
        </div>
      )}
    </div>
  )
}
