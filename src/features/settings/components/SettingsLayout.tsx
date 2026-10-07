import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context'
import {
  Building2,
  FolderOpen,
  CalendarDays,
  ShieldCheck,
  Users2,
  LockKeyhole,
  Settings as SettingsIcon,
} from 'lucide-react'

export function SettingsLayout() {
  const { hasPermission } = useAuth()
  const location = useLocation()

  const canViewSettings = hasPermission('settings.view')
  const canManageRoles = hasPermission('users.manage_roles') || hasPermission('settings.manage')
  const canViewGroups = hasPermission('groups.view')

  if (!canViewSettings) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <LockKeyhole className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
        <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
          You do not have permission (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded text-rose-700">settings.view</code>) to view the administration settings.
        </p>
      </div>
    )
  }

  const navItems = [
    {
      title: 'Overview',
      to: '/settings',
      end: true,
      icon: SettingsIcon,
      visible: true,
    },
    {
      title: 'Organization',
      to: '/settings/organization',
      icon: Building2,
      visible: canViewSettings,
    },
    {
      title: 'Document Categories',
      to: '/settings/categories',
      icon: FolderOpen,
      visible: canViewSettings,
    },
    {
      title: 'Occasion Types',
      to: '/settings/occasion-types',
      icon: CalendarDays,
      visible: canViewSettings,
    },
    {
      title: 'Roles & Permissions',
      to: '/settings/roles',
      icon: ShieldCheck,
      visible: canManageRoles || canViewSettings,
    },
    {
      title: 'Groups & Committees',
      to: '/settings/groups',
      icon: Users2,
      visible: canViewGroups || canViewSettings,
    },
    {
      title: 'Security',
      to: '/settings/security',
      icon: LockKeyhole,
      visible: canViewSettings,
    },
  ].filter((item) => item.visible)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Secondary Horizontal Tabs Navigation */}
      <div className="bg-white border-b border-slate-200/80 -mx-4 -mt-4 px-4 sm:-mx-6 sm:-mt-6 sm:px-6 pt-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to)

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-700 bg-blue-50/40 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{item.title}</span>
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* Settings Sub-page Content */}
      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  )
}
