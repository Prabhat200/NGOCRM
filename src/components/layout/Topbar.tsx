import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Menu,
  Plus,
  Bell,
  User,
  LogOut,
  ChevronDown,
  FilePlus2,
  CalendarPlus,
  UserPlus,
  Search,
} from 'lucide-react'
import { useAuth } from '@/features/auth/context'
import { useNotifications, useUnreadNotificationsCount, useMarkAllNotificationsAsRead } from '@/features/notifications/hooks/useNotifications'
import { getRelativeTime } from '@/features/activity/utils/activityFormatter'

export interface TopbarProps {
  onToggleMobileNav: () => void
}

export function Topbar({ onToggleMobileNav }: TopbarProps) {
  const { user, profile, member, roles, signOut, hasPermission } = useAuth()
  const { data: unreadCount = 0 } = useUnreadNotificationsCount()
  const { data: notificationsData } = useNotifications({ page: 1, pageSize: 5 })
  const previewNotifications = notificationsData?.notifications
  const markAllReadMutation = useMarkAllNotificationsAsRead()
  const navigate = useNavigate()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isAddNewOpen, setIsAddNewOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const addNewRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
      if (addNewRef.current && !addNewRef.current.contains(event.target as Node)) {
        setIsAddNewOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Permission-aware Add New actions (Rule 42)
  const canUploadDoc = hasPermission('documents.create')
  const canCreateOccasion = hasPermission('occasions.create')
  const canAddMember = hasPermission('members.create')
  const hasAnyCreatePermission = canUploadDoc || canCreateOccasion || canAddMember

  // Display Identity (Rule 40 & 43)
  const displayName = member?.full_name || profile?.display_name || user?.email || 'User'
  const primaryRole = member?.position_title || roles[0]?.name || 'Member'
  const initials = displayName.slice(0, 2).toUpperCase()

  const handleSignOut = async () => {
    setIsProfileOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 gap-4">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Button Placeholder (Rule 24 & 41) */}
        <button
          type="button"
          disabled
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 bg-slate-100/70 border border-slate-200/80 rounded-lg cursor-not-allowed opacity-75"
          title="Global search will be enabled in the Documents Archive"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          <span>Search documents...</span>
          <kbd className="ml-2 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Global Action: + Add New (Permission Aware) */}
        {hasAnyCreatePermission && (
          <div className="relative" ref={addNewRef}>
            <button
              type="button"
              onClick={() => setIsAddNewOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
              aria-haspopup="true"
              aria-expanded={isAddNewOpen}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Add New</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" aria-hidden="true" />
            </button>

            {isAddNewOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
              >
                {canUploadDoc && (
                  <Link
                    to="/documents/new"
                    onClick={() => setIsAddNewOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:bg-slate-100"
                    role="menuitem"
                  >
                    <FilePlus2 className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    <span>Upload Document</span>
                  </Link>
                )}

                {canCreateOccasion && (
                  <Link
                    to="/occasions/new"
                    onClick={() => setIsAddNewOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:bg-slate-100"
                    role="menuitem"
                  >
                    <CalendarPlus className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                    <span>Create Occasion</span>
                  </Link>
                )}

                {canAddMember && (
                  <Link
                    to="/members/new"
                    onClick={() => setIsAddNewOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:bg-slate-100"
                    role="menuitem"
                  >
                    <UserPlus className="w-4 h-4 text-purple-600" aria-hidden="true" />
                    <span>Add Member</span>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications Icon Button with Dropdown Preview (Rule 22 & 23) */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 relative cursor-pointer"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-haspopup="true"
            aria-expanded={isNotificationsOpen}
          >
            <Bell className="w-5 h-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-600 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white leading-none shadow-xs"
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
            >
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {previewNotifications && previewNotifications.length > 0 ? (
                  previewNotifications.map((n) => (
                    <Link
                      key={n.id}
                      to="/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className={`block px-4 py-3 hover:bg-slate-50 transition-colors ${
                        !n.is_read ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs ${!n.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      {n.message && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {n.message}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {getRelativeTime(n.created_at)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-500">
                    You're all caught up.
                  </div>
                )}
              </div>

              <div className="px-3 pt-2 border-t border-slate-100">
                <Link
                  to="/notifications"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="block text-center py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50/50 rounded-lg transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile / Avatar Dropdown Menu (Rule 43) */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 cursor-pointer"
            aria-haspopup="true"
            aria-expanded={isProfileOpen}
            aria-label="User account menu"
          >
            <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold shrink-0">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" aria-hidden="true" />
          </button>

          {isProfileOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
            >
              {/* User Identity Summary */}
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {displayName}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {primaryRole}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:bg-slate-100"
                  role="menuitem"
                >
                  <User className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span>My Profile</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 hover:text-rose-800 transition-colors focus-visible:outline-none focus-visible:bg-rose-50 cursor-pointer"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4 text-rose-500" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
