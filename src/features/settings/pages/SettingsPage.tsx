import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/context'
import {
  Building2,
  FolderOpen,
  CalendarDays,
  ShieldCheck,
  Users2,
  LockKeyhole,
  ArrowRight,
  Sliders,
} from 'lucide-react'

export function SettingsPage() {
  const { hasPermission } = useAuth()

  const canManageRoles = hasPermission('users.manage_roles') || hasPermission('settings.manage')
  const canViewGroups = hasPermission('groups.view')

  const sections = [
    {
      title: 'Organization Settings',
      description: 'Update NGO name, registration details, contact email, phone, branding logo, and default timezone.',
      to: '/settings/organization',
      icon: Building2,
      badge: 'Profile & Identity',
      visible: true,
    },
    {
      title: 'Document Categories',
      description: 'Manage categorization taxonomy for documents (Minutes, Agreements, Reports, Financials, etc.).',
      to: '/settings/categories',
      icon: FolderOpen,
      badge: 'Taxonomy',
      visible: true,
    },
    {
      title: 'Occasion Types',
      description: 'Configure event and meeting classifications (AGMs, Executive Board, Programs, Community Outreach).',
      to: '/settings/occasion-types',
      icon: CalendarDays,
      badge: 'Calendar',
      visible: true,
    },
    {
      title: 'Roles & Permissions',
      description: 'Inspect portal roles, review granular feature permissions, and configure access authorization.',
      to: '/settings/roles',
      icon: ShieldCheck,
      badge: 'Security & Access',
      visible: canManageRoles,
    },
    {
      title: 'Groups & Committees',
      description: 'Access organizational committees, working departments, leadership appointments, and rosters.',
      to: '/settings/groups',
      icon: Users2,
      badge: 'Structure',
      visible: canViewGroups,
    },
    {
      title: 'Security & Governance',
      description: 'Review database Row Level Security isolation, private storage encryption, and audit policies.',
      to: '/settings/security',
      icon: LockKeyhole,
      badge: 'Infrastructure',
      visible: true,
    },
  ].filter((s) => s.visible)

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-slate-200/80">
        <div className="w-9 h-9 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
          <Sliders className="w-5 h-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Administrative Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure organizational profile, document taxonomies, occasion types, and access controls.
          </p>
        </div>
      </div>

      {/* Settings Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.to}
              to={section.to}
              className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-2xs hover:shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {section.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {section.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {section.description}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 group-hover:text-blue-700">
                <span>Configure</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
