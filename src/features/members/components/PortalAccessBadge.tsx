import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { PortalStatus } from '../types/member.types'

interface PortalAccessBadgeProps {
  status: PortalStatus
  className?: string
}

const PORTAL_STATUS_CONFIG: Record<
  PortalStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; dotClass: string }
> = {
  no_access: {
    label: 'No Portal Access',
    variant: 'outline',
    dotClass: 'bg-slate-300',
  },
  invited: {
    label: 'Invited',
    variant: 'secondary',
    dotClass: 'bg-amber-400',
  },
  active: {
    label: 'Portal Active',
    variant: 'default',
    dotClass: 'bg-emerald-400',
  },
  suspended: {
    label: 'Portal Suspended',
    variant: 'destructive',
    dotClass: 'bg-amber-500',
  },
  disabled: {
    label: 'Portal Disabled',
    variant: 'destructive',
    dotClass: 'bg-rose-500',
  },
}

export function PortalAccessBadge({ status, className }: PortalAccessBadgeProps) {
  const config = PORTAL_STATUS_CONFIG[status] || PORTAL_STATUS_CONFIG.no_access

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 font-medium text-[11px] px-2 py-0.5',
        status === 'active' && 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
        status === 'invited' && 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} aria-hidden="true" />
      <span>{config.label}</span>
    </Badge>
  )
}
