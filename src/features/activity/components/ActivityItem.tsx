import { Link } from 'react-router-dom'
import { ActivityLogItem } from '../types/activity.types'
import { formatActivity } from '../utils/activityFormatter'
import {
  FileText,
  Calendar,
  Users,
  FolderKanban,
  Shield,
  Settings,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

interface ActivityItemProps {
  log: ActivityLogItem
  timezone?: string
}

export function ActivityItem({ log, timezone = 'Asia/Kathmandu' }: ActivityItemProps) {
  const formatted = formatActivity(log, timezone)

  // Icon for category
  const renderCategoryIcon = () => {
    switch (formatted.badgeVariant) {
      case 'blue':
        return <FileText className="w-4 h-4 text-blue-600" aria-hidden="true" />
      case 'emerald':
        return <Calendar className="w-4 h-4 text-emerald-600" aria-hidden="true" />
      case 'purple':
        return <Users className="w-4 h-4 text-purple-600" aria-hidden="true" />
      case 'amber':
        return <FolderKanban className="w-4 h-4 text-amber-600" aria-hidden="true" />
      case 'rose':
        return <Shield className="w-4 h-4 text-rose-600" aria-hidden="true" />
      default:
        return <Settings className="w-4 h-4 text-slate-500" aria-hidden="true" />
    }
  }

  const initials = formatted.actor.slice(0, 2).toUpperCase()

  return (
    <div className="p-4 bg-white hover:bg-slate-50/80 transition-colors border border-slate-200/80 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3.5">
        {/* Actor Avatar / Icon Badge */}
        <div className="relative shrink-0 mt-0.5">
          {log.actor_avatar ? (
            <img
              src={log.actor_avatar}
              alt={formatted.actor}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold text-xs border border-slate-200">
              {initials}
            </div>
          )}
          <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white shadow-2xs">
            {renderCategoryIcon()}
          </span>
        </div>

        {/* Narrative Description */}
        <div className="space-y-1">
          <p className="text-sm text-slate-800 leading-snug">
            <span className="font-semibold text-slate-900">{formatted.actor}</span>{' '}
            <span className="text-slate-600">{formatted.description}</span>{' '}
            {formatted.resourceTitle && (
              formatted.resourceLink ? (
                <Link
                  to={formatted.resourceLink}
                  className="font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>{formatted.resourceTitle}</span>
                  <ArrowUpRight className="w-3 h-3 inline shrink-0 opacity-60" aria-hidden="true" />
                </Link>
              ) : (
                <span className="font-medium text-slate-900">{formatted.resourceTitle}</span>
              )
            )}
          </p>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="font-medium">{formatted.timestamp}</span>
            {formatted.relativeTime && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">({formatted.relativeTime})</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Entity badge */}
      <div className="shrink-0 self-start sm:self-center pl-12 sm:pl-0">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
          {log.entity_type}
        </span>
      </div>
    </div>
  )
}
