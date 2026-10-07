import { NavLink } from 'react-router-dom'
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '@/lib/constants/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/features/auth/context'

export interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const { hasPermission, organization } = useAuth()

  const visibleMainItems = MAIN_NAV_ITEMS.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
  )

  const visibleSecondaryItems = SECONDARY_NAV_ITEMS.filter(
    (item) => !item.requiredPermission || hasPermission(item.requiredPermission)
  )

  return (
    <aside
      className={cn(
        'w-64 flex flex-col bg-white border-r border-slate-200 select-none h-full',
        className
      )}
      aria-label="Main Navigation"
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-200 shrink-0">
        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-xs shrink-0">
          <img
            src="/favicon.jpg"
            alt="Nyano Paila Initiative"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="overflow-hidden">
          <span className="block font-bold text-slate-900 leading-tight text-base tracking-tight truncate">
            {organization?.short_name || 'Nyano Paila'}
          </span>
          <span className="block text-xs text-slate-500 font-semibold tracking-wide">
            Initiative Portal
          </span>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div>
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
            Operations
          </p>
          <nav className="space-y-1.5" aria-label="Operations Menu">
            {visibleMainItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={onNavigate}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-2.5 text-[15px] font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    )
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>{item.title}</span>
                </NavLink>
              )
            })}
          </nav>
        </div>

        {visibleSecondaryItems.length > 0 && (
          <div>
            <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Administration
            </p>
            <nav className="space-y-1.5" aria-label="Administration Menu">
              {visibleSecondaryItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3.5 py-2.5 text-[15px] font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      )
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span>{item.title}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer / Context info */}
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
        <p className="font-semibold text-slate-800 text-sm truncate">
          {organization?.name || 'Kathmandu, Nepal'}
        </p>
        <p className="text-slate-500 font-medium mt-0.5">
          Timezone: {organization?.timezone || 'Asia/Kathmandu'}
        </p>
      </div>
    </aside>
  )
}
