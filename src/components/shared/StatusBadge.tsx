import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type DocumentStatus = 'draft' | 'under_review' | 'final' | 'archived'
export type OccasionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'former'
export type AnyStatus = DocumentStatus | OccasionStatus | MemberStatus | string

interface StatusConfig {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'
  dotClass: string
}

const STATUS_MAP: Record<string, StatusConfig> = {
  // Documents
  draft: {
    label: 'Draft',
    variant: 'secondary',
    dotClass: 'bg-slate-400',
  },
  under_review: {
    label: 'Under Review',
    variant: 'warning',
    dotClass: 'bg-amber-500',
  },
  final: {
    label: 'Final',
    variant: 'success',
    dotClass: 'bg-emerald-500',
  },
  archived: {
    label: 'Archived',
    variant: 'outline',
    dotClass: 'bg-slate-400',
  },

  // Occasions
  planned: {
    label: 'Planned',
    variant: 'outline',
    dotClass: 'bg-blue-500',
  },
  ongoing: {
    label: 'Ongoing',
    variant: 'warning',
    dotClass: 'bg-amber-500',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'warning',
    dotClass: 'bg-amber-500',
  },
  completed: {
    label: 'Completed',
    variant: 'success',
    dotClass: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'destructive',
    dotClass: 'bg-rose-500',
  },

  // Members / General
  active: {
    label: 'Active',
    variant: 'success',
    dotClass: 'bg-emerald-500',
  },
  inactive: {
    label: 'Inactive',
    variant: 'secondary',
    dotClass: 'bg-slate-400',
  },
  suspended: {
    label: 'Suspended',
    variant: 'destructive',
    dotClass: 'bg-rose-500',
  },
  former: {
    label: 'Former',
    variant: 'outline',
    dotClass: 'bg-slate-400',
  },
}

export interface StatusBadgeProps {
  status: AnyStatus
  className?: string
  showDot?: boolean
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const normalized = status.toLowerCase()
  const config = STATUS_MAP[normalized] || {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    variant: 'outline' as const,
    dotClass: 'bg-slate-400',
  }

  return (
    <Badge
      variant={config.variant}
      className={cn('inline-flex items-center gap-1.5 font-medium text-[11px] px-2 py-0.5', className)}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </Badge>
  )
}
