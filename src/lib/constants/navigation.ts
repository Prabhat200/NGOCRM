import {
  LayoutDashboard,
  FileText,
  Calendar,
  Users,
  FolderKanban,
  Activity,
  Bell,
  Settings,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: typeof LayoutDashboard
  badge?: string
  requiredPermission?: string
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Documents',
    href: '/documents',
    icon: FileText,
    requiredPermission: 'documents.view',
  },
  {
    title: 'Occasions',
    href: '/occasions',
    icon: Calendar,
    requiredPermission: 'occasions.view',
  },
  {
    title: 'Members',
    href: '/members',
    icon: Users,
    requiredPermission: 'members.view',
  },
  {
    title: 'Groups',
    href: '/groups',
    icon: FolderKanban,
    requiredPermission: 'groups.view',
  },
  {
    title: 'Activity',
    href: '/activity',
    icon: Activity,
    requiredPermission: 'audit.view',
  },
]

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    title: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermission: 'settings.view',
  },
]
